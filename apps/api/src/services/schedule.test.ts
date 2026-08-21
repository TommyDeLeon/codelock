import { describe, expect, it } from 'vitest';
import { ALL_DAYS, formatMinute, isDayEnabled, isWithinActiveWindow, localParts } from './schedule.js';

/** 2026-08-21 is a Friday. */
const friday = (hhmm: string, zone = 'Z') => new Date(`2026-08-21T${hhmm}:00${zone}`);

const nineToFive = {
  activeDaysMask: 0b0111110, // Mon–Fri
  activeFromMinute: 9 * 60,
  activeToMinute: 17 * 60,
};

describe('localParts', () => {
  it('reads the day and minute in the user timezone, not the server one', () => {
    // 02:00 UTC Friday is still Thursday evening in New York.
    const parts = localParts(friday('02:00'), 'America/New_York');
    expect(parts.day).toBe(4); // Thursday
    expect(parts.minute).toBe(22 * 60);
  });

  it('falls back to UTC for an unusable timezone rather than throwing', () => {
    // A bad profile value must not make the app unusable.
    const parts = localParts(friday('09:30'), 'Not/AZone');
    expect(parts.minute).toBe(9 * 60 + 30);
  });
});

describe('day mask', () => {
  it('maps Sunday to bit 0 and Saturday to bit 6', () => {
    expect(isDayEnabled(0b0000001, 0)).toBe(true);
    expect(isDayEnabled(0b1000000, 6)).toBe(true);
    expect(isDayEnabled(0b0111110, 0)).toBe(false);
    expect(isDayEnabled(ALL_DAYS, 3)).toBe(true);
  });
});

describe('isWithinActiveWindow', () => {
  it('allows a weekday inside the hours', () => {
    expect(isWithinActiveWindow(nineToFive, 'UTC', friday('10:00')).active).toBe(true);
  });

  it('blocks before the window opens', () => {
    const v = isWithinActiveWindow(nineToFive, 'UTC', friday('08:59'));
    expect(v.active).toBe(false);
    expect(v.reason).toMatch(/only active between 09:00 and 17:00/);
  });

  it('treats the end minute as exclusive', () => {
    // 17:00 is the end of the day, not one more minute of it.
    expect(isWithinActiveWindow(nineToFive, 'UTC', friday('16:59')).active).toBe(true);
    expect(isWithinActiveWindow(nineToFive, 'UTC', friday('17:00')).active).toBe(false);
  });

  it('blocks a disabled day even inside the hours', () => {
    const saturday = new Date('2026-08-22T10:00:00Z');
    const v = isWithinActiveWindow(nineToFive, 'UTC', saturday);
    expect(v.active).toBe(false);
    expect(v.reason).toMatch(/off on Saturday/);
  });

  it('judges the day in the user timezone', () => {
    // 02:00 UTC Friday is Thursday 22:00 in New York — outside 9–5 there,
    // even though the server clock says Friday mid-morning is fine.
    expect(isWithinActiveWindow(nineToFive, 'America/New_York', friday('02:00')).active).toBe(false);
    // 14:00 UTC is 10:00 in New York, which is inside.
    expect(isWithinActiveWindow(nineToFive, 'America/New_York', friday('14:00')).active).toBe(true);
  });

  it('is always on with the default configuration', () => {
    const always = { activeDaysMask: ALL_DAYS, activeFromMinute: 0, activeToMinute: 1440 };
    for (const hour of ['00:00', '03:30', '12:00', '23:59']) {
      expect(isWithinActiveWindow(always, 'UTC', friday(hour)).active).toBe(true);
    }
  });
});

describe('windows that wrap past midnight', () => {
  // 22:00–02:00 is an ordinary way to describe an evening block, and would be
  // rejected outright if from/to were compared naively.
  const evening = { activeDaysMask: ALL_DAYS, activeFromMinute: 22 * 60, activeToMinute: 2 * 60 };

  it('is active late in the evening', () => {
    expect(isWithinActiveWindow(evening, 'UTC', friday('23:30')).active).toBe(true);
  });

  it('is active after midnight', () => {
    expect(isWithinActiveWindow(evening, 'UTC', new Date('2026-08-22T01:00:00Z')).active).toBe(true);
  });

  it('is inactive in the middle of the day', () => {
    expect(isWithinActiveWindow(evening, 'UTC', friday('12:00')).active).toBe(false);
  });

  it('attributes the small hours to the day the window opened', () => {
    // Friday-only 22:00–02:00: Saturday 01:00 is still the Friday session.
    const fridayEvening = { ...evening, activeDaysMask: 0b0100000 };
    expect(
      isWithinActiveWindow(fridayEvening, 'UTC', new Date('2026-08-22T01:00:00Z')).active,
    ).toBe(true);
    // Saturday 23:00 opens a Saturday window, which is disabled.
    expect(
      isWithinActiveWindow(fridayEvening, 'UTC', new Date('2026-08-22T23:00:00Z')).active,
    ).toBe(false);
  });
});

describe('formatMinute', () => {
  it('renders zero-padded 24-hour time', () => {
    expect(formatMinute(0)).toBe('00:00');
    expect(formatMinute(570)).toBe('09:30');
    expect(formatMinute(1439)).toBe('23:59');
    expect(formatMinute(1440)).toBe('00:00');
  });
});
