// ── Split-search engine tests ──

import { findIntermediateStops, searchSplitJourneys } from './split-search';
import {
  DataProvider,
  Station,
  TrainRoute,
  StopTiming,
  SectionAvailability,
  TravelClass,
  AvailabilityStatus,
} from './types';

// ── Helpers ──

function station(code: string, name?: string): Station {
  return { code, name: name || code };
}

function stop(
  code: string,
  arrival: string | null,
  departure: string | null,
  day: number
): StopTiming {
  return {
    station: station(code),
    arrival,
    departure,
    day,
  };
}

function makeAvailability(
  trainNumber: string,
  from: string,
  to: string,
  status: AvailabilityStatus,
  fare: number | null = 500,
  travelClass: TravelClass = 'SL'
): SectionAvailability {
  return {
    trainNumber,
    trainName: 'Test Express',
    from: station(from),
    to: station(to),
    departureTime: '10:00',
    arrivalTime: '18:00',
    departureDay: 1,
    arrivalDay: 1,
    travelClass,
    status,
    fare,
    date: '2026-11-01',
  };
}

// ── Mock provider factory ──

function createMockProvider(config: {
  trains?: TrainRoute[];
  availabilities?: Record<string, SectionAvailability>;
}): DataProvider {
  const trains = config.trains || [];
  const avail = config.availabilities || {};

  return {
    async getStations() {
      const stationSet = new Map<string, Station>();
      for (const t of trains) {
        for (const s of t.stops) {
          stationSet.set(s.station.code, s.station);
        }
      }
      return Array.from(stationSet.values());
    },
    async findTrains(from: string, to: string) {
      return trains.filter((t) => {
        const fi = t.stops.findIndex((s) => s.station.code === from);
        const ti = t.stops.findIndex((s) => s.station.code === to);
        return fi !== -1 && ti !== -1 && fi < ti;
      });
    },
    async checkAvailability(
      trainNumber: string,
      from: string,
      to: string,
      _date: string,
      travelClass: TravelClass
    ) {
      const key = `${trainNumber}:${from}:${to}`;
      if (avail[key]) return avail[key];
      return makeAvailability(trainNumber, from, to, 'NOT_AVAILABLE', null, travelClass);
    },
  };
}

// ── Tests ──

describe('findIntermediateStops', () => {
  const stops: StopTiming[] = [
    stop('A', null, '06:00', 1),
    stop('B', '08:00', '08:10', 1),
    stop('C', '12:00', '12:15', 1),
    stop('D', '16:00', '16:10', 1),
    stop('E', '20:00', null, 1),
  ];

  test('finds intermediate stops between origin and destination', () => {
    const result = findIntermediateStops(stops, 'A', 'E');
    expect(result.map((s) => s.station.code)).toEqual(['B', 'C', 'D']);
  });

  test('returns empty for adjacent stations', () => {
    const result = findIntermediateStops(stops, 'A', 'B');
    expect(result).toEqual([]);
  });

  test('returns empty for reversed origin/destination', () => {
    const result = findIntermediateStops(stops, 'E', 'A');
    expect(result).toEqual([]);
  });

  test('returns empty when origin not found', () => {
    const result = findIntermediateStops(stops, 'X', 'E');
    expect(result).toEqual([]);
  });

  test('returns empty when destination not found', () => {
    const result = findIntermediateStops(stops, 'A', 'X');
    expect(result).toEqual([]);
  });
});

