// ── Deterministic mock data provider informed by RouteChef & REA ──
// Replaceable with a live railway API by implementing the DataProvider interface.

import {
  DataProvider,
  Station,
  TrainRoute,
  StopTiming,
  SectionAvailability,
  TravelClass,
  AvailabilityStatus,
} from './types';

// ── Station database (derived from authentic IRCTC schedules & RouteChef network) ──

const STATIONS: Station[] = [
  // Western / North-Western
  { code: 'JU', name: 'Jodhpur Junction' },
  { code: 'MJ', name: 'Marwar Junction' },
  { code: 'FA', name: 'Falna' },
  { code: 'ABR', name: 'Abu Road' },
  { code: 'PNU', name: 'Palanpur Junction' },
  { code: 'MSH', name: 'Mahesana Junction' },
  { code: 'ADI', name: 'Ahmedabad Junction' },
  { code: 'ANND', name: 'Anand Junction' },
  { code: 'BRC', name: 'Vadodara Junction' },
  { code: 'ST', name: 'Surat' },
  { code: 'BSR', name: 'Vasai Road' },
  { code: 'KYN', name: 'Kalyan Junction' },
  { code: 'BOM', name: 'Mumbai Central' },
  { code: 'CSMT', name: 'Mumbai CSMT' },
  { code: 'PNVL', name: 'Panvel' },
  { code: 'RN', name: 'Ratnagiri' },
  { code: 'THVM', name: 'Thivim (North Goa)' },
  { code: 'MAO', name: 'Madgaon Junction (Goa)' },

  // Central / Deccan
  { code: 'PUNE', name: 'Pune Junction' },
  { code: 'DD', name: 'Daund Junction' },
  { code: 'SUR', name: 'Solapur' },
  { code: 'KLBG', name: 'Kalaburagi' },
  { code: 'WADI', name: 'Wadi Junction' },
  { code: 'SC', name: 'Secunderabad Junction' },
  { code: 'KZJ', name: 'Kazipet Junction' },
  { code: 'WL', name: 'Warangal' },
  { code: 'KMT', name: 'Khammam' },
  { code: 'GNT', name: 'Guntur Junction' },
  { code: 'BZA', name: 'Vijayawada Junction' },

  // Southern
  { code: 'SBC', name: 'KSR Bengaluru City' },
  { code: 'YPR', name: 'Yesvantpur Junction' },
  { code: 'MAS', name: 'Chennai Central' },

  // Northern & Central
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'DEL', name: 'Delhi Cantt' },
  { code: 'MTJ', name: 'Mathura Junction' },
  { code: 'KOTA', name: 'Kota Junction' },
  { code: 'RTM', name: 'Ratlam Junction' },
  { code: 'BPL', name: 'Bhopal Junction' },
  { code: 'NGP', name: 'Nagpur Junction' },
  { code: 'JP', name: 'Jaipur Junction' },
  { code: 'HW', name: 'Haridwar Junction' },
  { code: 'HWH', name: 'Howrah Junction' },
  { code: 'LKO', name: 'Lucknow' },
];

// Major junctions have dedicated Remote Location Quotas (RLWL) in IRCTC
const MAJOR_JUNCTIONS = new Set([
  'JU', 'ADI', 'BRC', 'ST', 'BSR', 'CSMT', 'BOM', 'PUNE',
  'SUR', 'WADI', 'SC', 'BZA', 'NDLS', 'BPL', 'NGP', 'MAS',
  'SBC', 'YPR', 'RN', 'MAO', 'KOTA', 'JP', 'HW'
]);

function makeStop(
  code: string,
  arrival: string | null,
  departure: string | null,
  day: number
): StopTiming {
  const station = STATIONS.find((s) => s.code === code);
  if (!station) throw new Error(`Unknown station code: ${code}`);
  return { station, arrival, departure, day };
}

// ── Realistic Train Routes ──

