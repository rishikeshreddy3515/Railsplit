// ── Split-search engine powered by Hop-Constrained Same-Train Dijkstra & Junction Routing ──
// Pure logic, zero UI dependencies. Fully testable.

import {
  DataProvider,
  SearchRequest,
  SearchResponse,
  DirectResult,
  SplitResult,
  StopTiming,
  SectionAvailability,
  GraphExecutionMetrics,
} from './types';
import { runSameTrainDijkstraWithTrace } from './dijkstra-split';
import { searchJunctionSplitJourneys } from './junction-routing';
import { findSourceQuotaOpportunity } from './source-quota';
import { getHistoricalDelay } from './delay-buffer';
import { getMultiModalOptions } from './multi-modal';
import { calculateDurationMinutes, isSameOrEquivalentStation } from './utils';
import { MockDataProvider } from './mock-data';

const fallbackMockProvider = new MockDataProvider();

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Given a train's ordered stops and origin/destination,
 * returns valid intermediate stations (between origin and destination).
 */
export function findIntermediateStops(
  stops: StopTiming[],
  originCode: string,
  destCode: string
): StopTiming[] {
  const originIdx = stops.findIndex((s) => isSameOrEquivalentStation(s.station.code, originCode));
  const destIdx = stops.findIndex((s) => isSameOrEquivalentStation(s.station.code, destCode));

  if (originIdx === -1 || destIdx === -1 || originIdx >= destIdx) {
    return [];
  }

  // Intermediate stops are strictly between origin and destination
  return stops.slice(originIdx + 1, destIdx);
}

/**
 * Main split-search function powered by Same-Train Dijkstra & Junction Break Routing.
 *
 * 1. Finds direct trains running between origin and destination.
 * 2. Evaluates direct availability, historical delay stats, and Source Quota Hack.
 * 3. Finds valid intermediate stops and executes Same-Train Dijkstra algorithm.
 * 4. Always computes and returns top-ranked 1-stop junction split journeys alongside direct trains.
 * 5. Generates Multi-Modal (Train + Flight) fallback options for long routes.
 */