describe('searchSplitJourneys', () => {
  // Test 1: Valid same-train split with both sections confirmed
  test('returns confirmed split when both sections are confirmed', async () => {
    const train: TrainRoute = {
      trainNumber: '12345',
      trainName: 'Test Express',
      stops: [
        stop('JU', null, '14:30', 1),
        stop('ADI', '22:00', '22:15', 1),
        stop('BZA', '05:10', null, 2),
      ],
      classesAvailable: ['SL', '3A'],
      runningDays: [0, 1, 2, 3, 4, 5, 6],
    };

    const provider = createMockProvider({
      trains: [train],
      availabilities: {
        '12345:JU:BZA': makeAvailability('12345', 'JU', 'BZA', 'WAITLIST', 800),
        '12345:JU:ADI': makeAvailability('12345', 'JU', 'ADI', 'CONFIRMED', 350),
        '12345:ADI:BZA': makeAvailability('12345', 'ADI', 'BZA', 'CONFIRMED', 500),
      },
    });

    const result = await searchSplitJourneys(provider, {
      from: station('JU', 'Jodhpur'),
      to: station('BZA', 'Vijayawada'),
      date: '2026-11-03', // Tuesday
      travelClass: 'SL',
    });

    expect(result.directResults).toHaveLength(1);
    expect(result.directResults[0].status).toBe('WAITLIST');

    expect(result.splitResults).toHaveLength(1);
    expect(result.splitResults[0].bothConfirmed).toBe(true);
    expect(result.splitResults[0].splitStation.code).toBe('ADI');
    expect(result.splitResults[0].totalFare).toBe(850);
    expect(result.splitResults[0].leg1.status).toBe('CONFIRMED');
    expect(result.splitResults[0].leg2.status).toBe('CONFIRMED');
  });

  // Test 2: One confirmed section and one waitlisted section
  test('marks split as not fully confirmed when one section is waitlisted', async () => {
    const train: TrainRoute = {
      trainNumber: '12345',
      trainName: 'Test Express',
      stops: [
        stop('A', null, '06:00', 1),
        stop('B', '10:00', '10:10', 1),
        stop('C', '18:00', null, 1),
      ],
      classesAvailable: ['3A'],
      runningDays: [0, 1, 2, 3, 4, 5, 6],
    };

    const provider = createMockProvider({
      trains: [train],
      availabilities: {
        '12345:A:C': makeAvailability('12345', 'A', 'C', 'WAITLIST', 700, '3A'),
        '12345:A:B': makeAvailability('12345', 'A', 'B', 'CONFIRMED', 300, '3A'),
        '12345:B:C': makeAvailability('12345', 'B', 'C', 'WAITLIST', 400, '3A'),
      },
    });

    const result = await searchSplitJourneys(provider, {
      from: station('A'),
      to: station('C'),
      date: '2026-11-03',
      travelClass: '3A',
    });

    expect(result.splitResults).toHaveLength(1);
    expect(result.splitResults[0].bothConfirmed).toBe(false);
    expect(result.splitResults[0].leg1.status).toBe('CONFIRMED');
    expect(result.splitResults[0].leg2.status).toBe('WAITLIST');
  });

  // Test 3: Different trains — each station only on one train
  test('does not mix trains in split', async () => {
    const train1: TrainRoute = {
      trainNumber: '11111',
      trainName: 'Train One',
      stops: [
        stop('A', null, '06:00', 1),
        stop('B', '10:00', null, 1),
      ],
      classesAvailable: ['SL'],
      runningDays: [0, 1, 2, 3, 4, 5, 6],
    };

    const train2: TrainRoute = {
      trainNumber: '22222',
      trainName: 'Train Two',
      stops: [
        stop('B', null, '12:00', 1),
        stop('C', '18:00', null, 1),
      ],
      classesAvailable: ['SL'],
      runningDays: [0, 1, 2, 3, 4, 5, 6],
    };

    const provider = createMockProvider({
      trains: [train1, train2],
      availabilities: {},
    });

    const result = await searchSplitJourneys(provider, {
      from: station('A'),
      to: station('C'),
      date: '2026-11-03',
      travelClass: 'SL',
    });

    // No train serves both A and C, so no direct or split results
    expect(result.directResults).toHaveLength(0);
    expect(result.splitResults).toHaveLength(0);
  });

  // Test 3b: Invalid station order (dest before origin on route)
  test('rejects splits with invalid station order', async () => {
    const train: TrainRoute = {
      trainNumber: '12345',
      trainName: 'Test Express',
      stops: [
        stop('A', null, '06:00', 1),
        stop('B', '10:00', '10:10', 1),
        stop('C', '18:00', null, 1),
      ],
      classesAvailable: ['SL'],
      runningDays: [0, 1, 2, 3, 4, 5, 6],
    };

    const provider = createMockProvider({
      trains: [train],
      availabilities: {},
    });

    // Reversed: C -> A
    const result = await searchSplitJourneys(provider, {
      from: station('C'),
      to: station('A'),
      date: '2026-11-03',
      travelClass: 'SL',
    });

    expect(result.directResults).toHaveLength(0);
    expect(result.splitResults).toHaveLength(0);
  });

  // Test 4: No valid intermediate stop
  test('returns no splits when there are no intermediate stops', async () => {
    const train: TrainRoute = {
      trainNumber: '12345',
      trainName: 'Test Express',
      stops: [
        stop('A', null, '06:00', 1),
        stop('B', '18:00', null, 1),
      ],
      classesAvailable: ['SL'],
      runningDays: [0, 1, 2, 3, 4, 5, 6],
    };

    const provider = createMockProvider({
      trains: [train],
      availabilities: {
        '12345:A:B': makeAvailability('12345', 'A', 'B', 'WAITLIST', 500),
      },
    });

    const result = await searchSplitJourneys(provider, {
      from: station('A'),
      to: station('B'),
      date: '2026-11-03',
      travelClass: 'SL',
    });

    expect(result.directResults).toHaveLength(1);
    expect(result.splitResults).toHaveLength(0);
  });

  // Test 5: Unknown availability
  test('excludes splits where either section has unknown availability', async () => {
    const train: TrainRoute = {
      trainNumber: '12345',
      trainName: 'Test Express',
      stops: [
        stop('A', null, '06:00', 1),
        stop('B', '10:00', '10:10', 1),
        stop('C', '18:00', null, 1),
      ],
      classesAvailable: ['SL'],
      runningDays: [0, 1, 2, 3, 4, 5, 6],
    };

    const provider = createMockProvider({
      trains: [train],
      availabilities: {
        '12345:A:C': makeAvailability('12345', 'A', 'C', 'WAITLIST', 700),
        '12345:A:B': makeAvailability('12345', 'A', 'B', 'CONFIRMED', 300),
        '12345:B:C': makeAvailability('12345', 'B', 'C', 'UNKNOWN', null),
      },
    });

    const result = await searchSplitJourneys(provider, {
      from: station('A'),
      to: station('C'),
      date: '2026-11-03',
      travelClass: 'SL',
    });

    // Split with UNKNOWN leg should be excluded
    expect(result.splitResults).toHaveLength(0);
  });

  // Bonus: total fare null when one section fare is missing
  test('sets totalFare to null when a section fare is missing', async () => {
    const train: TrainRoute = {
      trainNumber: '12345',
      trainName: 'Test Express',
      stops: [
        stop('A', null, '06:00', 1),
        stop('B', '10:00', '10:10', 1),
        stop('C', '18:00', null, 1),
      ],
      classesAvailable: ['SL'],
      runningDays: [0, 1, 2, 3, 4, 5, 6],
    };

    const provider = createMockProvider({
      trains: [train],
      availabilities: {
        '12345:A:C': makeAvailability('12345', 'A', 'C', 'WAITLIST', 700),
        '12345:A:B': makeAvailability('12345', 'A', 'B', 'CONFIRMED', 300),
        '12345:B:C': makeAvailability('12345', 'B', 'C', 'RAC', null),
      },
    });

    const result = await searchSplitJourneys(provider, {
      from: station('A'),
      to: station('C'),
      date: '2026-11-03',
      travelClass: 'SL',
    });

    expect(result.splitResults).toHaveLength(1);
    expect(result.splitResults[0].totalFare).toBeNull();
  });

  // No trains found
  test('returns message when no trains found', async () => {
    const provider = createMockProvider({ trains: [] });

    const result = await searchSplitJourneys(provider, {
      from: station('X', 'Nowhere'),
      to: station('Y', 'Somewhere'),
      date: '2026-11-03',
      travelClass: 'SL',
    });

    expect(result.directResults).toHaveLength(0);
    expect(result.splitResults).toHaveLength(0);
    expect(result.message).toBeTruthy();
    expect(result.message).toContain('No trains found');
  });
});

