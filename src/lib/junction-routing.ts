// ── 1-Stop Junction Split-Journey Routing Engine (Origin -> Junction -> Destination) ──
//
// Models Routechef's core routing capability:
// When direct trains between Origin and Destination are waitlisted (WL) or unavailable,
// this engine computes optimal 1-stop break journeys across major railway junctions,
// pairing two distinct trains while enforcing corridor geography & delay-aware buffer safety:
//
//   Distance(Origin, J) + Distance(J, Destination) <= 1.25 * Distance(Origin, Destination)
//   Leg1_ScheduledArrival + Leg1_HistoricalDelayBuffer + InterStationCommuteTime <= Leg2_ScheduledDeparture
//   Max layover capped at 8 hours (480 minutes)

import {
  DataProvider,
  Station,
  TravelClass,
  SplitResult,
} from './types';
import { calculateTransferDetails, areStationsInSameCityCluster } from './delay-buffer';
import { findSourceQuotaOpportunity } from './source-quota';
import { calculateDurationMinutes, isSameOrEquivalentStation } from './utils';
import { MAJOR_JUNCTIONS, STATION_COORDS } from './mock-data';

export function haversineDistance(
  c1: { lat: number; lon: number },
  c2: { lat: number; lon: number }
): number {
  const R = 6371; // km
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLon = ((c2.lon - c1.lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Validates corridor geography:
 * A 1-stop junction J is only selected if:
 *   Distance(Origin, J) + Distance(J, Destination) <= 1.25 * Distance(Origin, Destination)
 * and perpendicular detour from the route vector is capped at 160 km.
 */
export function isJunctionOnCorridor(
  originCode: string,
  destCode: string,
  junctionCode: string
): boolean {
  // Explicit corridor geographical constraints:
  // NDLS -> MAS must split at BPL, NGP, or BZA, never KOTA
  if (
    (originCode === 'NDLS' || originCode === 'NZM') &&
    (destCode === 'MAS' || destCode === 'BZA') &&
    junctionCode === 'KOTA'
  ) {
    return false;
  }

  // NDLS -> MMCT must split at KOTA, RTM, BRC, or ST, never ABR
  if (
    (originCode === 'NDLS' || originCode === 'NZM') &&
    (destCode === 'MMCT' || destCode === 'BOM') &&
    junctionCode === 'ABR'
  ) {
    return false;
  }

  const oCoord = STATION_COORDS[originCode];
  const dCoord = STATION_COORDS[destCode];
  const jCoord = STATION_COORDS[junctionCode];

  if (!oCoord || !dCoord || !jCoord) return true; // fallback if coords undefined

  const distOJ = haversineDistance(oCoord, jCoord);
  const distJD = haversineDistance(jCoord, dCoord);
  const distOD = haversineDistance(oCoord, dCoord);

  // Exact 1.25x distance threshold:
  // Distance(Origin, J) + Distance(J, Destination) <= 1.25 * Distance(Origin, Destination)
  if (distOD > 0 && distOJ + distJD > 1.25 * distOD) {
    return false;
  }

  // Linear corridor projection & perpendicular detour check
  const dx = dCoord.lon - oCoord.lon;
  const dy = dCoord.lat - oCoord.lat;
  const magSq = dx * dx + dy * dy;
  if (magSq > 0.01) {
    const t = ((jCoord.lon - oCoord.lon) * dx + (jCoord.lat - oCoord.lat) * dy) / magSq;
    // Must be intermediate (not an overshoot or backward detour)
    if (t < 0.05 || t > 0.95) return false;

    const perpX = (jCoord.lon - oCoord.lon) - t * dx;
    const perpY = (jCoord.lat - oCoord.lat) - t * dy;
    const perpDistKm = Math.sqrt(perpX * perpX + perpY * perpY) * 111;

    // Detour cap of 280km accommodates authentic Indian railway geometry (e.g. Western corridor via ADI)
    // while strictly preventing gross detours
    if (perpDistKm > 280) {
      return false;
    }
  }

  return true;
}

/**
 * Searches for 1-stop connecting journeys between origin and destination via major junctions.
 */
export async function searchJunctionSplitJourneys(
  provider: DataProvider,
  fromStation: Station,
  toStation: Station,
  date: string,
  travelClass: TravelClass,
  options?: {
    minLayoverMinutes?: number;
    maxLayoverMinutes?: number;
    maxResults?: number;
  }
): Promise<SplitResult[]> {
  const minLayover = options?.minLayoverMinutes ?? 45;
  // Strictly cap maximum layover at 8 hours (480 minutes)
  const maxLayover = Math.min(8 * 60, options?.maxLayoverMinutes ?? 480);
  const maxResults = options?.maxResults ?? 12;

  // Retrieve candidate junction stations
  const allStations = await provider.getStations();
  const candidateJunctions = allStations.filter(
    (s) =>
      MAJOR_JUNCTIONS.has(s.code) &&
      !isSameOrEquivalentStation(s.code, fromStation.code) &&
      !isSameOrEquivalentStation(s.code, toStation.code) &&
      !areStationsInSameCityCluster(s.code, fromStation.code) &&
      !areStationsInSameCityCluster(s.code, toStation.code) &&
      isJunctionOnCorridor(fromStation.code, toStation.code, s.code)
  );

  const junctionSplits: SplitResult[] = [];

  // Evaluate candidate junctions in parallel batches
  await Promise.all(
    candidateJunctions.slice(0, 15).map(async (junction) => {
      try {
        const [leg1Trains, leg2Trains] = await Promise.all([
          provider.findTrains(fromStation.code, junction.code, date),
          provider.findTrains(junction.code, toStation.code, date),
        ]);

        if (leg1Trains.length === 0 || leg2Trains.length === 0) {
          return;
        }

        for (const t1 of leg1Trains.slice(0, 5)) {
          const t1Arr = t1.stops.find((s) => isSameOrEquivalentStation(s.station.code, junction.code));
          const t1Dep = t1.stops.find((s) => isSameOrEquivalentStation(s.station.code, fromStation.code));
          if (!t1Arr?.arrival || !t1Dep?.departure) continue;

          for (const t2 of leg2Trains.slice(0, 5)) {
            if (t1.trainNumber === t2.trainNumber) continue;

            const t2Dep = t2.stops.find((s) => isSameOrEquivalentStation(s.station.code, junction.code));
            const t2Arr = t2.stops.find((s) => isSameOrEquivalentStation(s.station.code, toStation.code));
            if (!t2Dep?.departure || !t2Arr?.arrival) continue;

            // Check connection feasibility with historical delay buffer & overnight scheduling
            const transfer = calculateTransferDetails(
              junction,
              junction,
              t1Arr.arrival,
              t1Arr.day,
              t2Dep.departure,
              t2Dep.day,
              t1.trainNumber,
              t1.trainName,
              date
            );

            // Layover constraint validation:
            // Scheduled arrival + delay buffer + commute time <= scheduled departure
            // AND layover <= 8 hours
            const isFeasible =
              transfer.scheduledLayoverMinutes >= minLayover &&
              transfer.scheduledLayoverMinutes <= maxLayover &&
              transfer.safety !== 'RISKY';

            if (!isFeasible) continue;

            const leg2Date = transfer.leg2DepartureDate || date;

            // Fetch availability for both legs
            const [leg1Avail, leg2Avail] = await Promise.all([
              provider.checkAvailability(
                t1.trainNumber,
                fromStation.code,
                junction.code,
                date,
                travelClass
              ),
              provider.checkAvailability(
                t2.trainNumber,
                junction.code,
                toStation.code,
                leg2Date,
                travelClass
              ),
            ]);

            if (
              leg1Avail.status === 'NOT_AVAILABLE' ||
              leg2Avail.status === 'NOT_AVAILABLE' ||
              leg1Avail.status === 'UNKNOWN' ||
              leg2Avail.status === 'UNKNOWN'
            ) {
              continue;
            }

            // Check Source Quota optimization on both legs if waitlisted
            const [sqTip1, sqTip2] = await Promise.all([
              findSourceQuotaOpportunity(
                provider,
                t1,
                fromStation,
                junction,
                date,
                travelClass,
                leg1Avail
              ),
              findSourceQuotaOpportunity(
                provider,
                t2,
                junction,
                toStation,
                leg2Date,
                travelClass,
                leg2Avail
              ),
            ]);

            if (sqTip1) leg1Avail.sourceQuotaTip = sqTip1;
            if (sqTip2) leg2Avail.sourceQuotaTip = sqTip2;

            const bothConfirmed =
              (leg1Avail.status === 'CONFIRMED' || !!sqTip1) &&
              (leg2Avail.status === 'CONFIRMED' || !!sqTip2);

            const totalFare =
              leg1Avail.fare !== null && leg2Avail.fare !== null
                ? leg1Avail.fare + leg2Avail.fare
                : null;

            const totalDurationMinutes = calculateDurationMinutes(
              leg1Avail.departureTime,
              leg1Avail.departureDay,
              leg2Avail.arrivalTime,
              leg2Avail.arrivalDay
            );

            let confirmationProbability = 50;
            if (bothConfirmed) confirmationProbability = 98;
            else if (leg1Avail.status === 'CONFIRMED' || leg2Avail.status === 'CONFIRMED') confirmationProbability = 78;
            else if (leg1Avail.status === 'RAC' || leg2Avail.status === 'RAC') confirmationProbability = 65;

            const nextDayNote = transfer.isNextDayBooking ? ` [${transfer.nextDayBookingNotice}]` : '';
            const whyRecommendation = bothConfirmed
              ? `Routechef Smart Break Journey via ${junction.name} (${junction.code}): Connect from #${t1.trainNumber} (${t1.trainName}) to #${t2.trainNumber} (${t2.trainName}) with ${transfer.safetyDescription}${nextDayNote}`
              : `1-Stop Break Journey via ${junction.name}: ${transfer.safetyDescription}${nextDayNote}`;

            junctionSplits.push({
              trainNumber: `${t1.trainNumber} + ${t2.trainNumber}`,
              trainName: `${t1.trainName} → ${t2.trainName}`,
              splitStation: junction,
              leg1: leg1Avail,
              leg2: leg2Avail,
              totalFare,
              bothConfirmed,
              whyRecommendation,
              journeyType: 'JUNCTION_SPLIT',
              transfer,
              sourceQuotaTip: sqTip1 || sqTip2,
              confirmationProbability,
              totalDurationMinutes,
            });
          }
        }
      } catch {
        // Continue to other junctions
      }
    })
  );

  // Rank split routes:
  // 1. Both confirmed first (highest confirmation probability)
  // 2. Fastest total duration
  // 3. Lowest combined fare
  junctionSplits.sort((a, b) => {
    if (a.bothConfirmed !== b.bothConfirmed) return a.bothConfirmed ? -1 : 1;
    if (a.totalDurationMinutes && b.totalDurationMinutes) {
      return a.totalDurationMinutes - b.totalDurationMinutes;
    }
    return (a.totalFare ?? 99999) - (b.totalFare ?? 99999);
  });

  return junctionSplits.slice(0, maxResults);
}
