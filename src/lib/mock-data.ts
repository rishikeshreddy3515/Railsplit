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
import { getHistoricalDelay } from './delay-buffer';

// ── Station database (derived from authentic IRCTC schedules & RouteChef network) ──

export const STATIONS: Station[] = [
  // Western / North-Western
  { code: 'JU', name: 'Jodhpur Junction', city: 'Jodhpur' },
  { code: 'MJ', name: 'Marwar Junction', city: 'Marwar' },
  { code: 'FA', name: 'Falna', city: 'Falna' },
  { code: 'ABR', name: 'Abu Road', city: 'Mount Abu' },
  { code: 'PNU', name: 'Palanpur Junction', city: 'Palanpur' },
  { code: 'MSH', name: 'Mahesana Junction', city: 'Mahesana' },
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad' },
  { code: 'ANND', name: 'Anand Junction', city: 'Anand' },
  { code: 'BRC', name: 'Vadodara Junction', city: 'Vadodara' },
  { code: 'ST', name: 'Surat', city: 'Surat' },
  { code: 'BSR', name: 'Vasai Road', city: 'Mumbai', cityCluster: 'MUMBAI' },
  { code: 'KYN', name: 'Kalyan Junction', city: 'Mumbai', cityCluster: 'MUMBAI' },
  { code: 'BVI', name: 'Borivali', city: 'Mumbai', cityCluster: 'MUMBAI' },
  { code: 'BOM', name: 'Mumbai Central', city: 'Mumbai', cityCluster: 'MUMBAI' },
  { code: 'MMCT', name: 'Mumbai Central (MMCT)', city: 'Mumbai', cityCluster: 'MUMBAI' },
  { code: 'CSMT', name: 'Mumbai CSMT', city: 'Mumbai', cityCluster: 'MUMBAI' },
  { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'Mumbai', cityCluster: 'MUMBAI' },
  { code: 'BDTS', name: 'Bandra Terminus', city: 'Mumbai', cityCluster: 'MUMBAI' },
  { code: 'PNVL', name: 'Panvel', city: 'Mumbai', cityCluster: 'MUMBAI' },
  { code: 'RN', name: 'Ratnagiri', city: 'Ratnagiri' },
  { code: 'THVM', name: 'Thivim (North Goa)', city: 'Goa' },
  { code: 'MAO', name: 'Madgaon Junction (Goa)', city: 'Goa' },

  // Central / Deccan
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune' },
  { code: 'DD', name: 'Daund Junction', city: 'Daund' },
  { code: 'SUR', name: 'Solapur', city: 'Solapur' },
  { code: 'KLBG', name: 'Kalaburagi', city: 'Kalaburagi' },
  { code: 'WADI', name: 'Wadi Junction', city: 'Wadi' },
  { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad', cityCluster: 'HYDERABAD' },
  { code: 'HYB', name: 'Hyderabad Deccan', city: 'Hyderabad', cityCluster: 'HYDERABAD' },
  { code: 'KCG', name: 'Kacheguda', city: 'Hyderabad', cityCluster: 'HYDERABAD' },
  { code: 'KZJ', name: 'Kazipet Junction', city: 'Kazipet' },
  { code: 'WL', name: 'Warangal', city: 'Warangal' },
  { code: 'KMT', name: 'Khammam', city: 'Khammam' },
  { code: 'GNT', name: 'Guntur Junction', city: 'Guntur' },
  { code: 'BZA', name: 'Vijayawada Junction', city: 'Vijayawada' },

  // Southern
  { code: 'SBC', name: 'KSR Bengaluru City', city: 'Bengaluru', cityCluster: 'BENGALURU' },
  { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bengaluru', cityCluster: 'BENGALURU' },
  { code: 'SMVB', name: 'SMVT Bengaluru', city: 'Bengaluru', cityCluster: 'BENGALURU' },
  { code: 'MAS', name: 'Chennai Central', city: 'Chennai' },

  // Northern & Central
  { code: 'NDLS', name: 'New Delhi', city: 'Delhi', cityCluster: 'DELHI' },
  { code: 'NZM', name: 'Hazrat Nizamuddin (Delhi)', city: 'Delhi', cityCluster: 'DELHI' },
  { code: 'DLI', name: 'Old Delhi Junction', city: 'Delhi', cityCluster: 'DELHI' },
  { code: 'DEL', name: 'Delhi Cantt', city: 'Delhi', cityCluster: 'DELHI' },
  { code: 'AGC', name: 'Agra Cantt', city: 'Agra' },
  { code: 'MTJ', name: 'Mathura Junction', city: 'Mathura' },
  { code: 'SWM', name: 'Sawai Madhopur Junction', city: 'Sawai Madhopur' },
  { code: 'GWL', name: 'Gwalior Junction', city: 'Gwalior' },
  { code: 'VGLJ', name: 'VGL Jhansi Junction', city: 'Jhansi' },
  { code: 'KOTA', name: 'Kota Junction', city: 'Kota' },
  { code: 'RTM', name: 'Ratlam Junction', city: 'Ratlam' },
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal' },
  { code: 'NGP', name: 'Nagpur Junction', city: 'Nagpur' },
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur' },
  { code: 'HW', name: 'Haridwar Junction', city: 'Haridwar' },
  { code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow' },
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur' },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi' },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Junction', city: 'Mughalsarai' },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna' },

  // Eastern & Coast
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', cityCluster: 'KOLKATA' },
  { code: 'SDAH', name: 'Sealdah', city: 'Kolkata', cityCluster: 'KOLKATA' },
  { code: 'BBS', name: 'Bhubaneswar', city: 'Bhubaneswar' },
  { code: 'VSKP', name: 'Visakhapatnam Junction', city: 'Visakhapatnam' },
  { code: 'GHY', name: 'Guwahati Junction', city: 'Guwahati' },
];

// Major junctions have dedicated Remote Location Quotas (RLWL) in IRCTC
export const MAJOR_JUNCTIONS = new Set([
  'JU', 'ADI', 'BRC', 'ST', 'BSR', 'CSMT', 'BOM', 'MMCT', 'LTT', 'BDTS', 'PUNE',
  'SUR', 'WADI', 'SC', 'HYB', 'KCG', 'BZA', 'NDLS', 'NZM', 'DLI', 'BPL', 'NGP', 'MAS',
  'SBC', 'YPR', 'SMVB', 'RN', 'MAO', 'KOTA', 'RTM', 'JP', 'HW', 'HWH', 'SDAH',
  'LKO', 'CNB', 'BSB', 'DDU', 'PNBE', 'AGC', 'GWL', 'VGLJ', 'VSKP', 'BBS', 'SWM', 'BVI'
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

// ── Realistic Curated Train Routes ──

export const TRAIN_ROUTES: TrainRoute[] = [
  // 1. Featured Route: 14803 Jodhpur - Vijayawada Express
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
      makeStop('BZA', '01:10', '01:30', 3),
      makeStop('SBC', '12:45', null, 3),
    ],
  },

  // 3. 22229 CSMT MAO Vande Bharat Express
  {
    trainNumber: '22229',
    trainName: 'CSMT MAO Vande Bharat Express',
    classesAvailable: ['CC', 'EC', '2A'],
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

  // 6. 12952 Mumbai Rajdhani Express (Strictly only real halts: NDLS, KOTA, SWM, RTM, BRC, ST, BVI, MMCT)
  {
    trainNumber: '12952',
    trainName: 'Mumbai Rajdhani Express',
    classesAvailable: ['3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('NDLS', null, '16:55', 1),
      makeStop('KOTA', '21:05', '21:15', 1),
      makeStop('SWM', '22:20', '22:25', 1),
      makeStop('RTM', '00:35', '00:40', 2),
      makeStop('BRC', '03:50', '03:55', 2),
      makeStop('ST', '05:15', '05:20', 2),
      makeStop('BVI', '07:35', '07:37', 2),
      makeStop('MMCT', '08:35', null, 2),
    ],
  },

  // 7. 12951 Mumbai Rajdhani Express (Up)
  {
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani Express (Up)',
    classesAvailable: ['3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('MMCT', null, '17:00', 1),
      makeStop('BVI', '17:22', '17:24', 1),
      makeStop('ST', '19:35', '19:40', 1),
      makeStop('BRC', '21:05', '21:10', 1),
      makeStop('RTM', '00:20', '00:25', 2),
      makeStop('SWM', '02:15', '02:20', 2),
      makeStop('KOTA', '03:15', '03:20', 2),
      makeStop('NDLS', '08:30', null, 2),
    ],
  },

  // 8. 12954 August Kranti Tejas Rajdhani (Hazrat Nizamuddin to Mumbai Central)
  {
    trainNumber: '12954',
    trainName: 'August Kranti Tejas Rajdhani',
    classesAvailable: ['3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('NZM', null, '17:15', 1),
      makeStop('MTJ', '19:08', '19:10', 1),
      makeStop('SWM', '21:08', '21:10', 1),
      makeStop('KOTA', '22:00', '22:10', 1),
      makeStop('RTM', '01:10', '01:15', 2),
      makeStop('BRC', '04:40', '04:45', 2),
      makeStop('ST', '06:10', '06:15', 2),
      makeStop('BVI', '09:10', '09:12', 2),
      makeStop('MMCT', '10:05', null, 2),
    ],
  },

  // 9. 12432 Trivandrum Rajdhani Express (New Delhi to South)
  {
    trainNumber: '12432',
    trainName: 'Trivandrum Rajdhani Express',
    classesAvailable: ['3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('NDLS', null, '10:55', 1),
      makeStop('MTJ', '13:10', '13:15', 1),
      makeStop('AGC', '14:00', '14:05', 1),
      makeStop('GWL', '15:20', '15:25', 1),
      makeStop('VGLJ', '16:45', '16:55', 1),
      makeStop('BPL', '19:55', '20:10', 1),
      makeStop('NGP', '02:30', '02:45', 2),
      makeStop('SC', '10:20', '10:40', 2),
      makeStop('BZA', '13:30', '13:45', 2),
      makeStop('GNT', '14:55', '15:05', 2),
      makeStop('MAS', '22:30', null, 2),
    ],
  },

  // 10. 12626 Kerala Express (New Delhi to South Corridors)
  {
    trainNumber: '12626',
    trainName: 'Kerala Express',
    classesAvailable: ['SL', '3A', '2A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('NDLS', null, '20:10', 1),
      makeStop('MTJ', '22:10', '22:15', 1),
      makeStop('AGC', '23:05', '23:10', 1),
      makeStop('GWL', '00:30', '00:35', 2),
      makeStop('VGLJ', '02:00', '02:10', 2),
      makeStop('BPL', '05:40', '05:50', 2),
      makeStop('NGP', '11:45', '11:55', 2),
      makeStop('BZA', '21:30', '21:45', 2),
      makeStop('MAS', '04:15', null, 3),
    ],
  },

  // 11. 12246 SMVT Bengaluru - Howrah Duronto Express
  {
    trainNumber: '12246',
    trainName: 'SMVT Bengaluru - Howrah Duronto',
    classesAvailable: ['SL', '3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('SBC', null, '11:00', 1),
      makeStop('SMVB', '11:20', '11:22', 1),
      makeStop('BZA', '20:10', '20:25', 1),
      makeStop('VSKP', '02:45', '03:05', 2),
      makeStop('BBS', '08:40', '08:45', 2),
      makeStop('HWH', '15:45', null, 2),
    ],
  },

  // 12. 12840 Howrah Mail (Chennai to Howrah via Vijayawada)
  {
    trainNumber: '12840',
    trainName: 'Howrah Mail',
    classesAvailable: ['SL', '3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('MAS', null, '19:00', 1),
      makeStop('BZA', '01:50', '02:05', 2),
      makeStop('VSKP', '08:35', '08:55', 2),
      makeStop('BBS', '14:40', '14:45', 2),
      makeStop('HWH', '23:00', null, 2),
    ],
  },

  // 13. 12302 New Delhi - Howrah Rajdhani Express
  {
    trainNumber: '12302',
    trainName: 'Howrah Rajdhani Express',
    classesAvailable: ['3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('NDLS', null, '16:50', 1),
      makeStop('CNB', '21:32', '21:37', 1),
      makeStop('DDU', '01:42', '01:52', 2),
      makeStop('PNBE', '04:10', '04:20', 2),
      makeStop('HWH', '09:55', null, 2),
    ],
  },

  // 14. 12301 Howrah - New Delhi Rajdhani Express
  {
    trainNumber: '12301',
    trainName: 'Howrah - New Delhi Rajdhani Express',
    classesAvailable: ['3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('HWH', null, '16:50', 1),
      makeStop('PNBE', '22:15', '22:25', 1),
      makeStop('DDU', '00:45', '00:55', 2),
      makeStop('CNB', '04:50', '04:55', 2),
      makeStop('NDLS', '10:05', null, 2),
    ],
  },

  // 15. 12138 Punjab Mail (New Delhi to Mumbai CSMT via Bhopal)
  {
    trainNumber: '12138',
    trainName: 'Punjab Mail',
    classesAvailable: ['SL', '3A', '2A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('NDLS', null, '05:15', 1),
      makeStop('MTJ', '07:00', '07:05', 1),
      makeStop('AGC', '07:55', '08:00', 1),
      makeStop('GWL', '09:38', '09:40', 1),
      makeStop('VGLJ', '11:15', '11:25', 1),
      makeStop('BPL', '15:35', '15:40', 1),
      makeStop('CSMT', '07:35', null, 2),
    ],
  },

  // 16. 22692 Bengaluru Rajdhani Express (Hazrat Nizamuddin to KSR Bengaluru)
  {
    trainNumber: '22692',
    trainName: 'Bengaluru Rajdhani Express',
    classesAvailable: ['3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('NZM', null, '20:45', 1),
      makeStop('AGC', '22:58', '23:00', 1),
      makeStop('GWL', '00:28', '00:30', 2),
      makeStop('VGLJ', '01:50', '01:55', 2),
      makeStop('BPL', '05:20', '05:25', 2),
      makeStop('NGP', '11:20', '11:25', 2),
      makeStop('SC', '18:50', '19:00', 2),
      makeStop('SBC', '05:20', null, 3),
    ],
  },

  // 17. 12915 Ashram Express
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

  // 18. 22457 Haridwar Vande Bharat Express
  {
    trainNumber: '22457',
    trainName: 'Haridwar Vande Bharat Express',
    classesAvailable: ['CC', 'EC', '2A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('NDLS', null, '06:00', 1),
      makeStop('HW', '09:30', null, 1),
    ],
  },

  // 19. 20978 Ajmer Vande Bharat Express
  {
    trainNumber: '20978',
    trainName: 'Ajmer Vande Bharat Express',
    classesAvailable: ['CC', 'EC', '2A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('NDLS', null, '06:10', 1),
      makeStop('JP', '10:05', null, 1),
    ],
  },

  // 20. 12124 Deccan Queen (Pune to Mumbai CSMT)
  {
    trainNumber: '12124',
    trainName: 'Deccan Queen',
    classesAvailable: ['2S', 'CC'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('PUNE', null, '07:15', 1),
      makeStop('KYN', '09:33', '09:35', 1),
      makeStop('CSMT', '10:25', null, 1),
    ],
  },

  // 21. 12123 Deccan Queen (Mumbai CSMT to Pune)
  {
    trainNumber: '12123',
    trainName: 'Deccan Queen (Down)',
    classesAvailable: ['2S', 'CC'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('CSMT', null, '17:10', 1),
      makeStop('KYN', '18:08', '18:10', 1),
      makeStop('PUNE', '20:25', null, 1),
    ],
  },

  // 22. 11089 BGKT PUNE EXP (Jodhpur / Bhagat Ki Kothi to Pune via Ahmedabad)
  {
    trainNumber: '11089',
    trainName: 'BGKT Pune Express',
    classesAvailable: ['SL', '3A', '2A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('JU', null, '12:20', 1),
      makeStop('MJ', '13:28', '13:30', 1),
      makeStop('FA', '14:13', '14:15', 1),
      makeStop('ABR', '15:45', '15:55', 1),
      makeStop('PNU', '16:43', '16:45', 1),
      makeStop('MSH', '17:38', '17:40', 1),
      makeStop('ADI', '19:00', '19:15', 1),
      makeStop('ANND', '20:48', '20:50', 1),
      makeStop('BRC', '21:35', '21:40', 1),
      makeStop('ST', '23:30', '23:35', 1),
      makeStop('BSR', '03:25', '03:30', 2),
      makeStop('KYN', '04:42', '04:45', 2),
      makeStop('PUNE', '07:35', null, 2),
    ],
  },

  // 23. 12655 Navjeevan Superfast Express (Ahmedabad to Chennai via Vijayawada)
  {
    trainNumber: '12655',
    trainName: 'Navjeevan Superfast Express',
    classesAvailable: ['SL', '3A', '2A', '1A'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops: [
      makeStop('ADI', null, '21:25', 1),
      makeStop('ANND', '22:30', '22:32', 1),
      makeStop('BRC', '23:05', '23:10', 1),
      makeStop('ST', '01:10', '01:15', 2),
      makeStop('NGP', '12:45', '12:55', 2),
      makeStop('WL', '18:50', '18:55', 2),
      makeStop('KMT', '20:08', '20:10', 2),
      makeStop('BZA', '21:50', '22:05', 2),
      makeStop('MAS', '05:00', null, 3),
    ],
  },
];

// ── Approximate Geographic Coordinates for Corridor Route Synthesis ──
export const STATION_COORDS: Record<string, { lat: number; lon: number }> = {
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
  BVI: { lat: 19.23, lon: 72.86 },
  BOM: { lat: 18.97, lon: 72.82 },
  MMCT: { lat: 18.97, lon: 72.82 },
  CSMT: { lat: 18.94, lon: 72.83 },
  LTT: { lat: 19.07, lon: 72.89 },
  BDTS: { lat: 19.05, lon: 72.84 },
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
  HYB: { lat: 17.39, lon: 78.47 },
  KCG: { lat: 17.38, lon: 78.49 },
  KZJ: { lat: 17.98, lon: 79.52 },
  WL: { lat: 17.96, lon: 79.59 },
  KMT: { lat: 17.24, lon: 80.15 },
  GNT: { lat: 16.30, lon: 80.44 },
  BZA: { lat: 16.51, lon: 80.64 },
  SBC: { lat: 12.97, lon: 77.57 },
  YPR: { lat: 13.02, lon: 77.55 },
  SMVB: { lat: 12.99, lon: 77.65 },
  MAS: { lat: 13.08, lon: 80.28 },
  NDLS: { lat: 28.61, lon: 77.21 },
  NZM: { lat: 28.59, lon: 77.25 },
  DLI: { lat: 28.66, lon: 77.23 },
  DEL: { lat: 28.58, lon: 77.12 },
  AGC: { lat: 27.16, lon: 77.99 },
  MTJ: { lat: 27.49, lon: 77.67 },
  SWM: { lat: 25.99, lon: 76.37 },
  GWL: { lat: 26.22, lon: 78.18 },
  VGLJ: { lat: 25.45, lon: 78.57 },
  KOTA: { lat: 25.18, lon: 75.83 },
  RTM: { lat: 23.33, lon: 75.03 },
  BPL: { lat: 23.25, lon: 77.41 },
  NGP: { lat: 21.14, lon: 79.08 },
  JP: { lat: 26.91, lon: 75.79 },
  HW: { lat: 29.94, lon: 78.16 },
  HWH: { lat: 22.58, lon: 88.34 },
  SDAH: { lat: 22.57, lon: 88.37 },
  LKO: { lat: 26.85, lon: 80.94 },
  CNB: { lat: 26.45, lon: 80.35 },
  BSB: { lat: 25.33, lon: 82.99 },
  DDU: { lat: 25.28, lon: 83.12 },
  PNBE: { lat: 25.60, lon: 85.14 },
  GHY: { lat: 26.18, lon: 91.75 },
  VSKP: { lat: 17.72, lon: 83.29 },
  BBS: { lat: 20.27, lon: 85.84 },
};

// Cache for synthesized train routes so all sub-segments and checks resolve
const MAX_SYNTHESIZED_ROUTES = 500;
const SYNTHESIZED_ROUTES = new Map<string, TrainRoute>();

function cacheSynthesizedRoute(key: string, route: TrainRoute) {
  if (SYNTHESIZED_ROUTES.size >= MAX_SYNTHESIZED_ROUTES) {
    const oldestKey = SYNTHESIZED_ROUTES.keys().next().value;
    if (oldestKey) SYNTHESIZED_ROUTES.delete(oldestKey);
  }
  SYNTHESIZED_ROUTES.set(key, route);
}

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

export function getDeterministicTrainNumber(originIndex: number, destIndex: number, totalStations: number): string {
  const pairIndex = originIndex * totalStations + destIndex;
  // Deterministic, collision-free mapping into authentic Indian Railways reserved Mail/Express ranges:
  // 12001–12999 (Superfast/Rajdhani/Shatabdi, 999 slots)
  // 16001–19999 (Long-distance Express, 3999 slots)
  // 20101–20999 (Vande Bharat / Superfast, 899 slots)
  // 22101–22999 (Superfast Express, 899 slots)
  if (pairIndex < 999) {
    return String(12001 + pairIndex);
  } else if (pairIndex < 999 + 3999) {
    return String(16001 + (pairIndex - 999));
  } else if (pairIndex < 999 + 3999 + 899) {
    return String(20101 + (pairIndex - 4998));
  } else {
    return String(22101 + ((pairIndex - 5897) % 899));
  }
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
  const originIndex = STATIONS.findIndex((s) => s.code === fromCode);
  const destIndex = STATIONS.findIndex((s) => s.code === toCode);
  const totalStations = STATIONS.length;
  const safeOriginIdx = originIndex >= 0 ? originIndex : seed % totalStations;
  const safeDestIdx = destIndex >= 0 ? destIndex : (seed + 1) % totalStations;

  const trainNum = getDeterministicTrainNumber(safeOriginIdx, safeDestIdx, totalStations);
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
    classesAvailable: ['SL', '3A', '2A', '1A', 'CC', '2S'],
    runningDays: [0, 1, 2, 3, 4, 5, 6],
    stops,
  };
}

// ── Realistic IRCTC Quota & Availability Modeling ──

export function simpleHash(str: string): number {
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

export function simulateQuotaAvailability(
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
  const isOriginatingStation = fromIdx === 0;

  const key = `${trainNumber}:${from}:${to}:${date}:${travelClass}`;
  const hash = simpleHash(key);
  const bucket = hash % 100;

  // Originating station has bulk General Quota (GNWL): 80% confirmed availability
  if (isOriginatingStation && !isEndToEnd) {
    if (bucket < 80) {
      const seats = 10 + (hash % 35);
      return { status: 'CONFIRMED', statusDetail: `AVAILABLE ${seats}`, quota: 'GN' };
    }
    const racNum = 1 + (hash % 10);
    return { status: 'RAC', statusDetail: `RAC ${racNum}`, quota: 'GN' };
  }

  // End-to-end long-distance routes: heavy booking demand
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
  // If either endpoint is a major junction (e.g. ADI, BRC, ST, PUNE, SUR, BZA, KOTA, NGP, BPL),
  // Remote Location (RLWL) pools provide high confirmed seat availability!
  const connectsMajorJunction = MAJOR_JUNCTIONS.has(from) || MAJOR_JUNCTIONS.has(to);
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
export function calculateRealisticFare(
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
    EC: 2.85,
  };

  const fixedFee: Record<TravelClass, number> = {
    '2S': 50,
    SL: 120,
    CC: 180,
    '3A': 220,
    '2A': 280,
    '1A': 380,
    EC: 260,
  };

  const rate = ratesPerKm[travelClass] || 1.38;
  const fee = fixedFee[travelClass] || 220;
  const base = Math.round(estimatedKm * rate + fee);
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
    if (!date || isNaN(Date.parse(date))) {
      throw new Error(`Invalid travel date format: "${date}". Expected valid date (YYYY-MM-DD).`);
    }
    const dayOfWeek = new Date(date).getDay();

    // Support BOM and MMCT interchangeably for Mumbai Central lookups
    const matchesStation = (stopCode: string, targetCode: string) =>
      stopCode === targetCode ||
      (targetCode === 'BOM' && stopCode === 'MMCT') ||
      (targetCode === 'MMCT' && stopCode === 'BOM');

    // 1. Check curated routes first
    const curatedMatches = TRAIN_ROUTES.filter((train) => {
      if (!train.runningDays.includes(dayOfWeek)) return false;
      const fromIdx = train.stops.findIndex((s) => matchesStation(s.station.code, from));
      const toIdx = train.stops.findIndex((s) => matchesStation(s.station.code, to));
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
      cacheSynthesizedRoute(cacheKey, synthesized);
      cacheSynthesizedRoute(synthesized.trainNumber, synthesized);
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
    if (!date || isNaN(Date.parse(date))) {
      throw new Error(`Invalid travel date format: "${date}". Expected valid date (YYYY-MM-DD).`);
    }
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

    const matchesStation = (stopCode: string, targetCode: string) =>
      stopCode === targetCode ||
      (targetCode === 'BOM' && stopCode === 'MMCT') ||
      (targetCode === 'MMCT' && stopCode === 'BOM');

    const fromStop = train.stops.find((s) => matchesStation(s.station.code, from));
    const toStop = train.stops.find((s) => matchesStation(s.station.code, to));

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
      fromStop.station.code,
      toStop.station.code,
      date,
      travelClass
    );

    const fare =
      status === 'NOT_AVAILABLE'
        ? null
        : calculateRealisticFare(trainNumber, fromStop.station.code, toStop.station.code, travelClass);

    const historicalDelay = getHistoricalDelay(trainNumber, train.trainName);

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
      historicalDelay,
    };
  }
}
