import { describe, it, expect } from 'vitest';
import { getReminderDateRange } from '../index';

describe('booking-reminders helpers', () => {
  it('calculates date range 3 days ahead', () => {
    const base = new Date('2024-01-01T12:00:00Z');
    const { start, end } = getReminderDateRange(base);
    expect(start.toISOString()).toBe('2024-01-04T00:00:00.000Z');
    expect(end.toISOString()).toBe('2024-01-04T23:59:59.999Z');
  });
});
