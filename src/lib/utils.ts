import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatStationName(name: string): string {
  if (!name) return '';
  return name.replace(/\s+(Junction|Central|City|Cantt|Terminus)$/i, '');
}

export function formatFare(fare: number | null | undefined): string {
  if (fare === null || fare === undefined) return '—';
  return `₹${fare.toLocaleString('en-IN')}`;
}

export function calculateDurationMinutes(
  departureTime?: string | null,
  departureDay: number = 1,
  arrivalTime?: string | null,
  arrivalDay: number = 1
): number {
  if (!departureTime || !arrivalTime) return 0;
  const [depH, depM] = departureTime.split(':').map(Number);
  const [arrH, arrM] = arrivalTime.split(':').map(Number);
  if (isNaN(depH) || isNaN(depM) || isNaN(arrH) || isNaN(arrM)) return 0;

  const depTotal = (Math.max(1, departureDay) - 1) * 1440 + depH * 60 + depM;
  let arrTotal = (Math.max(1, arrivalDay) - 1) * 1440 + arrH * 60 + arrM;

  if (arrTotal < depTotal) {
    arrTotal += 1440;
  }

  return Math.max(0, arrTotal - depTotal);
}

export function calculateDuration(
  departureTime?: string | null,
  departureDay: number = 1,
  arrivalTime?: string | null,
  arrivalDay: number = 1
): string {
  if (!departureTime || !arrivalTime) return '~';
  const [depH, depM] = departureTime.split(':').map(Number);
  const [arrH, arrM] = arrivalTime.split(':').map(Number);
  if (isNaN(depH) || isNaN(depM) || isNaN(arrH) || isNaN(arrM)) return '~';

  const diffMinutes = calculateDurationMinutes(departureTime, departureDay, arrivalTime, arrivalDay);
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

export function calculateTransferDuration(
  arrTime?: string | null,
  arrDay: number = 1,
  depTime?: string | null,
  depDay: number = 1
): string {
  return calculateDuration(arrTime, arrDay, depTime, depDay);
}
