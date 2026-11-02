// ── Historical Delay & Inter-Station Transfer Buffer Engine ──
//
// Calculates realistic connection feasibility for split journeys using:
//   Leg1_ScheduledArrival + Leg1_HistoricalDelayBuffer + InterStationCommuteTime <= Leg2_ScheduledDeparture
//
// Features:
// 1. Same-station connection verification (min 35m + historical delay)
// 2. Cross-station city cluster transit times (e.g. NDLS <-> NZM, CSMT <-> LTT, HWH <-> SDAH)
// 3. Realistic train delay profiles by train category & number
// 4. Layover Safety Indicator (Safe Connection, Moderate Buffer, Tight / Risky)
// 5. Overnight & Next-Day (+1 Day) connection scheduling with max 8h cap

import { Station, HistoricalDelayInfo, TransferDetails, LayoverSafety } from './types';

// ── City Station Clusters & Cross-Station Commute Matrix ──

export interface CityClusterConfig {
  cluster: string;
  cityName: string;
  stations: string[];
}

export const CITY_CLUSTERS: CityClusterConfig[] = [
  {
    cluster: 'DELHI',
    cityName: 'Delhi NCR',
    stations: ['NDLS', 'NZM', 'DLI', 'DEL', 'ANVT'],
  },
  {
    cluster: 'MUMBAI',
    cityName: 'Mumbai Metropolitan',
    stations: ['CSMT', 'BOM', 'MMCT', 'LTT', 'BDTS', 'BSR', 'KYN', 'PNVL', 'BVI'],
  },
  {
    cluster: 'KOLKATA',
    cityName: 'Kolkata Metro',
    stations: ['HWH', 'SDAH', 'KOAA'],
  },
  {
    cluster: 'BENGALURU',
    cityName: 'Bengaluru Metro',
    stations: ['SBC', 'YPR', 'SMVB'],
  },
  {
    cluster: 'HYDERABAD',
    cityName: 'Hyderabad Twin Cities',
    stations: ['SC', 'HYB', 'KCG'],
  },
];

// Commute durations (minutes) and recommended transport between nearby stations in same city
const CROSS_STATION_COMMUTE: Record<string, { minutes: number; instruction: string }> = {
  // Delhi
  'NDLS:NZM': { minutes: 40, instruction: 'Delhi Metro Yellow/Violet Line or cab (~40 mins, 9 km)' },
  'NZM:NDLS': { minutes: 40, instruction: 'Delhi Metro Violet/Yellow Line or cab (~40 mins, 9 km)' },
  'NDLS:DLI': { minutes: 25, instruction: 'Delhi Metro Yellow Line (~25 mins, 4 km)' },
  'DLI:NDLS': { minutes: 25, instruction: 'Delhi Metro Yellow Line (~25 mins, 4 km)' },
  'NZM:DLI': { minutes: 45, instruction: 'Delhi Metro Violet Line to Kashmere Gate or cab (~45 mins)' },
  'DLI:NZM': { minutes: 45, instruction: 'Delhi Metro Violet Line from Kashmere Gate or cab (~45 mins)' },
  'NDLS:ANVT': { minutes: 45, instruction: 'Delhi Metro Blue Line to Anand Vihar (~45 mins)' },
  'ANVT:NDLS': { minutes: 45, instruction: 'Delhi Metro Blue Line to New Delhi (~45 mins)' },

  // Mumbai
  'CSMT:MMCT': { minutes: 25, instruction: 'Cab or Western/Central local train transfer (~25 mins, 5 km)' },
  'MMCT:CSMT': { minutes: 25, instruction: 'Cab or Western/Central local train transfer (~25 mins, 5 km)' },
  'CSMT:BOM': { minutes: 25, instruction: 'Cab or Western/Central local train transfer (~25 mins, 5 km)' },
  'BOM:CSMT': { minutes: 25, instruction: 'Cab or Western/Central local train transfer (~25 mins, 5 km)' },
  'CSMT:LTT': { minutes: 55, instruction: 'Local train to Kurla + auto or direct cab via Eastern Freeway (~55 mins, 16 km)' },
  'LTT:CSMT': { minutes: 55, instruction: 'Direct cab via Eastern Freeway (~55 mins, 16 km)' },
  'MMCT:LTT': { minutes: 50, instruction: 'Cab via Santacruz-Chembur Link Road (~50 mins, 18 km)' },
  'LTT:MMCT': { minutes: 50, instruction: 'Cab via Santacruz-Chembur Link Road (~50 mins, 18 km)' },
  'CSMT:BDTS': { minutes: 45, instruction: 'Western Railway suburban train or cab via Sea Link (~45 mins)' },
  'BDTS:CSMT': { minutes: 45, instruction: 'Cab via Bandra-Worli Sea Link (~45 mins)' },

  // Kolkata
  'HWH:SDAH': { minutes: 35, instruction: 'Green Line Underwater Metro or pre-paid taxi over Howrah Bridge (~35 mins)' },
  'SDAH:HWH': { minutes: 35, instruction: 'Green Line Underwater Metro or pre-paid taxi over Howrah Bridge (~35 mins)' },
  'HWH:KOAA': { minutes: 45, instruction: 'Pre-paid cab via Vivekananda Setu (~45 mins, 9 km)' },
  'KOAA:HWH': { minutes: 45, instruction: 'Pre-paid cab via Vivekananda Setu (~45 mins, 9 km)' },

  // Bengaluru
  'SBC:YPR': { minutes: 30, instruction: 'Namma Metro Green Line direct connection (~30 mins, 6 km)' },
  'YPR:SBC': { minutes: 30, instruction: 'Namma Metro Green Line direct connection (~30 mins, 6 km)' },
  'SBC:SMVB': { minutes: 50, instruction: 'Namma Metro Purple Line to Baiyappanahalli + auto (~50 mins, 14 km)' },
  'SMVB:SBC': { minutes: 50, instruction: 'Auto to Baiyappanahalli + Purple Line Metro (~50 mins, 14 km)' },

  // Hyderabad
  'SC:HYB': { minutes: 30, instruction: 'Hyderabad Metro Red Line or cab (~30 mins, 8 km)' },
  'HYB:SC': { minutes: 30, instruction: 'Hyderabad Metro Red Line or cab (~30 mins, 8 km)' },
  'SC:KCG': { minutes: 30, instruction: 'Hyderabad Metro Green/Blue Line or cab (~30 mins, 7 km)' },
  'KCG:SC': { minutes: 30, instruction: 'Hyderabad Metro Green/Blue Line or cab (~30 mins, 7 km)' },
};

