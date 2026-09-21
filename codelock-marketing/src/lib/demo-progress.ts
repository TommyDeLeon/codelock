/**
 * The one solve a visitor can make on this site, remembered in their browser.
 *
 * The curriculum map on the landing page starts empty for everybody. The only
 * thing allowed to fill a cell is something the visitor actually did: clearing
 * the demo problem. Nothing is invented to make the map look lived in.
 *
 * localStorage, because this is a per-visitor convenience and the site has no
 * accounts. Every access is guarded: private windows and blocked storage throw.
 */
import type { PatternFamily } from '@codelock/shared';

const KEY = 'codelock:demo-solved';

/** The family the demo problem (Pair Sum) belongs to in the real corpus. */
export const DEMO_FAMILY: PatternFamily = 'ARRAYS_HASHING';

export function recordDemoSolve(): void {
  try { localStorage.setItem(KEY, DEMO_FAMILY); } catch { /* storage unavailable */ }
}

export function readDemoSolve(): PatternFamily | null {
  try { return (localStorage.getItem(KEY) as PatternFamily | null) ?? null; } catch { return null; }
}
