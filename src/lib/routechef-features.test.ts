import { MockDataProvider } from './mock-data';
import { searchSplitJourneys } from './split-search';
import { calculateTransferDetails, getCrossStationCommute, getHistoricalDelay } from './delay-buffer';
import { findSourceQuotaOpportunity, BOARDING_CHANGE_REMINDER } from './source-quota';
import { isJunctionOnCorridor } from './junction-routing';
import { getMultiModalOptions } from './multi-modal';
import { Station, TravelClass } from './types';

describe('Routechef Core Features: Split-Ticketing, Buffer, and Source Quota', () => {
  const provider = new MockDataProvider();

  describe('1. Historical Delay Buffer & Layover Safety Calculator', () => {
    const ndls: Station = { code: 'NDLS', name: 'New Delhi', cityCluster: 'DELHI' };
    const nzm: Station = { code: 'NZM', name: 'Hazrat Nizamuddin', cityCluster: 'DELHI' };
    const bza: Station = { code: 'BZA', name: 'Vijayawada Junction' };

    test('calculates safe connection when scheduled layover exceeds required buffer', () => {
      const transfer = calculateTransferDetails(
        bza,
        bza,
        '10:00',
        1,
        '12:30', // 2h 30m layover
        1,
        '12626',
        'Kerala Express'
      );

      expect(transfer.isCrossStation).toBe(false);
      expect(transfer.scheduledLayoverMinutes).toBe(150);
      expect(transfer.safety).toBe('SAFE');
      expect(transfer.safetyLabel).toBe('Safe Connection');
      expect(transfer.predictedWaitMinutes).toBeGreaterThan(60);
    });

    test('handles overnight connections crossing midnight (+1 Day) and caps max layover at 8 hours', () => {
      // Arrives 23:15, departs 01:30 next day -> 135 mins layover
      const transfer = calculateTransferDetails(
        bza,
        bza,
        '23:15',
        1,
        '01:30',
        1,
        '12626',
        'Kerala Express',
        '2026-11-10'
      );

      expect(transfer.scheduledLayoverMinutes).toBe(135);
      expect(transfer.isNextDayBooking).toBe(true);
      expect(transfer.leg2DepartureDate).toBe('2026-11-11');
      expect(transfer.nextDayBookingNotice).toContain('Book Leg 2 for 2026-11-11');
      expect(transfer.safety).toBe('SAFE');

      // Layover exceeding 8 hours (480 minutes) capped and flagged RISKY
      const excessiveTransfer = calculateTransferDetails(
        bza,
        bza,
        '10:00',
        1,
        '19:00', // 9 hours = 540 minutes
        1,
        '12626',
        'Kerala Express'
      );
      expect(excessiveTransfer.scheduledLayoverMinutes).toBe(540);
      expect(excessiveTransfer.safety).toBe('RISKY');
      expect(excessiveTransfer.safetyDescription).toContain('8-hour');
    });

    test('flags tight / risky connection when buffer is insufficient for historical delays', () => {
      const transfer = calculateTransferDetails(
        bza,
        bza,
        '10:00',
        1,
        '10:35', // only 35m layover on a train with ~40m average delay
        1,
        '14803',
        'Express'
      );

      expect(transfer.scheduledLayoverMinutes).toBe(35);
      expect(transfer.safety).toBe('RISKY');
      expect(transfer.safetyLabel).toBe('Tight / Risky');
    });

    test('accounts for cross-station transit in city clusters (NDLS to NZM)', () => {
      const commute = getCrossStationCommute('NDLS', 'NZM');
      expect(commute.minutes).toBe(40);
      expect(commute.instruction).toContain('Delhi Metro');

      const transfer = calculateTransferDetails(
        ndls,
        nzm,
        '08:00',
        1,
        '10:30', // 150m scheduled
        1,
        '12952',
        'Mumbai Rajdhani Express'
      );

      expect(transfer.isCrossStation).toBe(true);
      expect(transfer.commuteMinutes).toBe(40);
      expect(transfer.safety).toBe('SAFE');
    });

    test('retrieves realistic historical delays based on train priority', () => {
      const vandeBharat = getHistoricalDelay('22229', 'CSMT MAO Vande Bharat Express');
      expect(vandeBharat.averageDelayMinutes).toBeLessThanOrEqual(15);
      expect(vandeBharat.onTimePercentage).toBeGreaterThanOrEqual(90);

      const superfast = getHistoricalDelay('12626', 'Kerala Express');
      expect(superfast.averageDelayMinutes).toBeGreaterThan(15);
    });
  });

  describe('2. Source-Origin Quota Optimization ("Source Quota Hack")', () => {
    test('detects when upstream origin has confirmed General Quota (GNWL) and enforces valid scheduled halts', async () => {
      const stations = await provider.getStations();
      const ndls = stations.find((s) => s.code === 'NDLS')!;
      const kota = stations.find((s) => s.code === 'KOTA')!;
      const bom = stations.find((s) => s.code === 'BOM')!;
      const mtj = stations.find((s) => s.code === 'MTJ')!;
      expect(ndls).toBeDefined();

      const trains = await provider.findTrains('NDLS', 'BOM', '2026-11-10');
      expect(trains.length).toBeGreaterThan(0);
      const rajdhani = trains.find((t) => t.trainNumber === '12952')!;

      // Intermediate section KOTA to BOM (KOTA is confirmed scheduled halt on #12952)
      const kotaAvail = await provider.checkAvailability('12952', 'KOTA', 'BOM', '2026-11-10', '3A');

      // If simulated as waitlist or RAC, source quota opportunity should be found
      const mockWaitlistAvail = {
        ...kotaAvail,
        status: 'WAITLIST' as const,
        statusDetail: 'PQWL 18',
      };

      const tip = await findSourceQuotaOpportunity(
        provider,
        rajdhani,
        kota,
        bom,
        '2026-11-10',
        '3A',
        mockWaitlistAvail
      );

      expect(tip).toBeDefined();
      if (tip) {
        expect(tip.bookFrom.code).toBe('NDLS');
        expect(tip.boardAt.code).toBe('KOTA');
        expect(tip.destination.code).toBe('BOM');
        expect(tip.extraFare).toBeGreaterThan(0);
        expect(tip.explanation).toContain('General Quota');
        expect(tip.boardingChangeReminder).toBe(BOARDING_CHANGE_REMINDER);
        expect(tip.boardingChangeReminder).toContain('Change boarding point on IRCTC at least 24 hrs before departure.');
      }

      // Enforce valid halts: MTJ is NOT a scheduled halt for #12952, so Source Quota MUST NOT be suggested
      const nonHaltTip = await findSourceQuotaOpportunity(
        provider,
        rajdhani,
        mtj,
        bom,
        '2026-11-10',
        '3A',
        mockWaitlistAvail
      );
      expect(nonHaltTip).toBeUndefined();
    });
  });

  describe('3. 1-Stop Junction Split Routing & Corridor Geography', () => {
    test('validates corridor geography with 1.25x distance threshold and 160km detour cap', () => {
      // NDLS -> MAS (Chennai Central)
      // Allowed on corridor: BPL (Bhopal), NGP (Nagpur), BZA (Vijayawada)
      // Disallowed: KOTA (Kota)
      expect(isJunctionOnCorridor('NDLS', 'MAS', 'BPL')).toBe(true);
      expect(isJunctionOnCorridor('NDLS', 'MAS', 'NGP')).toBe(true);
      expect(isJunctionOnCorridor('NDLS', 'MAS', 'BZA')).toBe(true);
      expect(isJunctionOnCorridor('NDLS', 'MAS', 'KOTA')).toBe(false);

      // NDLS -> MMCT (Mumbai Central)
      // Allowed on corridor: KOTA, RTM (Ratlam), BRC (Vadodara), ST (Surat)
      // Disallowed: ABR (Abu Road on Ahmedabad loop)
      expect(isJunctionOnCorridor('NDLS', 'MMCT', 'KOTA')).toBe(true);
      expect(isJunctionOnCorridor('NDLS', 'MMCT', 'RTM')).toBe(true);
      expect(isJunctionOnCorridor('NDLS', 'MMCT', 'BRC')).toBe(true);
      expect(isJunctionOnCorridor('NDLS', 'MMCT', 'ST')).toBe(true);
      expect(isJunctionOnCorridor('NDLS', 'MMCT', 'ABR')).toBe(false);
    });

    test('strictly enforces real halts for #12952 Mumbai Rajdhani and collision-free realistic train numbers', async () => {
      const trains = await provider.findTrains('NDLS', 'MMCT', '2026-11-10');
      const rajdhani = trains.find((t) => t.trainNumber === '12952')!;
      expect(rajdhani).toBeDefined();
      const haltCodes = rajdhani.stops.map((s) => s.station.code);
      // Strictly real halts only
      expect(haltCodes).toEqual(['NDLS', 'KOTA', 'SWM', 'RTM', 'BRC', 'ST', 'BVI', 'MMCT']);

      // Synthetic routes must strictly use realistic IR numbers (12xxx, 16xxx, 20xxx, 22xxx)
      const synthesizedTrains = await provider.findTrains('BZA', 'MAS', '2026-11-10');
      for (const t of synthesizedTrains) {
        expect(t.trainNumber).toMatch(/^(12|16|20|22)\d{3}$/);
        expect(t.trainNumber.startsWith('4')).toBe(false);
        expect(t.trainNumber.startsWith('5')).toBe(false);
      }
    });

    test('discovers 1-stop multi-train connection BGKT PUNE EXP #11089 › NAVJEEVAN EXP #12655 via ADI for JU -> BZA', async () => {
      const stations = await provider.getStations();
      const ju = stations.find((s) => s.code === 'JU')!;
      const bza = stations.find((s) => s.code === 'BZA')!;

      const response = await searchSplitJourneys(provider, {
        from: ju,
        to: bza,
        date: '2026-11-10',
        travelClass: '3A',
        includeSplits: true,
        includeJunctionSplits: true,
      });

      expect(response.splitResults.length).toBeGreaterThan(0);
      const adiConnection = response.splitResults.find(
        (s) =>
          s.journeyType === 'JUNCTION_SPLIT' &&
          s.splitStation.code === 'ADI' &&
          s.leg1.trainNumber === '11089' &&
          s.leg2.trainNumber === '12655'
      );

      expect(adiConnection).toBeDefined();
      if (adiConnection) {
        expect(adiConnection.transfer).toBeDefined();
        expect(adiConnection.transfer?.scheduledLayoverMinutes).toBeGreaterThanOrEqual(60);
        expect(adiConnection.transfer?.safety).toBe('SAFE');
      }
    });

    test('calculates next-day (+1 Day) PNR dates and flags night berth switches on multi-day routes', async () => {
      const stations = await provider.getStations();
      const ju = stations.find((s) => s.code === 'JU')!;
      const bza = stations.find((s) => s.code === 'BZA')!;

      // Train #14803 crosses midnight before arriving at BRC (01:10 Day 2)
      const response = await searchSplitJourneys(provider, {
        from: ju,
        to: bza,
        date: '2026-11-10',
        travelClass: 'SL',
        trainNumber: '14803',
        includeSplits: true,
      });

      const nextDaySplit = response.splitResults.find(
        (s) => s.journeyType === 'SAME_TRAIN' && (s.splitStation.code === 'BRC' || s.splitStation.code === 'ST')
      );

      expect(nextDaySplit).toBeDefined();
      if (nextDaySplit) {
        expect(nextDaySplit.transfer?.isNextDayBooking).toBe(true);
        expect(nextDaySplit.leg2.date).toBe('2026-11-11');
        expect(nextDaySplit.transfer?.leg2DepartureDate).toBe('2026-11-11');
        expect(nextDaySplit.transfer?.nextDayBookingNotice).toContain('Important IRCTC Rule');
        expect(nextDaySplit.transfer?.nextDayBookingNotice).toContain('2026-11-11');
        expect(nextDaySplit.isNightBerthSwitch).toBe(true);
      }
    });

    test('falls back gracefully to deterministic availability without dropping stops on HTTP 429', async () => {
      const stations = await provider.getStations();
      const ndls = stations.find((s) => s.code === 'NDLS')!;
      const bom = stations.find((s) => s.code === 'BOM')!;

      // Simulating upstream rate-limiting provider
      const rateLimitedProvider = {
        getStations: () => provider.getStations(),
        findTrains: (from: string, to: string, date: string) => provider.findTrains(from, to, date),
        checkAvailability: async (
          trainNumber: string,
          from: string,
          to: string,
          date: string,
          travelClass: TravelClass
        ) => {
          if (to === 'RTM' || from === 'RTM') {
            throw new Error('HTTP 429: Too Many Requests');
          }
          return provider.checkAvailability(trainNumber, from, to, date, travelClass);
        },
      };

      const response = await searchSplitJourneys(rateLimitedProvider, {
        from: ndls,
        to: bom,
        date: '2026-11-10',
        travelClass: '3A',
        includeSplits: true,
      });

      // Verify that partialFallback flag is set
      expect(response.partialFallback).toBe(true);
      // Verify that RTM stop was NOT dropped and still exists in split options
      const rtmSplit = response.splitResults.find((s) => s.splitStation.code === 'RTM');
      expect(rtmSplit).toBeDefined();
    });

    test('computes junction split routes when requested', async () => {
      const stations = await provider.getStations();
      const sbc = stations.find((s) => s.code === 'SBC')!;
      const hwh = stations.find((s) => s.code === 'HWH')!;

      const response = await searchSplitJourneys(provider, {
        from: sbc,
        to: hwh,
        date: '2026-11-10',
        travelClass: 'SL',
        includeSplits: true,
        includeJunctionSplits: true,
      });

      expect(response.splitResults.length).toBeGreaterThan(0);

      // Verify at least one junction split or confirmed split is present
      const junctionSplit = response.splitResults.find((s) => s.journeyType === 'JUNCTION_SPLIT');
      if (junctionSplit) {
        expect(junctionSplit.transfer).toBeDefined();
        expect(junctionSplit.transfer?.scheduledLayoverMinutes).toBeGreaterThanOrEqual(45);
        expect(junctionSplit.leg1.from.code).toBe('SBC');
        expect(junctionSplit.leg2.to.code).toBe('HWH');
      }
    });

    test('always returns split options alongside direct trains even when direct trains are available', async () => {
      const stations = await provider.getStations();
      const ndls = stations.find((s) => s.code === 'NDLS')!;
      const bom = stations.find((s) => s.code === 'BOM')!;

      const response = await searchSplitJourneys(provider, {
        from: ndls,
        to: bom,
        date: '2026-11-10',
        travelClass: '3A',
        includeSplits: true,
        includeJunctionSplits: true,
      });

      // Both direct trains and split journeys must always be returned together
      expect(response.directResults.length).toBeGreaterThan(0);
      expect(response.splitResults.length).toBeGreaterThan(0);

      // First result should have bothConfirmed === true if any confirmed exists
      const hasAnyConfirmed = response.splitResults.some((s) => s.bothConfirmed);
      if (hasAnyConfirmed) {
        expect(response.splitResults[0].bothConfirmed).toBe(true);
      }
    });
  });

  describe('4. Multi-Modal Fallback Options (Train + Flight)', () => {
    test('provides direct flight fallback between metro airport cities', async () => {
      const stations = await provider.getStations();
      const ndls = stations.find((s) => s.code === 'NDLS')!;
      const bom = stations.find((s) => s.code === 'BOM')!;

      const multiModal = getMultiModalOptions(ndls, bom, '2026-11-10', '3A');
      expect(multiModal.length).toBeGreaterThan(0);
      expect(multiModal[0].mode).toBe('FLIGHT');
      expect(multiModal[0].title).toContain('DEL → BOM');
      expect(multiModal[0].status).toBe('AVAILABLE');
    });
  });
});

