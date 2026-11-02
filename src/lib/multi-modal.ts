// ── Multi-Modal Travel Alternatives (Train + Flight / Direct Flight) ──
// Informed by Routechef's multi-modal journey planner.

import { Station, MultiModalOption, TravelClass } from './types';

interface AirportMapping {
  stationCode: string;
  airportCode: string;
  airportName: string;
}

const CITY_AIRPORTS: AirportMapping[] = [
  { stationCode: 'NDLS', airportCode: 'DEL', airportName: 'Indira Gandhi International Airport, New Delhi' },
  { stationCode: 'NZM', airportCode: 'DEL', airportName: 'Indira Gandhi International Airport, New Delhi' },
  { stationCode: 'DLI', airportCode: 'DEL', airportName: 'Indira Gandhi International Airport, New Delhi' },
  { stationCode: 'BOM', airportCode: 'BOM', airportName: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai' },
  { stationCode: 'MMCT', airportCode: 'BOM', airportName: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai' },
  { stationCode: 'CSMT', airportCode: 'BOM', airportName: 'Chhatrapati Shivaji Maharaj International Airport, Mumbai' },
  { stationCode: 'SBC', airportCode: 'BLR', airportName: 'Kempegowda International Airport, Bengaluru' },
  { stationCode: 'YPR', airportCode: 'BLR', airportName: 'Kempegowda International Airport, Bengaluru' },
  { stationCode: 'SMVB', airportCode: 'BLR', airportName: 'Kempegowda International Airport, Bengaluru' },
  { stationCode: 'HWH', airportCode: 'CCU', airportName: 'Netaji Subhash Chandra Bose International Airport, Kolkata' },
  { stationCode: 'SDAH', airportCode: 'CCU', airportName: 'Netaji Subhash Chandra Bose International Airport, Kolkata' },
  { stationCode: 'MAS', airportCode: 'MAA', airportName: 'Chennai International Airport' },
  { stationCode: 'HYB', airportCode: 'HYD', airportName: 'Rajiv Gandhi International Airport, Hyderabad' },
  { stationCode: 'SC', airportCode: 'HYD', airportName: 'Rajiv Gandhi International Airport, Hyderabad' },
  { stationCode: 'MAO', airportCode: 'GOI', airportName: 'Dabolim / MOPA Airport, Goa' },
  { stationCode: 'THVM', airportCode: 'GOX', airportName: 'Manohar International Airport, Mopa, Goa' },
  { stationCode: 'ADI', airportCode: 'AMD', airportName: 'Sardar Vallabhbhai Patel International Airport, Ahmedabad' },
  { stationCode: 'JP', airportCode: 'JAI', airportName: 'Jaipur International Airport' },
  { stationCode: 'LKO', airportCode: 'LKO', airportName: 'Chaudhary Charan Singh International Airport, Lucknow' },
];

export function getMultiModalOptions(
  fromStation: Station,
  toStation: Station,
  date: string,
  travelClass: TravelClass
): MultiModalOption[] {
  const fromAirport = CITY_AIRPORTS.find((a) => a.stationCode === fromStation.code);
  const toAirport = CITY_AIRPORTS.find((a) => a.stationCode === toStation.code);

  if (!fromAirport || !toAirport || fromAirport.airportCode === toAirport.airportCode) {
    return [];
  }

  const options: MultiModalOption[] = [];

  // 1. Direct Non-Stop Flight Fallback
  options.push({
    id: `flight-${fromAirport.airportCode}-${toAirport.airportCode}`,
    title: `Direct Non-Stop Flight (${fromAirport.airportCode} → ${toAirport.airportCode})`,
    from: fromStation,
    to: toStation,
    mode: 'FLIGHT',
    leg1Description: `${fromAirport.airportName} (${fromAirport.airportCode})`,
    leg2Description: `IndiGo / Air India non-stop to ${toAirport.airportCode} (${travelClass})`,
    totalDuration: '2h 15m (flight) + 1h 45m transit',
    totalFare: 3850,
    status: 'AVAILABLE',
    notes: `Guaranteed confirmed departure on ${date} when trains are waitlisted. Includes 15 kg check-in baggage.`,
  });

  return options;
}