const TRAIN_ROUTES: TrainRoute[] = [
  // 1. Featured Route: 14803 Jodhpur - Vijayawada Express
  // Complete stoppage itinerary across Rajasthan, Gujarat, Maharashtra, Telangana, and Andhra Pradesh
  {
    trainNumber: '14803',
    trainName: 'Jodhpur - Vijayawada Express',
    classesAvailable: ['SL', '3A', '2A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6], // Daily
    stops: [
      makeStop('JU', null, '14:30', 1),
      makeStop('MJ', '15:55', '16:00', 1),
      makeStop('FA', '16:48', '16:50', 1),
      makeStop('ABR', '18:15', '18:25', 1),
      makeStop('PNU', '19:40', '19:45', 1),
      makeStop('MSH', '20:38', '20:40', 1),
      makeStop('ADI', '22:15', '22:45', 1),
      makeStop('ANND', '23:40', '23:42', 1),
      makeStop('BRC', '01:10', '01:20', 2),
      makeStop('ST', '04:05', '04:15', 2),
      makeStop('BSR', '07:35', '07:40', 2),
      makeStop('KYN', '08:45', '08:50', 2),
      makeStop('PUNE', '11:30', '11:50', 2),
      makeStop('DD', '13:05', '13:10', 2),
      makeStop('SUR', '15:45', '16:00', 2),
      makeStop('KLBG', '17:35', '17:40', 2),
      makeStop('WADI', '18:30', '18:35', 2),
      makeStop('SC', '22:30', '22:50', 2),
      makeStop('KZJ', '00:48', '00:50', 3),
      makeStop('WL', '01:05', '01:10', 3),
      makeStop('KMT', '02:30', '02:32', 3),
      makeStop('GNT', '03:30', '03:45', 3),
      makeStop('BZA', '05:10', null, 3),
    ],
  },

  // 2. 16507 Jodhpur - KSR Bengaluru Express
  {
    trainNumber: '16507',
    trainName: 'Jodhpur - KSR Bengaluru Express',
    classesAvailable: ['SL', '3A', '2A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6], // Daily
    stops: [
      makeStop('JU', null, '06:00', 1),
      makeStop('MJ', '07:10', '07:15', 1),
      makeStop('ABR', '09:20', '09:30', 1),
      makeStop('ADI', '14:30', '15:00', 1),
      makeStop('BRC', '16:50', '17:00', 1),
      makeStop('ST', '19:00', '19:10', 1),
      makeStop('BSR', '22:40', '22:45', 1),
      makeStop('PUNE', '04:15', '04:30', 2),
      makeStop('SUR', '08:45', '09:00', 2),
      makeStop('WADI', '11:45', '11:50', 2),
      makeStop('SC', '16:30', '16:50', 2),
      makeStop('GNT', '23:30', '23:45', 2),
      makeStop('BZA', '01:10', null, 3),
    ],
  },

  // 3. 22229 CSMT MAO Vande Bharat Express (RouteChef Featured)
  {
    trainNumber: '22229',
    trainName: 'CSMT MAO Vande Bharat Express',
    classesAvailable: ['CC', '2A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('CSMT', null, '05:25', 1),
      makeStop('PNVL', '06:35', '06:37', 1),
      makeStop('RN', '10:00', '10:05', 1),
      makeStop('THVM', '12:33', '12:35', 1),
      makeStop('MAO', '13:10', null, 1),
    ],
  },

  // 4. 12051 Jan Shatabdi Express (Mumbai CSMT to Madgaon, Goa)
  {
    trainNumber: '12051',
    trainName: 'Jan Shatabdi Express',
    classesAvailable: ['2S', 'CC'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('CSMT', null, '05:10', 1),
      makeStop('PNVL', '06:03', '06:05', 1),
      makeStop('RN', '10:15', '10:20', 1),
      makeStop('THVM', '13:16', '13:18', 1),
      makeStop('MAO', '14:05', null, 1),
    ],
  },

  // 5. 11301 Udyan Express (Mumbai CSMT to KSR Bengaluru)
  {
    trainNumber: '11301',
    trainName: 'Udyan Express',
    classesAvailable: ['SL', '3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('CSMT', null, '08:10', 1),
      makeStop('KYN', '08:57', '09:00', 1),
      makeStop('PUNE', '11:40', '11:45', 1),
      makeStop('DD', '12:58', '13:00', 1),
      makeStop('SUR', '15:55', '16:00', 1),
      makeStop('KLBG', '17:30', '17:35', 1),
      makeStop('WADI', '18:15', '18:20', 1),
      makeStop('YPR', '07:15', '07:18', 2),
      makeStop('SBC', '07:50', null, 2),
    ],
  },

  // 6. 12952 Mumbai Rajdhani Express (New Delhi to Mumbai)
  {
    trainNumber: '12952',
    trainName: 'Mumbai Rajdhani Express',
    classesAvailable: ['3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('NDLS', null, '16:55', 1),
      makeStop('KOTA', '21:30', '21:35', 1),
      makeStop('RTM', '00:35', '00:40', 2),
      makeStop('BRC', '03:50', '03:55', 2),
      makeStop('ST', '05:15', '05:20', 2),
      makeStop('BOM', '08:35', null, 2),
    ],
  },

  // 7. 12432 Trivandrum Rajdhani Express
  {
    trainNumber: '12432',
    trainName: 'Trivandrum Rajdhani Express',
    classesAvailable: ['3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6], // Daily
    stops: [
      makeStop('NDLS', null, '10:55', 1),
      makeStop('MTJ', '13:10', '13:15', 1),
      makeStop('BPL', '19:55', '20:10', 1),
      makeStop('NGP', '02:30', '02:45', 2),
      makeStop('SC', '10:20', '10:40', 2),
      makeStop('BZA', '13:30', '13:45', 2),
      makeStop('GNT', '14:55', '15:05', 2),
      makeStop('MAS', '22:30', null, 2),
    ],
  },

  // 8. 12915 Ashram Express
  {
    trainNumber: '12915',
    trainName: 'Ashram Express',
    classesAvailable: ['SL', '3A', '2A', 'CC'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('ADI', null, '06:00', 1),
      makeStop('BRC', '08:15', '08:20', 1),
      makeStop('ST', '10:45', '10:55', 1),
      makeStop('BSR', '14:50', '14:55', 1),
      makeStop('NDLS', '23:30', null, 1),
    ],
  },

  // 9. 22457 Vande Bharat Express (Delhi - Haridwar)
  {
    trainNumber: '22457',
    trainName: 'Haridwar Vande Bharat Express',
    classesAvailable: ['CC', '2A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6], // Daily
    stops: [
      makeStop('NDLS', null, '06:00', 1),
      makeStop('HW', '09:30', null, 1),
    ],
  },

  // 10. 20978 Vande Bharat Express (Delhi - Jaipur)
  {
    trainNumber: '20978',
    trainName: 'Ajmer Vande Bharat Express',
    classesAvailable: ['CC', '2A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6], // Daily
    stops: [
      makeStop('NDLS', null, '06:10', 1),
      makeStop('JP', '10:05', null, 1),
    ],
  },
];

// ── Approximate Geographic Coordinates for Corridor Route Synthesis ──
const STATION_COORDS: Record<string, { lat: number; lon: number }> = {
  JU: { lat: 26.29, lon: 73.02 },
  MJ: { lat: 25.73, lon: 73.61 },
  FA: { lat: 25.22, lon: 73.23 },
  ABR: { lat: 24.59, lon: 72.78 },
  PNU: { lat: 24.17, lon: 72.43 },
  MSH: { lat: 23.60, lon: 72.40 },
  ADI: { lat: 23.03, lon: 72.58 },
  ANND: { lat: 22.56, lon: 72.95 },
  BRC: { lat: 22.30, lon: 73.18 },
  ST: { lat: 21.17, lon: 72.83 },
  BSR: { lat: 19.38, lon: 72.83 },
  KYN: { lat: 19.24, lon: 73.13 },
  BOM: { lat: 18.97, lon: 72.82 },
  CSMT: { lat: 18.94, lon: 72.83 },
  PNVL: { lat: 18.99, lon: 73.11 },
  RN: { lat: 16.99, lon: 73.30 },
  THVM: { lat: 15.65, lon: 73.87 },
  MAO: { lat: 15.27, lon: 73.98 },
  PUNE: { lat: 18.52, lon: 73.85 },
  DD: { lat: 18.46, lon: 74.58 },
  SUR: { lat: 17.65, lon: 75.90 },
  KLBG: { lat: 17.33, lon: 76.83 },
  WADI: { lat: 17.06, lon: 76.99 },
  SC: { lat: 17.43, lon: 78.50 },
  KZJ: { lat: 17.98, lon: 79.52 },
  WL: { lat: 17.96, lon: 79.59 },
  KMT: { lat: 17.24, lon: 80.15 },
  GNT: { lat: 16.30, lon: 80.44 },
  BZA: { lat: 16.51, lon: 80.64 },
  SBC: { lat: 12.97, lon: 77.57 },
  YPR: { lat: 13.02, lon: 77.55 },
  MAS: { lat: 13.08, lon: 80.28 },
  NDLS: { lat: 28.61, lon: 77.21 },
  DEL: { lat: 28.58, lon: 77.12 },
  MTJ: { lat: 27.49, lon: 77.67 },
  KOTA: { lat: 25.18, lon: 75.83 },
  RTM: { lat: 23.33, lon: 75.03 },
  BPL: { lat: 23.25, lon: 77.41 },
  NGP: { lat: 21.14, lon: 79.08 },
  JP: { lat: 26.91, lon: 75.79 },
  HW: { lat: 29.94, lon: 78.16 },
  HWH: { lat: 22.58, lon: 88.34 },
  LKO: { lat: 26.85, lon: 80.94 },
};

// Cache for synthesized train routes so all sub-segments and checks resolve
const SYNTHESIZED_ROUTES = new Map<string, TrainRoute>();

export function getAnyTrain(trainNumber: string): TrainRoute | undefined {
  return (
    TRAIN_ROUTES.find((t) => t.trainNumber === trainNumber) ||
    SYNTHESIZED_ROUTES.get(trainNumber)
  );
}

function findCorridorStops(originCode: string, destCode: string): Station[] {
  const oCoord = STATION_COORDS[originCode] || { lat: 20, lon: 78 };
  const dCoord = STATION_COORDS[destCode] || { lat: 20, lon: 78 };

  const dx = dCoord.lon - oCoord.lon;
  const dy = dCoord.lat - oCoord.lat;
  const magSq = dx * dx + dy * dy;

  interface Candidate {
    station: Station;
    projectionRatio: number;
    perpDistSq: number;
    isMajor: boolean;
  }

  const candidates: Candidate[] = [];

  for (const st of STATIONS) {
    if (st.code === originCode || st.code === destCode) continue;
    const sCoord = STATION_COORDS[st.code];
    if (!sCoord) continue;

    const sx = sCoord.lon - oCoord.lon;
    const sy = sCoord.lat - oCoord.lat;

    if (magSq > 0.01) {
      const t = (sx * dx + sy * dy) / magSq;
      if (t > 0.08 && t < 0.92) {
        const perpX = sx - t * dx;
        const perpY = sy - t * dy;
        const perpDistSq = perpX * perpX + perpY * perpY;

        if (perpDistSq < 25) {
          candidates.push({
            station: st,
            projectionRatio: t,
            perpDistSq,
            isMajor: MAJOR_JUNCTIONS.has(st.code),
          });
        }
      }
    }
  }

  candidates.sort((a, b) => a.projectionRatio - b.projectionRatio);

  const selected: Station[] = [];
  let lastRatio = 0.02;

  for (const cand of candidates) {
    if (cand.projectionRatio - lastRatio >= 0.12) {
      selected.push(cand.station);
      lastRatio = cand.projectionRatio;
      if (selected.length >= 4) break;
    }
  }

  // Fallback: If no corridor stops were found, pick 2 major junctions
  if (selected.length === 0) {
    for (const mjCode of MAJOR_JUNCTIONS) {
      if (mjCode !== originCode && mjCode !== destCode) {
        const mjSt = STATIONS.find((s) => s.code === mjCode);
        if (mjSt) {
          selected.push(mjSt);
          if (selected.length >= 2) break;
        }
      }
    }
  }

  return selected;
}

export function synthesizeRouteForPair(fromCode: string, toCode: string): TrainRoute {
  const fromStation = STATIONS.find((s) => s.code === fromCode);
  const toStation = STATIONS.find((s) => s.code === toCode);
  if (!fromStation || !toStation) {
    throw new Error(`Invalid station pair: ${fromCode} - ${toCode}`);
  }

  const intermediateStations = findCorridorStops(fromCode, toCode);
  const allStations = [fromStation, ...intermediateStations, toStation];

  const seed = simpleHash(`${fromCode}:${toCode}`);
  const trainNum = `19${(seed % 800) + 100}`;
  const trainName = `${fromStation.name.replace(/ Junction| Central| City/g, '')} - ${toStation.name.replace(/ Junction| Central| City/g, '')} Superfast Express`;

  let currentHour = 6 + (seed % 10);
  let currentMinute = (seed % 4) * 15;
  let currentDay = 1;

  const stops: StopTiming[] = [];

  for (let i = 0; i < allStations.length; i++) {
    const st = allStations[i];
    const isFirst = i === 0;
    const isLast = i === allStations.length - 1;

    let arrival: string | null = null;
    let departure: string | null = null;

    if (isFirst) {
      departure = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    } else if (isLast) {
      currentHour += 2 + ((seed + i) % 2);
      if (currentHour >= 24) {
        currentDay += Math.floor(currentHour / 24);
        currentHour %= 24;
      }
      arrival = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    } else {
      currentHour += 2 + ((seed + i) % 3);
      if (currentHour >= 24) {
        currentDay += Math.floor(currentHour / 24);
        currentHour %= 24;
      }
      arrival = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      currentMinute += 10;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute -= 60;
        if (currentHour >= 24) {
          currentDay += 1;
          currentHour = 0;
        }
      }
      departure = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    }

    stops.push({
      station: st,
      arrival,
      departure,
      day: currentDay,
    });
  }

  return {
    trainNumber: trainNum,
    trainName,
    classesAvailable: ['SL', '3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops,
  };
}

// ── Realistic IRCTC Quota & Availability Modeling ──
// Models the real-world railway reality:
// End-to-end long-distance routes quickly hit General Quota Waitlist (GNWL),
// while major commercial junctions (ADI, BRC, ST, PUNE, SUR) hold separate
// Remote Location Quotas (RLWL / pooled berths) that remain CONFIRMED.

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

interface SimulatedStatus {
  status: AvailabilityStatus;
  statusDetail: string;
  quota: string;
}

function simulateQuotaAvailability(
  trainNumber: string,
  from: string,
  to: string,
  date: string,
  travelClass: TravelClass
): SimulatedStatus {
  const train = getAnyTrain(trainNumber);
  const totalStops = train ? train.stops.length : 10;
  const fromIdx = train ? train.stops.findIndex((s) => s.station.code === from) : 0;
  const toIdx = train ? train.stops.findIndex((s) => s.station.code === to) : totalStops - 1;
  const span = Math.abs(toIdx - fromIdx);
  const isEndToEnd = span >= totalStops - 2;

  const key = `${trainNumber}:${from}:${to}:${date}:${travelClass}`;
  const hash = simpleHash(key);
  const bucket = hash % 100;

  // Real IRCTC mechanic: End-to-end journeys have heavy demand on General Quota
  if (isEndToEnd) {
    if (bucket < 25) {
      const seats = 1 + (hash % 12);
      return { status: 'CONFIRMED', statusDetail: `AVAILABLE ${seats}`, quota: 'GN' };
    }
    if (bucket < 45) {
      const racNum = 1 + (hash % 15);
      return { status: 'RAC', statusDetail: `RAC ${racNum}`, quota: 'GN' };
    }
    const wlNum = 1 + (hash % 45);
    return { status: 'WAITLIST', statusDetail: `GNWL ${wlNum}`, quota: 'GN' };
  }

  // Intermediate sub-segment:
  // If either endpoint is a major junction (e.g. ADI, BRC, ST, PUNE, SUR),
  // Remote Location (RLWL) pools provide high confirmed seat availability!
  const connectsMajorJunction = MAJOR_JUNCTIONS.has(from) && MAJOR_JUNCTIONS.has(to);
  const quotaType = connectsMajorJunction ? 'RLWL' : 'PQWL';

  if (connectsMajorJunction) {
    // 75% chance of confirmed availability in RLWL pool
    if (bucket < 75) {
      const seats = 4 + (hash % 28);
      return { status: 'CONFIRMED', statusDetail: `AVAILABLE ${seats}`, quota: quotaType };
    }
    if (bucket < 88) {
      const racNum = 1 + (hash % 8);
      return { status: 'RAC', statusDetail: `RAC ${racNum}`, quota: quotaType };
    }
    const wlNum = 1 + (hash % 15);
    return { status: 'WAITLIST', statusDetail: `RLWL ${wlNum}`, quota: quotaType };
  }

  // Smaller wayside halts (Pooled Quota)
  if (bucket < 40) {
    const seats = 1 + (hash % 8);
    return { status: 'CONFIRMED', statusDetail: `AVAILABLE ${seats}`, quota: quotaType };
  }
  if (bucket < 60) {
    const racNum = 1 + (hash % 6);
    return { status: 'RAC', statusDetail: `RAC ${racNum}`, quota: quotaType };
  }
  const wlNum = 1 + (hash % 25);
  return { status: 'WAITLIST', statusDetail: `PQWL ${wlNum}`, quota: quotaType };
}

// ── Telescopic Distance-Proportional Fare Calculation ──
function calculateRealisticFare(
  trainNumber: string,
  from: string,
  to: string,
  travelClass: TravelClass
): number {
  const train = getAnyTrain(trainNumber);
  const totalStops = train ? train.stops.length : 8;
  const fromIdx = train ? train.stops.findIndex((s) => s.station.code === from) : 0;
  const toIdx = train ? train.stops.findIndex((s) => s.station.code === to) : totalStops - 1;
  const stopCount = Math.max(1, Math.abs(toIdx - fromIdx));

  // Estimated average distance ~80 km per commercial stoppage
  const estimatedKm = stopCount * 80;

  // Authentic IRCTC base rates per km
  const ratesPerKm: Record<TravelClass, number> = {
    '2S': 0.28,
    SL: 0.48,
    CC: 1.15,
    '3A': 1.38,
    '2A': 2.05,
    '1A': 3.45,
  };

  const fixedFee: Record<TravelClass, number> = {
    '2S': 50,
    SL: 120,
    CC: 180,
    '3A': 220,
    '2A': 280,
    '1A': 380,
  };

  const base = Math.round(estimatedKm * ratesPerKm[travelClass] + fixedFee[travelClass]);
  // Slight hash nuance for exact rounding to ₹5 intervals like IRCTC
  const hash = simpleHash(`${trainNumber}:${from}:${to}:${travelClass}`);
  const variation = (hash % 20) - 10;
  const rawTotal = base + variation;
  return Math.max(60, Math.ceil(rawTotal / 5) * 5);
}

// ── Mock Data Provider Implementation ──

export class MockDataProvider implements DataProvider {
  async getStations(): Promise<Station[]> {
    return [...STATIONS].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findTrains(
    from: string,
    to: string,
    date: string
  ): Promise<TrainRoute[]> {
    if (from === to) return [];
    const dayOfWeek = new Date(date).getDay();

    // 1. Check curated routes first
    const curatedMatches = TRAIN_ROUTES.filter((train) => {
      if (!train.runningDays.includes(dayOfWeek)) return false;
      const fromIdx = train.stops.findIndex((s) => s.station.code === from);
      const toIdx = train.stops.findIndex((s) => s.station.code === to);
      return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
    });

    if (curatedMatches.length > 0) {
      return curatedMatches;
    }

    // 2. Synthesize a corridor express route dynamically for universal coverage
    const cacheKey = `${from}:${to}`;
    let synthesized = SYNTHESIZED_ROUTES.get(cacheKey);
    if (!synthesized) {
      synthesized = synthesizeRouteForPair(from, to);
      SYNTHESIZED_ROUTES.set(cacheKey, synthesized);
      SYNTHESIZED_ROUTES.set(synthesized.trainNumber, synthesized);
    }

    return [synthesized];
  }

  async checkAvailability(
    trainNumber: string,
    from: string,
    to: string,
    date: string,
    travelClass: TravelClass
  ): Promise<SectionAvailability> {
    const train = getAnyTrain(trainNumber);
    if (!train) {
      return {
        trainNumber,
        trainName: 'Unknown',
        from: { code: from, name: from },
        to: { code: to, name: to },
        departureTime: '',
        arrivalTime: '',
        departureDay: 1,
        arrivalDay: 1,
        travelClass,
        status: 'NOT_AVAILABLE',
        statusDetail: 'NOT AVAILABLE',
        quota: 'GN',
        fare: null,
        date,
      };
    }

    const fromStop = train.stops.find((s) => s.station.code === from);
    const toStop = train.stops.find((s) => s.station.code === to);

    if (!fromStop || !toStop) {
      return {
        trainNumber,
        trainName: train.trainName,
        from: { code: from, name: from },
        to: { code: to, name: to },
        departureTime: '',
        arrivalTime: '',
        departureDay: 1,
        arrivalDay: 1,
        travelClass,
        status: 'NOT_AVAILABLE',
        statusDetail: 'NOT AVAILABLE',
        quota: 'GN',
        fare: null,
        date,
      };
    }

    // Check class availability on train
    if (!train.classesAvailable.includes(travelClass)) {
      return {
        trainNumber,
        trainName: train.trainName,
        from: fromStop.station,
        to: toStop.station,
        departureTime: fromStop.departure || '',
        arrivalTime: toStop.arrival || '',
        departureDay: fromStop.day,
        arrivalDay: toStop.day,
        travelClass,
        status: 'NOT_AVAILABLE',
        statusDetail: 'CLASS NOT RUNNING',
        quota: 'GN',
        fare: null,
        date,
      };
    }

    const { status, statusDetail, quota } = simulateQuotaAvailability(
      trainNumber,
      from,
      to,
      date,
      travelClass
    );

    const fare =
      status === 'NOT_AVAILABLE'
        ? null
        : calculateRealisticFare(trainNumber, from, to, travelClass);

    return {
      trainNumber,
      trainName: train.trainName,
      from: fromStop.station,
      to: toStop.station,
      departureTime: fromStop.departure || '',
      arrivalTime: toStop.arrival || '',
      departureDay: fromStop.day,
      arrivalDay: toStop.day,
      travelClass,
      status,
      statusDetail,
      quota,
      fare,
      date,
    };
  }
}
