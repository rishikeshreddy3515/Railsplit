import {
  cn,
  formatStationName,
  formatFare,
  calculateDuration,
  calculateDurationMinutes,
  calculateTransferDuration,
} from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('px-2 py-1', 'bg-red-500')).toBe('px-2 py-1 bg-red-500');
    });

    it('resolves conflicting tailwind classes', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles conditional class names', () => {
      expect(cn('btn', true && 'btn-active', false && 'btn-disabled')).toBe('btn btn-active');
    });
  });

  describe('formatStationName', () => {
    it('strips junction suffixes', () => {
      expect(formatStationName('New Delhi Junction')).toBe('New Delhi');
      expect(formatStationName('Mumbai Central')).toBe('Mumbai');
      expect(formatStationName('Kanpur Cantt')).toBe('Kanpur');
      expect(formatStationName('Pune City')).toBe('Pune');
      expect(formatStationName('CSMT Terminus')).toBe('CSMT');
    });

    it('returns original name when no suffix matches', () => {
      expect(formatStationName('Vadodara')).toBe('Vadodara');
      expect(formatStationName('Jodhpur')).toBe('Jodhpur');
    });

    it('handles empty or null-ish string', () => {
      expect(formatStationName('')).toBe('');
    });
  });

  describe('formatFare', () => {
    it('formats numbers with INR locale', () => {
      expect(formatFare(1200)).toBe('₹1,200');
      expect(formatFare(4180)).toBe('₹4,180');
      expect(formatFare(0)).toBe('₹0');
    });

    it('returns dash for null or undefined', () => {
      expect(formatFare(null)).toBe('—');
      expect(formatFare(undefined)).toBe('—');
    });
  });

  describe('calculateDurationMinutes', () => {
    it('calculates same-day duration in minutes', () => {
      expect(calculateDurationMinutes('10:00', 1, '14:30', 1)).toBe(270);
    });

    it('calculates next-day duration in minutes', () => {
      expect(calculateDurationMinutes('22:00', 1, '06:30', 2)).toBe(510);
    });

    it('handles wrapped midnight same day (implicit day rollover)', () => {
      expect(calculateDurationMinutes('23:00', 1, '01:00', 1)).toBe(120);
    });

    it('returns 0 for invalid inputs', () => {
      expect(calculateDurationMinutes(null, 1, '10:00', 1)).toBe(0);
      expect(calculateDurationMinutes('invalid', 1, '10:00', 1)).toBe(0);
    });
  });

  describe('calculateDuration', () => {
    it('formats hours and minutes', () => {
      expect(calculateDuration('10:00', 1, '14:30', 1)).toBe('4h 30m');
      expect(calculateDuration('10:00', 1, '14:00', 1)).toBe('4h');
      expect(calculateDuration('10:00', 1, '10:45', 1)).toBe('45m');
    });

    it('returns ~ for missing inputs', () => {
      expect(calculateDuration(null, 1, '10:00', 1)).toBe('~');
      expect(calculateDuration('invalid', 1, '10:00', 1)).toBe('~');
    });
  });

  describe('calculateTransferDuration', () => {
    it('delegates to calculateDuration', () => {
      expect(calculateTransferDuration('05:10', 2, '07:25', 2)).toBe('2h 15m');
    });
  });
});
