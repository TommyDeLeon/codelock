/**
 * When CodeLock is allowed to lock you.
 *
 * A focus tool that can interrupt at 3am, or during a meeting, is a tool people
 * uninstall. The schedule bounds it to the days and hours the user chose.
 *
 * These fields existed in the schema from the start and were validated on the
 * way in, but nothing ever read them — `armSession` only checked `enabled`, so
 * a configured window had no effect whatsoever. This module is what makes them
 * real.
 *
 * Everything here is pure: the caller supplies "now", so the behaviour is
 * testable without waiting for Tuesday.
 */

/** Sunday = bit 0, Saturday = bit 6. 127 = every day. */
export const ALL_DAYS = 0b1111111;

export interface Schedule {
  activeDaysMask: number;
  /** Minutes past local midnight. */
  activeFromMinute: number;
  activeToMinute: number;
}

export interface WindowVerdict {
  active: boolean;
  /** Why not, phrased for the user. Null when active. */
  reason: string | null;
  /** Local time used for the decision, for logging and for the API response. */
  localDay: number;
  localMinute: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * The user's local wall-clock day and minute.
 *
 * The server runs in UTC and the user is wherever they are, so "is it a
 * weekday" has to be answered in their timezone or the schedule silently
 * shifts by hours. An invalid timezone falls back to UTC rather than throwing:
 * a bad profile value should not make the app unusable.
 */
export function localParts(now: Date, timeZone: string): { day: number; minute: number } {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);
  }

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';

  const weekday = lookup('weekday');
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
  // 24-hour formatting renders midnight as "24" in some locales/engines.
  const hour = Number(lookup('hour')) % 24;
  const minute = Number(lookup('minute'));

  return { day: day === -1 ? now.getUTCDay() : day, minute: hour * 60 + minute };
}

export function isDayEnabled(mask: number, day: number): boolean {
  return (mask & (1 << day)) !== 0;
}

/**
 * Is the lock allowed to fire right now?
 *
 * A window where `from > to` wraps past midnight (22:00–06:00, say), which is a
 * perfectly ordinary way to describe an evening session and would otherwise be
 * rejected as invalid. In that case the day is judged by when the window
 * *opened*, so a Friday 22:00–02:00 block still counts as Friday at 01:00.
 */
export function isWithinActiveWindow(
  schedule: Schedule,
  timeZone: string,
  now: Date = new Date(),
): WindowVerdict {
  const { day, minute } = localParts(now, timeZone);
  const { activeDaysMask, activeFromMinute, activeToMinute } = schedule;

  const wraps = activeFromMinute > activeToMinute;
  const inTime = wraps
    ? minute >= activeFromMinute || minute < activeToMinute
    : minute >= activeFromMinute && minute < activeToMinute;

  // For a wrapping window the small hours belong to the previous day.
  const effectiveDay = wraps && minute < activeToMinute ? (day + 6) % 7 : day;
  const inDay = isDayEnabled(activeDaysMask, effectiveDay);

  if (!inDay) {
    return {
      active: false,
      reason: `CodeLock is off on ${DAY_NAMES[effectiveDay]}.`,
      localDay: day,
      localMinute: minute,
    };
  }
  if (!inTime) {
    return {
      active: false,
      reason: `CodeLock is only active between ${formatMinute(activeFromMinute)} and ${formatMinute(
        activeToMinute,
      )}. It is ${formatMinute(minute)} for you.`,
      localDay: day,
      localMinute: minute,
    };
  }
  return { active: true, reason: null, localDay: day, localMinute: minute };
}

/** 570 -> "09:30". */
export function formatMinute(totalMinutes: number): string {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