export function areStationsInSameCityCluster(code1: string, code2: string): boolean {
  if (code1 === code2) return true;
  for (const cluster of CITY_CLUSTERS) {
    if (cluster.stations.includes(code1) && cluster.stations.includes(code2)) {
      return true;
    }
  }
  return false;
}

export function getCrossStationCommute(code1: string, code2: string): { minutes: number; instruction: string } {
  if (code1 === code2) {
    return { minutes: 0, instruction: 'Same station platform change. Waiting hall on premises.' };
  }
  const key = `${code1}:${code2}`;
  if (CROSS_STATION_COMMUTE[key]) {
    return CROSS_STATION_COMMUTE[key];
  }
  if (areStationsInSameCityCluster(code1, code2)) {
    return {
      minutes: 45,
      instruction: 'Inter-station city transfer via metro or pre-paid cab (~45 mins).',
    };
  }
  return {
    minutes: 90,
    instruction: 'Cross-city transfer between stations (~90 mins estimated).',
  };
}

// ── Realistic Train Historical Delay Profiling ──

export function getHistoricalDelay(trainNumber: string, trainName?: string): HistoricalDelayInfo {
  const tName = (trainName || '').toLowerCase();

  // Premium High-Priority Trains (Vande Bharat, Rajdhani, Shatabdi, Tejas)
  if (
    tName.includes('vande bharat') ||
    tName.includes('rajdhani') ||
    tName.includes('shatabdi') ||
    tName.includes('tejas')
  ) {
    return {
      trainNumber,
      averageDelayMinutes: 12,
      delayBufferMinutes: 25,
      onTimePercentage: 94,
      typicalDelayRange: '5–18 mins',
    };
  }

  if (tName.includes('duronto') || tName.includes('garib rath') || tName.includes('jan shatabdi')) {
    return {
      trainNumber,
      averageDelayMinutes: 22,
      delayBufferMinutes: 40,
      onTimePercentage: 88,
      typicalDelayRange: '15–30 mins',
    };
  }

  // Superfast Express trains
  if (tName.includes('superfast') || tName.includes('sf express')) {
    return {
      trainNumber,
      averageDelayMinutes: 30,
      delayBufferMinutes: 50,
      onTimePercentage: 82,
      typicalDelayRange: '20–45 mins',
    };
  }

  // Standard Mail/Express trains
  return {
    trainNumber,
    averageDelayMinutes: 40,
    delayBufferMinutes: 65,
    onTimePercentage: 74,
    typicalDelayRange: '25–60 mins',
  };
}

export function parseTimeToMinutes(timeStr?: string | null): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 0;
  return h * 60 + m;
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Calculates complete transfer details and safety indicators between two journey legs,
 * factoring in overnight connections (+1 Day), historical delay, and max 8-hour layover.
 */
