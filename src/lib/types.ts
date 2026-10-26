// ── Core domain types for RailSplit ──

export interface Station {
  code: string;
  name: string;
}

export type TravelClass = 'SL' | '3A' | '2A' | '1A' | 'CC' | '2S';

export const TRAVEL_CLASS_LABELS: Record<TravelClass, string> = {
  SL: 'Sleeper (SL)',
  '3A': 'AC 3 Tier (3A)',
  '2A': 'AC 2 Tier (2A)',
  '1A': 'AC First (1A)',
  CC: 'Chair Car (CC)',
  '2S': 'Second Sitting (2S)',
};

export type AvailabilityStatus =
  | 'CONFIRMED'
  | 'RAC'
  | 'WAITLIST'
  | 'NOT_AVAILABLE'
  | 'UNKNOWN';

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
}

export interface SearchRequest {
  from: Station;
  to: Station;
  date: string;
  travelClass: TravelClass;
  includeSplits?: boolean;
  trainNumber?: string;
}

// ── Dijkstra Graph Execution Trace Types ──

export type DijkstraDecisionType =
  | 'OPTIMAL_RELAXED'
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
  message: string | null;
  graphMetrics?: GraphExecutionMetrics;
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