describe('Same-Train Dijkstra Algorithm', () => {
  test('Dijkstra edge cost penalizes waitlist and RAC appropriately', async () => {
    const { calculateDijkstraEdgeCost } = await import('./dijkstra-split');

    const confirmed = makeAvailability('12345', 'A', 'B', 'CONFIRMED', 400);
    const rac = makeAvailability('12345', 'A', 'B', 'RAC', 400);
    const wl = makeAvailability('12345', 'A', 'B', 'WAITLIST', 400);
    const notAvail = makeAvailability('12345', 'A', 'B', 'NOT_AVAILABLE', null);

    expect(calculateDijkstraEdgeCost(confirmed)).toBe(400);
    expect(calculateDijkstraEdgeCost(rac)).toBe(900); // 400 + 500 penalty
    expect(calculateDijkstraEdgeCost(wl)).toBe(10400); // 400 + 10000 penalty
    expect(calculateDijkstraEdgeCost(notAvail)).toBe(Infinity);
  });
});

describe('Hybrid Railway Data Provider', () => {
  test('operates in local engine mode when no API key is provided and caches results', async () => {
    const { HybridDataProvider } = await import('./hybrid-provider');
    const hybrid = new HybridDataProvider();

    expect(hybrid.isLiveConfigured()).toBe(false);

    // Initial check (cache miss)
    const res1 = await hybrid.checkAvailability('14803', 'JU', 'ADI', '2026-11-02', '3A');
    expect(res1).toBeDefined();
    expect(res1.status).toBeDefined();

    const diag1 = hybrid.getDiagnostics();
    expect(diag1.mode).toBe('LOCAL_DEMO_MOCK');
    expect(diag1.totalRequests).toBe(1);
    expect(diag1.cacheMisses).toBe(1);
    expect(diag1.cacheHits).toBe(0);

    // Repeat check (cache hit - 0 quota burn)
    const res2 = await hybrid.checkAvailability('14803', 'JU', 'ADI', '2026-11-02', '3A');
    expect(res2).toEqual(res1);

    const diag2 = hybrid.getDiagnostics();
    expect(diag2.totalRequests).toBe(2);
    expect(diag2.cacheHits).toBe(1);
  });
});

