// ── Split-search engine powered by Hop-Constrained Same-Train Dijkstra ──
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

/**
 * Given a train's ordered stops and origin/destination,
 * returns valid intermediate stations (between origin and destination).
 */
export function findIntermediateStops(
  stops: StopTiming[],
  originCode: string,
  destCode: string
): StopTiming[] {
  const originIdx = stops.findIndex((s) => s.station.code === originCode);
  const destIdx = stops.findIndex((s) => s.station.code === destCode);

  if (originIdx === -1 || destIdx === -1 || originIdx >= destIdx) {
    return [];
  }

  // Intermediate stops are strictly between origin and destination
  return stops.slice(originIdx + 1, destIdx);
}

/**
 * Main split-search function powered by Same-Train Dijkstra.
 *
 * 1. Finds trains running between origin and destination.
 * 2. For each train, checks direct availability (1-hop edge).
 * 3. Finds valid intermediate stops from the train's route.
 * 4. Checks both split sections independently (same train, date, class).
 * 5. Uses Dijkstra's algorithm to compute optimal cutpoints and edge costs.
 * 6. Strictly enforces that both sections belong to the SAME train.
 * 7. Only marks a split confirmed if BOTH sections are independently CONFIRMED.
 */
export async function searchSplitJourneys(
  provider: DataProvider,
  request: SearchRequest
): Promise<SearchResponse> {
  const { from, to, date, travelClass } = request;

  // Find trains that serve both stations in correct order
  const trains = await provider.findTrains(from.code, to.code, date);

  if (trains.length === 0) {
    return {
      request,
      directResults: [],
      splitResults: [],
      message: `No trains found between ${from.name} and ${to.name} on ${date}.`,
    };
  }

  const directResults: DirectResult[] = [];
  const splitResults: SplitResult[] = [];
  let aggregateMetrics: GraphExecutionMetrics | undefined;

  for (const train of trains) {
    // Check direct availability (1-hop edge in Dijkstra graph)
    const directAvail = await provider.checkAvailability(
      train.trainNumber,
      from.code,
      to.code,
      date,
      travelClass
    );

    directResults.push({
      ...directAvail,
      stops: train.stops,
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

    // Query sub-segment availabilities in parallel
    const leg1Map = new Map<string, SectionAvailability>();
    const leg2Map = new Map<string, SectionAvailability>();

    await Promise.all(
      intermediates.map(async (splitStop) => {
        const [leg1, leg2] = await Promise.all([
          provider.checkAvailability(
            train.trainNumber,
            from.code,
            splitStop.station.code,
            date,
            travelClass
          ),
          provider.checkAvailability(
            train.trainNumber,
            splitStop.station.code,
            to.code,
            date,
            travelClass
          ),
        ]);

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
    directResults.every((d) => d.status !== 'CONFIRMED') &&
    confirmedSplits.length === 0
      ? 'No confirmed availability found. Try a different date or class.'
      : null;

  return {
    request,
    directResults,
    splitResults,
    message,
    graphMetrics: aggregateMetrics,
  };
}