export function calculateTransferDetails(
  arrStation: Station,
  depStation: Station,
  leg1ArrivalTime: string,
  leg1ArrivalDay: number,
  leg2DepartureTime: string,
  leg2DepartureDay: number,
  leg1TrainNumber: string = '',
  leg1TrainName: string = '',
  leg1StartDate?: string
): TransferDetails {
  const isSameStation = arrStation.code === depStation.code;
  const isCrossStation = !isSameStation;

  const commute = getCrossStationCommute(arrStation.code, depStation.code);
  const minRequiredBuffer = (isSameStation ? 35 : 45) + commute.minutes;

  const arrMins = parseTimeToMinutes(leg1ArrivalTime);
  const depMins = parseTimeToMinutes(leg2DepartureTime);

  // Determine whether Leg 2 departs on the same day or overnight on the next calendar day
  let scheduledLayoverMinutes: number;
  let dayOffset = 0;

  if (depMins >= arrMins + minRequiredBuffer) {
    // Departure is later on the same calendar day
    scheduledLayoverMinutes = depMins - arrMins;
    dayOffset = 0;
  } else {
    // Overnight connection crossing midnight into next calendar day (+1 Day)
    scheduledLayoverMinutes = (1440 - arrMins) + depMins;
    dayOffset = 1;
  }

  const delayInfo = getHistoricalDelay(leg1TrainNumber, leg1TrainName);
  const leg1HistoricalDelayMinutes = delayInfo.averageDelayMinutes;
  const leg1DelayBufferMinutes = delayInfo.delayBufferMinutes;
  const totalRequiredBuffer = minRequiredBuffer + leg1DelayBufferMinutes;

  // Predicted wait time passenger will experience at junction after transit and average delay
  const predictedWaitMinutes = Math.max(
    0,
    scheduledLayoverMinutes - leg1HistoricalDelayMinutes - commute.minutes
  );

  // Safety Classification (Capped at 8 hours max layover)
  let safety: LayoverSafety;
  let safetyLabel: 'Safe Connection' | 'Moderate Buffer' | 'Tight / Risky';
  let safetyDescription: string;

  if (scheduledLayoverMinutes > 8 * 60) {
    safety = 'RISKY';
    safetyLabel = 'Tight / Risky';
    safetyDescription = `Exceeds 8-hour maximum connection window (${Math.round(scheduledLayoverMinutes / 60 * 10) / 10}h scheduled).`;
  } else if (scheduledLayoverMinutes >= totalRequiredBuffer + 20) {
    safety = 'SAFE';
    safetyLabel = 'Safe Connection';
    safetyDescription = `Comfortable ${Math.round(scheduledLayoverMinutes / 60 * 10) / 10}h connection. Expected wait ~${predictedWaitMinutes}m even with typical ${delayInfo.typicalDelayRange} delay.`;
  } else if (scheduledLayoverMinutes >= totalRequiredBuffer - 15) {
    safety = 'MODERATE';
    safetyLabel = 'Moderate Buffer';
    safetyDescription = `Moderate buffer. Train #${leg1TrainNumber} averages ${leg1HistoricalDelayMinutes}m late. Predicted connection window: ~${predictedWaitMinutes}m.`;
  } else {
    safety = 'RISKY';
    safetyLabel = 'Tight / Risky';
    safetyDescription = `Tight connection! Scheduled gap is ${scheduledLayoverMinutes}m, but historical delay on Leg 1 averages ${leg1HistoricalDelayMinutes}m. Missed connection risk.`;
  }

  // Calculate actual calendar date for Leg 2 departure
  let leg2DepartureDate: string | undefined;
  let isNextDayBooking = false;
  let nextDayBookingNotice: string | undefined;

  if (leg1StartDate) {
    const leg1JunctionArrivalDate = addDaysToDate(leg1StartDate, Math.max(0, leg1ArrivalDay - 1));
    leg2DepartureDate = addDaysToDate(leg1JunctionArrivalDate, dayOffset);
    isNextDayBooking = leg2DepartureDate !== leg1StartDate;
    if (isNextDayBooking) {
      nextDayBookingNotice = `Book Leg 2 for ${leg2DepartureDate} (+1 Day)`;
    }
  }

  return {
    fromStation: arrStation,
    toStation: depStation,
    isCrossStation,
    commuteMinutes: commute.minutes,
    commuteInstruction: commute.instruction,
    scheduledLayoverMinutes,
    leg1HistoricalDelayMinutes,
    predictedWaitMinutes,
    safety,
    safetyLabel,
    safetyDescription,
    isNextDayBooking,
    leg2DepartureDate,
    nextDayBookingNotice,
  };
}
