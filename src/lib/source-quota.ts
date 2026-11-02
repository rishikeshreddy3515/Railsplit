// ── Source-Origin Quota ("Source Quota Hack") Optimization Engine ──
//
// Background:
// In Indian Railways (IRCTC), intermediate stations are allocated limited quotas
// (Pooled Quota / PQWL or Remote Location / RLWL) that quickly waitlist.
// However, the train's originating terminal (or major upstream quota station)
// holds the bulk General Quota (GNWL), which frequently retains confirmed seats!
//
// Legally & practically:
// A passenger can book their ticket from the train's origin station (paying the
// small telescopic fare difference) and select their actual departure station as their
// official "Boarding Point" in IRCTC. The berth is reserved exclusively for them.
//
// Constraints:
// 1. Only suggest Source Quota if the passenger's departure station is a confirmed,
//    scheduled halt on that train's route.
// 2. Always include the mandatory operational notice:
//    "Change boarding point on IRCTC at least 24 hrs before departure."

import {
  Station,
  TrainRoute,
  TravelClass,
  SectionAvailability,
  SourceQuotaTip,
  DataProvider,
} from './types';
import { isSameOrEquivalentStation } from './utils';

export const BOARDING_CHANGE_REMINDER =
  'Change boarding point on IRCTC at least 24 hrs before departure.';

/**
 * Evaluates whether an upstream origin station holds confirmed General Quota (GNWL)
 * for a journey that is currently waitlisted or RAC.
 */
export async function findSourceQuotaOpportunity(
  provider: DataProvider,
  train: TrainRoute,
  fromStation: Station,
  toStation: Station,
  date: string,
  travelClass: TravelClass,
  currentAvail: SectionAvailability
): Promise<SourceQuotaTip | undefined> {
  // Only evaluate if direct seat is not comfortably confirmed (WAITLIST or RAC)
  if (currentAvail.status !== 'WAITLIST' && currentAvail.status !== 'RAC') {
    return undefined;
  }

  // 1. Strictly verify the user's boarding station is a confirmed scheduled halt on this train
  const fromIdx = train.stops.findIndex((s) => isSameOrEquivalentStation(s.station.code, fromStation.code));
  const toIdx = train.stops.findIndex((s) => isSameOrEquivalentStation(s.station.code, toStation.code));

  if (fromIdx <= 0 || toIdx <= fromIdx) {
    // Boarding station is not an intermediate halt on this train, or invalid order
    return undefined;
  }

  const boardingStop = train.stops[fromIdx];
  // Must be an active scheduled halt with a departure timing
  if (!boardingStop || boardingStop.departure === null) {
    return undefined;
  }

  // Candidate upstream stations: Train origin (stops[0]) is the prime candidate
  const candidateUpstreamStops = [train.stops[0]];

  // If there are multiple stops before fromIdx, also consider intermediate major stop
  if (fromIdx > 2) {
    candidateUpstreamStops.push(train.stops[Math.floor(fromIdx / 2)]);
  }

  for (const upstreamStop of candidateUpstreamStops) {
    if (upstreamStop.station.code === fromStation.code) continue;

    try {
      const upstreamAvail = await provider.checkAvailability(
        train.trainNumber,
        upstreamStop.station.code,
        toStation.code,
        date,
        travelClass
      );

      if (upstreamAvail.status === 'CONFIRMED' && upstreamAvail.fare !== null) {
        const extraFare = Math.max(
          40,
          currentAvail.fare ? upstreamAvail.fare - currentAvail.fare : 120
        );

        const availableSeatsMatch = upstreamAvail.statusDetail?.match(/\d+/);
        const availableSeats = availableSeatsMatch ? parseInt(availableSeatsMatch[0], 10) : 12;

        return {
          trainNumber: train.trainNumber,
          trainName: train.trainName,
          bookFrom: upstreamStop.station,
          boardAt: fromStation,
          destination: toStation,
          availableSeats,
          statusDetail: upstreamAvail.statusDetail || 'AVAILABLE',
          originalStatusDetail: currentAvail.statusDetail || currentAvail.status,
          extraFare,
          totalFare: upstreamAvail.fare,
          explanation: `Train #${train.trainNumber} has exhausted pooled quota at ${fromStation.name} (${currentAvail.statusDetail || currentAvail.status}), but has ${availableSeats} confirmed seats under General Quota from ${upstreamStop.station.name}. Book from ${upstreamStop.station.name} (${upstreamStop.station.code}) and set your IRCTC boarding point to ${fromStation.name} (${fromStation.code}) to travel confirmed for ₹${extraFare} extra. ${BOARDING_CHANGE_REMINDER}`,
          boardingChangeReminder: BOARDING_CHANGE_REMINDER,
        };
      }
    } catch {
      // Continue to next candidate
    }
  }

  return undefined;
}