describe('Universal Route Coverage & Dijkstra Proof', () => {
  test('MockDataProvider synthesizes valid routes with intermediate stops for arbitrary station pairs on any date', async () => {
    const { MockDataProvider } = await import('./mock-data');
    const provider = new MockDataProvider();

    // Test a non-curated pair: Howrah (HWH) to Chennai Central (MAS)
    const trains = await provider.findTrains('HWH', 'MAS', '2026-11-15');
    expect(trains.length).toBeGreaterThan(0);
    const train = trains[0];
    expect(train.stops.length).toBeGreaterThanOrEqual(3); // Origin + intermediate(s) + destination
    expect(train.stops[0].station.code).toBe('HWH');
    expect(train.stops[train.stops.length - 1].station.code).toBe('MAS');

    // Test another arbitrary pair: Lucknow (LKO) to Pune (PUNE)
    const trains2 = await provider.findTrains('LKO', 'PUNE', '2026-12-01');
    expect(trains2.length).toBeGreaterThan(0);
    expect(trains2[0].stops.length).toBeGreaterThanOrEqual(3);
  });

  test('searchSplitJourneys collects Dijkstra graph execution metrics and node traces', async () => {
    const { MockDataProvider } = await import('./mock-data');
    const provider = new MockDataProvider();

    const response = await searchSplitJourneys(provider, {
      from: station('JU', 'Jodhpur Junction'),
      to: station('BZA', 'Vijayawada Junction'),
      date: '2026-11-02',
      travelClass: '3A',
    });

    expect(response.graphMetrics).toBeDefined();
    if (response.graphMetrics) {
      expect(response.graphMetrics.intermediateCandidatesCount).toBeGreaterThan(0);
      expect(response.graphMetrics.verticesCount).toBeGreaterThan(0);
      expect(response.graphMetrics.edgesEvaluated).toBeGreaterThan(0);
      expect(response.graphMetrics.executionTimeMs).toBeGreaterThan(0);
      expect(response.graphMetrics.traces.length).toBeGreaterThan(0);

      // Verify each trace has valid edge costs and decision
      for (const trace of response.graphMetrics.traces) {
        expect(trace.splitStation).toBeDefined();
        expect(trace.leg1Cost).toBeGreaterThan(0);
        expect(trace.leg2Cost).toBeGreaterThan(0);
        expect(trace.decision).toBeDefined();
      }
    }
  });

  test('Dijkstra trace assigns OPTIMAL_RELAXED strictly to the lowest-cost confirmed split', async () => {
    const { runSameTrainDijkstraWithTrace } = await import('./dijkstra-split');

    const intermediates: StopTiming[] = [
      stop('ST1', '12:00', '12:10', 1),
      stop('ST2', '14:00', '14:10', 1),
    ];

    const leg1Map = new Map<string, SectionAvailability>([
      ['ST1', makeAvailability('12345', 'ORIG', 'ST1', 'CONFIRMED', 1200)],
      ['ST2', makeAvailability('12345', 'ORIG', 'ST2', 'CONFIRMED', 800)],
    ]);

    const leg2Map = new Map<string, SectionAvailability>([
      ['ST1', makeAvailability('12345', 'ST1', 'DEST', 'CONFIRMED', 1000)], // Total 2200
      ['ST2', makeAvailability('12345', 'ST2', 'DEST', 'CONFIRMED', 600)],  // Total 1400 (lower cost!)
    ]);

    const { metrics } = runSameTrainDijkstraWithTrace(
      '12345',
      'Test Express',
      intermediates,
      leg1Map,
      leg2Map
    );

    const st1Trace = metrics.traces.find((t) => t.splitStation.code === 'ST1');
    const st2Trace = metrics.traces.find((t) => t.splitStation.code === 'ST2');

    // ST2 has lower cost (1400 vs 2200), so ST2 must be OPTIMAL_RELAXED even though ST1 came first in the route!
    expect(st2Trace?.decision).toBe('OPTIMAL_RELAXED');
    expect(st1Trace?.decision).toBe('CONFIRMED_SUBOPTIMAL');
  });

  test('searchSplitJourneys is resilient to intermediate split check failures', async () => {
    const testTrain: TrainRoute = {
      trainNumber: '99999',
      trainName: 'Resilience Express',
      stops: [
        stop('A', null, '08:00', 1),
        stop('B', '10:00', '10:10', 1),
        stop('C', '12:00', '12:10', 1),
        stop('D', '14:00', null, 1),
      ],
      classesAvailable: ['SL'],
      runningDays: [0, 1, 2, 3, 4, 5, 6],
    };

    const faultyProvider: DataProvider = {
      async getStations() {
        return [station('A'), station('B'), station('C'), station('D')];
      },
      async findTrains() {
        return [testTrain];
      },
      async checkAvailability(tNum, fromCode, toCode) {
        // Direct train check
        if (fromCode === 'A' && toCode === 'D') {
          return makeAvailability(tNum, fromCode, toCode, 'WAITLIST', 500);
        }
        // Station B throws an error
        if (fromCode === 'B' || toCode === 'B') {
          throw new Error('Remote upstream timeout at station B');
        }
        // Station C succeeds
        return makeAvailability(tNum, fromCode, toCode, 'CONFIRMED', 300);
      },
    };

    const response = await searchSplitJourneys(faultyProvider, {
      from: station('A'),
      to: station('D'),
      date: '2026-11-01',
      travelClass: 'SL',
    });

    // Does not crash, and discovers the split at station C
    expect(response.splitResults.length).toBeGreaterThan(0);
    expect(response.splitResults[0].splitStation.code).toBe('C');
  });
});
