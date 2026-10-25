// ── Deterministic mock data provider ──
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

// ── Station database ──

const STATIONS: Station[] = [
  { code: 'JU', name: 'Jodhpur Junction' },
  { code: 'ADI', name: 'Ahmedabad Junction' },
  { code: 'BRC', name: 'Vadodara Junction' },
  { code: 'ST', name: 'Surat' },
  { code: 'BSR', name: 'Vasai Road' },
  { code: 'PUNE', name: 'Pune Junction' },
  { code: 'SUR', name: 'Solapur' },
  { code: 'GNT', name: 'Guntur Junction' },
  { code: 'BZA', name: 'Vijayawada Junction' },
  { code: 'SC', name: 'Secunderabad Junction' },
  { code: 'JP', name: 'Jaipur Junction' },
  { code: 'NDLS', name: 'New Delhi' },
  { code: 'BPL', name: 'Bhopal Junction' },
  { code: 'NGP', name: 'Nagpur Junction' },
  { code: 'HWH', name: 'Howrah Junction' },
  { code: 'MAS', name: 'Chennai Central' },
  { code: 'BCT', name: 'Mumbai Central' },
  { code: 'LKO', name: 'Lucknow' },
  { code: 'CSTM', name: 'Mumbai CSMT' },
  { code: 'MTJ', name: 'Mathura Junction' },
];

// ── Train routes ──

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

const TRAIN_ROUTES: TrainRoute[] = [
  {
    trainNumber: '14803',
    trainName: 'Jodhpur - Vijayawada Express',
    classesAvailable: ['SL', '3A', '2A'],
    runningDays: [1, 3, 5], // Mon, Wed, Fri
    stops: [
      makeStop('JU', null, '14:30', 1),
      makeStop('ADI', '22:15', '22:45', 1),
      makeStop('BRC', '01:10', '01:20', 2),
      makeStop('ST', '04:05', '04:15', 2),
      makeStop('PUNE', '11:30', '11:50', 2),
      makeStop('SUR', '15:45', '16:00', 2),
      makeStop('GNT', '03:30', '03:45', 3),
      makeStop('BZA', '05:10', null, 3),
    ],
  },
  {
    trainNumber: '12957',
    trainName: 'Swarna Jayanti Rajdhani Express',
    classesAvailable: ['3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('ADI', null, '19:40', 1),
      makeStop('BRC', '21:30', '21:35', 1),
      makeStop('BPL', '04:50', '05:00', 2),
      makeStop('NDLS', '12:05', null, 2),
    ],
  },
  {
    trainNumber: '12432',
    trainName: 'Trivandrum Rajdhani Express',
    classesAvailable: ['3A', '2A', '1A'],
    runningDays: [2, 5], // Tue, Fri
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
  {
    trainNumber: '16507',
    trainName: 'Jodhpur - Bangalore Express',
    classesAvailable: ['SL', '3A', '2A'],
    runningDays: [0, 3], // Sun, Wed
    stops: [
      makeStop('JU', null, '06:00', 1),
      makeStop('ADI', '14:30', '15:00', 1),
      makeStop('PUNE', '04:15', '04:30', 2),
      makeStop('SUR', '08:45', '09:00', 2),
      makeStop('SC', '16:30', '16:50', 2),
      makeStop('GNT', '23:30', '23:45', 2),
      makeStop('BZA', '01:10', null, 3),
    ],
  },
  {
    trainNumber: '12618',
    trainName: 'Mangala Lakshadweep Express',
    classesAvailable: ['SL', '3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('NDLS', null, '07:40', 1),
      makeStop('MTJ', '09:50', '09:55', 1),
      makeStop('BPL', '16:30', '16:45', 1),
      makeStop('NGP', '23:55', '00:10', 2),
      makeStop('SC', '08:50', '09:10', 2),
      makeStop('MAS', '22:30', null, 2),
    ],
  },
];

// ── Deterministic availability simulation ──
// Uses a hash of (trainNumber + from + to + date + class) to produce
// consistent results for the same query.

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function deterministicStatus(
  trainNumber: string,
  from: string,
  to: string,
  date: string,
  travelClass: TravelClass
): AvailabilityStatus {
  const key = `${trainNumber}:${from}:${to}:${date}:${travelClass}`;
  const hash = simpleHash(key);
  const bucket = hash % 100;

  // Distribution: 40% confirmed, 15% RAC, 25% waitlist, 15% not available, 5% unknown
  if (bucket < 40) return 'CONFIRMED';
  if (bucket < 55) return 'RAC';
  if (bucket < 80) return 'WAITLIST';
  if (bucket < 95) return 'NOT_AVAILABLE';
  return 'UNKNOWN';
}

function deterministicFare(
  trainNumber: string,
  from: string,
  to: string,
  travelClass: TravelClass
): number {
  const key = `${trainNumber}:${from}:${to}:${travelClass}`;
  const hash = simpleHash(key);

  // Base fare by class
  const baseFares: Record<TravelClass, number> = {
    '2S': 150,
    SL: 350,
    CC: 550,
    '3A': 900,
    '2A': 1400,
    '1A': 2500,
  };

  const base = baseFares[travelClass];
  // Vary ±40% deterministically
  const variation = 0.6 + (hash % 80) / 100;
  return Math.round(base * variation);
}

// ── Mock data provider implementation ──

export class MockDataProvider implements DataProvider {
  async getStations(): Promise<Station[]> {
    return [...STATIONS].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findTrains(
    from: string,
    to: string,
    date: string
  ): Promise<TrainRoute[]> {
    const dayOfWeek = new Date(date).getDay();

    return TRAIN_ROUTES.filter((train) => {
      // Check if train runs on this day
      if (!train.runningDays.includes(dayOfWeek)) return false;

      // Check if both stations are on this route in correct order
      const fromIdx = train.stops.findIndex((s) => s.station.code === from);
      const toIdx = train.stops.findIndex((s) => s.station.code === to);
      return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
    });
  }

  async checkAvailability(
    trainNumber: string,
    from: string,
    to: string,
    date: string,
    travelClass: TravelClass
  ): Promise<SectionAvailability> {
    const train = TRAIN_ROUTES.find((t) => t.trainNumber === trainNumber);
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
        fare: null,
        date,
      };
    }

    // Check class availability
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
        fare: null,
        date,
      };
    }

    const status = deterministicStatus(trainNumber, from, to, date, travelClass);
    const fare =
      status === 'NOT_AVAILABLE'
        ? null
        : deterministicFare(trainNumber, from, to, travelClass);

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
      fare,
      date,
    };
  }
}