export async function searchSplitJourneys(
  provider: DataProvider,
  request: SearchRequest
): Promise<SearchResponse> {
  const { from, to, date, travelClass } = request;

  // Find trains that serve both stations in correct order
  const trains = await provider.findTrains(from.code, to.code, date);

  const directResults: DirectResult[] = [];
  const splitResults: SplitResult[] = [];
  let aggregateMetrics: GraphExecutionMetrics | undefined;
  let hasPartialFallback = false;

  for (const train of trains) {
    // Check direct availability (1-hop edge in Dijkstra graph)
    const directAvail = await provider.checkAvailability(
      train.trainNumber,
      from.code,
      to.code,
      date,
      travelClass
    );

    const delayInfo = getHistoricalDelay(train.trainNumber, train.trainName);

    // Evaluate Source Quota Hack for direct route if waitlisted
    const sourceQuotaTip = await findSourceQuotaOpportunity(
      provider,
      train,
      from,
      to,
      date,
      travelClass,
      directAvail
    );

    directResults.push({
      ...directAvail,
      stops: train.stops,
      historicalDelay: delayInfo,
      sourceQuotaTip,
    });

    // Check if splits should be evaluated
    if (request.includeSplits === false) {
      continue;
    }

    if (request.trainNumber && train.trainNumber !== request.trainNumber) {
      continue;
    }

    // Find intermediate stops (candidate 2-hop Dijkstra split points)
    const intermediates = findIntermediateStops(
      train.stops,
      from.code,
      to.code
    );

    if (intermediates.length === 0) {
      continue;
    }

    // Query sub-segment availabilities in parallel with resilient per-leg fallback on 429 / failure
    const leg1Map = new Map<string, SectionAvailability>();
    const leg2Map = new Map<string, SectionAvailability>();

    await Promise.all(
      intermediates.map(async (splitStop) => {
        let leg1: SectionAvailability;
        let leg2: SectionAvailability;

        try {
          leg1 = await provider.checkAvailability(
            train.trainNumber,
            from.code,
            splitStop.station.code,
            date,
            travelClass
          );
        } catch {
          hasPartialFallback = true;
          leg1 = await fallbackMockProvider.checkAvailability(
            train.trainNumber,
            from.code,
            splitStop.station.code,
            date,
            travelClass
          );
        }

        try {
          leg2 = await provider.checkAvailability(
            train.trainNumber,
            splitStop.station.code,
            to.code,
            date,
            travelClass
          );
        } catch {
          hasPartialFallback = true;
          leg2 = await fallbackMockProvider.checkAvailability(
            train.trainNumber,
            splitStop.station.code,
            to.code,
            date,
            travelClass
          );
        }

        leg1Map.set(splitStop.station.code, leg1);
        leg2Map.set(splitStop.station.code, leg2);
      })
    );

    // Run Dijkstra algorithm on this train's stop-state DAG with metric collection
    const { results: trainSplits, metrics: trainMetrics } = runSameTrainDijkstraWithTrace(
      train.trainNumber,
      train.trainName,
      intermediates,
      leg1Map,
      leg2Map
    );

    // Enrich same-train splits with transfer safety invariance and exact PNR #2 calendar dates
    for (const split of trainSplits) {
      split.journeyType = 'SAME_TRAIN';
      split.confirmationProbability = split.bothConfirmed ? 99 : 70;
      split.totalDurationMinutes = calculateDurationMinutes(
        split.leg1.departureTime,
        split.leg1.departureDay,
        split.leg2.arrivalTime,
        split.leg2.arrivalDay
      );

      // Compute exact calendar date for Leg 2 when train crosses midnight
      const leg1DepDay = split.leg1.departureDay || 1;
      const leg2DepDay = split.leg2.departureDay || 1;
      const dayOffset = Math.max(0, leg2DepDay - leg1DepDay);
      const isNextDay = dayOffset > 0;
      const leg2Date = isNextDay ? addDaysToDate(date, dayOffset) : date;
      split.leg2.date = leg2Date;

      split.transfer = {
        fromStation: split.splitStation,
        toStation: split.splitStation,
        isCrossStation: false,
        commuteMinutes: 0,
        commuteInstruction: 'Same physical train rake. You switch to your confirmed berth at this halt.',
        scheduledLayoverMinutes: 0,
        leg1HistoricalDelayMinutes: delayInfo.averageDelayMinutes,
        predictedWaitMinutes: 0,
        safety: 'SAFE',
        safetyLabel: 'Safe Connection',
        safetyDescription: 'Same train · Zero transfer risk (stay onboard)',
        isNextDayBooking: isNextDay,
        leg2DepartureDate: leg2Date,
        nextDayBookingNotice: isNextDay
          ? `Important IRCTC Rule: Book PNR #1 (${from.code} -> ${split.splitStation.code}) for ${date}, and book PNR #2 (${split.splitStation.code} -> ${to.code}) for ${leg2Date} (when the train arrives at ${split.splitStation.name}).`
          : undefined,
      };

      if (directAvail.fare !== null && split.totalFare !== null) {
        split.directFareComparison = {
          directFare: directAvail.fare,
          splitFare: split.totalFare,
          fareDifference: split.totalFare - directAvail.fare,
        };
      }
    }

    splitResults.push(...trainSplits);

    if (!aggregateMetrics) {
      aggregateMetrics = { ...trainMetrics, traces: [...trainMetrics.traces] };
    } else {
      aggregateMetrics.verticesCount += trainMetrics.verticesCount;
      aggregateMetrics.edgesEvaluated += trainMetrics.edgesEvaluated;
      aggregateMetrics.executionTimeMs = Number(
        (aggregateMetrics.executionTimeMs + trainMetrics.executionTimeMs).toFixed(3)
      );
      aggregateMetrics.intermediateCandidatesCount += trainMetrics.intermediateCandidatesCount;
      aggregateMetrics.traces.push(...trainMetrics.traces);
    }
  }

  // 1-Stop Junction Split-Journey Routing Engine (Origin -> Junction -> Destination)
  // Always evaluates and returns top ranked junction split/break-journey options alongside direct trains
  const shouldEvaluateJunctionSplits =
    request.includeJunctionSplits !== false && request.includeSplits !== false;

  if (shouldEvaluateJunctionSplits) {
    try {
      const junctionSplits = await searchJunctionSplitJourneys(
        provider,
        from,
        to,
        date,
        travelClass,
        {
          minLayoverMinutes: request.minLayoverMinutes,
          maxLayoverMinutes: request.maxLayoverMinutes,
        }
      );
      splitResults.push(...junctionSplits);
    } catch (err) {
      console.warn('Junction split search encountered an issue:', err);
    }
  }

  // Multi-Modal fallback alternatives
  const multiModalOptions = getMultiModalOptions(from, to, date, travelClass);

  // Global sort: confirmed pairs first, then lowest total fare
  splitResults.sort((a, b) => {
    if (a.bothConfirmed !== b.bothConfirmed) {
      return a.bothConfirmed ? -1 : 1;
    }
    if (a.totalFare !== null && b.totalFare !== null) {
      return a.totalFare - b.totalFare;
    }
    return 0;
  });

  const confirmedSplits = splitResults.filter((s) => s.bothConfirmed);
  const message =
    trains.length === 0 && splitResults.length === 0
      ? `No trains found between ${from.name} and ${to.name} on ${date}.`
      : directResults.every((d) => d.status !== 'CONFIRMED') &&
        confirmedSplits.length === 0
      ? 'No confirmed availability found. Try a different date or class.'
      : null;

  // Ensure direct fare comparison is populated on all split results
  const minDirectFare = directResults.find((d) => d.fare !== null)?.fare ?? null;
  if (minDirectFare !== null) {
    for (const split of splitResults) {
      if (!split.directFareComparison && split.totalFare !== null) {
        split.directFareComparison = {
          directFare: minDirectFare,
          splitFare: split.totalFare,
          fareDifference: split.totalFare - minDirectFare,
        };
      }
    }
  }

  return {
    request,
    directResults,
    splitResults,
    multiModalOptions,
    message,
    graphMetrics: aggregateMetrics,
    partialFallback: hasPartialFallback,
  };
}
