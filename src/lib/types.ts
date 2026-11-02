// ── Core domain types for RailSplit ──

export interface Station {
  code: string;
  name: string;
  city?: string;
  cityCluster?: string; // e.g. 'DELHI', 'MUMBAI', 'KOLKATA', 'BENGALURU', 'HYDERABAD'
}

export type TravelClass = 'SL' | '3A' | '2A' | '1A' | 'CC' | '2S' | 'EC';

export const TRAVEL_CLASS_LABELS: Record<TravelClass, string> = {
  SL: 'Sleeper (SL)',
  '3A': 'AC 3 Tier (3A)',
  '2A': 'AC 2 Tier (2A)',
  '1A': 'AC First (1A)',
  CC: 'Chair Car (CC)',
  '2S': 'Second Sitting (2S)',
  EC: 'Executive Chair Car (EC)',
};

export type AvailabilityStatus =
  | 'CONFIRMED'
  | 'RAC'
  | 'WAITLIST'
  | 'NOT_AVAILABLE'
  | 'UNKNOWN';

export type LayoverSafety = 'SAFE' | 'MODERATE' | 'RISKY';

export interface HistoricalDelayInfo {
  trainNumber: string;
  averageDelayMinutes: number;
  delayBufferMinutes: number; // buffer needed for 85%+ on-time arrival
  onTimePercentage: number;
  typicalDelayRange: string; // e.g. "10-25 mins"
}

export interface SourceQuotaTip {
  trainNumber: string;
  trainName: string;
  bookFrom: Station;
  boardAt: Station;
  destination: Station;
  availableSeats: number;
  statusDetail: string; // e.g. "AVAILABLE 18 (GNWL)"
  originalStatusDetail: string; // e.g. "PQWL 24"
  extraFare: number;
  totalFare: number;
  explanation: string;
  boardingChangeReminder: string; // "Change boarding point on IRCTC at least 24 hrs before departure."
}

export interface TransferDetails {
  fromStation: Station;
  toStation: Station;
  isCrossStation: boolean;
  commuteMinutes: number;
  commuteInstruction?: string;
  scheduledLayoverMinutes: number;
  leg1HistoricalDelayMinutes: number;
  predictedWaitMinutes: number; // scheduledLayover - leg1Delay - commuteMinutes
  safety: LayoverSafety;
  safetyLabel: 'Safe Connection' | 'Moderate Buffer' | 'Tight / Risky';
  safetyDescription: string;
  isNextDayBooking?: boolean;
  leg2DepartureDate?: string;
  nextDayBookingNotice?: string;
}

export interface StopTiming {
  station: Station;
  arrival: string | null; // null for origin
  departure: string | null; // null for terminus
  day: number; // 1-based day of journey
}

export interface SectionAvailability {
  trainNumber: string;
  trainName: string;
  from: Station;
  to: Station;
  departureTime: string;
  arrivalTime: string;
  departureDay: number;
  arrivalDay: number;
  travelClass: TravelClass;
  status: AvailabilityStatus;
  statusDetail?: string; // e.g. 'AVAILABLE 18', 'WL 32', 'RAC 04'
  quota?: string; // e.g. 'GN', 'RLWL', 'PQWL'
  fare: number | null; // null when unavailable
  date: string; // ISO date string
  historicalDelay?: HistoricalDelayInfo;
  sourceQuotaTip?: SourceQuotaTip;
  mode?: 'TRAIN' | 'FLIGHT' | 'BUS';
}

export interface SplitResult {
  trainNumber: string;
  trainName: string;
  splitStation: Station;
  leg1: SectionAvailability;
  leg2: SectionAvailability;
  totalFare: number | null; // null if either fare is missing
  bothConfirmed: boolean;
  whyRecommendation?: string;
  journeyType?: 'SAME_TRAIN' | 'JUNCTION_SPLIT' | 'MULTI_MODAL';
  transfer?: TransferDetails;
  sourceQuotaTip?: SourceQuotaTip;
  confirmationProbability?: number; // 0 to 100%
  totalDurationMinutes?: number;
  isNightBerthSwitch?: boolean;
  isDaytimeOptimal?: boolean;
  directFareComparison?: {
    directFare: number;
    splitFare: number;
    fareDifference: number;
  };
}

export interface DirectResult {
  trainNumber: string;
  trainName: string;
  from: Station;
  to: Station;
  departureTime: string;
  arrivalTime: string;
  departureDay: number;
  arrivalDay: number;
  travelClass: TravelClass;
  status: AvailabilityStatus;
  statusDetail?: string;
  quota?: string;
  fare: number | null;
  date: string;
  stops: StopTiming[];
  historicalDelay?: HistoricalDelayInfo;
  sourceQuotaTip?: SourceQuotaTip;
}

export interface MultiModalOption {
  id: string;
  title: string;
  from: Station;
  to: Station;
  mode: 'TRAIN_FLIGHT' | 'FLIGHT' | 'BUS';
  leg1Description: string;
  leg2Description: string;
  totalDuration: string;
  totalFare: number;
  status: 'CONFIRMED' | 'AVAILABLE';
  notes: string;
}

export interface SearchRequest {
  from: Station;
  to: Station;
  date: string;
  travelClass: TravelClass;
  includeSplits?: boolean;
  includeJunctionSplits?: boolean;
  minLayoverMinutes?: number;
  maxLayoverMinutes?: number;
  trainNumber?: string;
}

// ── Dijkstra Graph Execution Trace Types ──

export type DijkstraDecisionType =
  | 'OPTIMAL_RELAXED'
  | 'PRACTICAL_DAYTIME_OPTIMAL'
  | 'CONFIRMED_SUBOPTIMAL'
  | 'PENALIZED_WAITLIST'
  | 'PRUNED_UNAVAILABLE';

export interface DijkstraNodeTrace {
  trainNumber?: string;
  trainName?: string;
  splitStation: Station;
  leg1: SectionAvailability;
  leg2: SectionAvailability;
  leg1Cost: number;
  leg2Cost: number;
  totalCost: number;
  decision: DijkstraDecisionType;
  decisionReason: string;
}

export interface GraphExecutionMetrics {
  verticesCount: number;
  edgesEvaluated: number;
  executionTimeMs: number;
  intermediateCandidatesCount: number;
  traces: DijkstraNodeTrace[];
}

export interface SearchResponse {
  request: SearchRequest;
  directResults: DirectResult[];
  splitResults: SplitResult[];
  multiModalOptions?: MultiModalOption[];
  message: string | null;
  graphMetrics?: GraphExecutionMetrics;
  partialFallback?: boolean;
}

// ── Data provider interface ──

export interface TrainRoute {
  trainNumber: string;
  trainName: string;
  stops: StopTiming[];
  classesAvailable: TravelClass[];
  runningDays: number[]; // 0=Sun, 1=Mon, ...
}

export interface DataProvider {
  /** Find trains running between two stations on a given date */
  findTrains(from: string, to: string, date: string): Promise<TrainRoute[]>;

  /** Check availability for a specific section */
  checkAvailability(
    trainNumber: string,
    from: string,
    to: string,
    date: string,
    travelClass: TravelClass
  ): Promise<SectionAvailability>;

  /** Get all known stations */
  getStations(): Promise<Station[]>;
}
