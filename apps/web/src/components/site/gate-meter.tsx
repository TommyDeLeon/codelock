'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * The speed gate, drawn to scale.
 *
 * This is the one idea the whole product rests on — passing the tests is not
 * enough — and every other way of saying it is marketing. So the hero says it
 * with the actual instrument: two runs measured, the fastest kept, plotted
 * against a budget derived from the best known answer, with the verdict that
 * follows.
 *
 * Distinct from components/lock/speed-gate.tsx, which renders one real
 * server-issued verdict inside the lock workspace. This is an explanatory
 * diagram: it calls nothing, it cycles three complexity classes, and it is
 * honest about being a diagram. Code actually runs at /demo.
 *
 * The arithmetic is the same arithmetic the API applies, so the figures cannot
 * quietly drift into flattering fiction.
 */

/** Mirrors PERF_TOLERANCE / PERF_FLOOR_MS in the API's environment schema. */
const TOLERANCE = 1.35;
const FLOOR_MS = 40;

interface Attempt {
  label: string;
  complexity: string;
  /** Two timed runs; the gate keeps the faster one. */
  runs: [number, number];
}

/** Best known runtime for this problem in this language, in ms. */
const BEST_MS = 108;

const ATTEMPTS: Attempt[] = [
  { label: 'Nested loop over every pair', complexity: 'O(n²)', runs: [431, 412] },
  { label: 'Sort, then two pointers', complexity: 'O(n log n)', runs: [206, 198] },
  { label: 'Single pass, hash map', complexity: 'O(n)', runs: [119, 112] },
];

const gateMs = Math.round(BEST_MS * TOLERANCE + FLOOR_MS);
/** The axis has to hold the slowest attempt with room to breathe. */
const SCALE_MS = 480;
const pct = (ms: number) => Math.min(100, (ms / SCALE_MS) * 100);

export function GateMeter() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  /**
   * Set once the reader takes manual control, and never cleared.
   *
   * WCAG 2.2.2 wants a mechanism to STOP content that moves by itself for more
   * than five seconds, and pausing on hover is not one: a keyboard user has no
   * hover, and a touch user has no hover at all. Choosing an attempt is that
   * mechanism, so it has to stick — advancing away from the slide someone
   * deliberately selected, 2.6 seconds later, is the same problem wearing a
   * different hat.
   */
  const [stopped, setStopped] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Only advance while on screen and not hovered. An animation that runs
  // forever in a background tab is a battery cost with no reader.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    // IntersectionObserver answers "is this in the viewport", which is not the
    // same question as "can anyone see it". Switching tabs fires no
    // intersection change at all, so on its own this kept the interval running
    // in a background tab — the exact cost the comment above says it avoids.
    let intersecting = false;
    const sync = () => setVisible(intersecting && !document.hidden);

    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    document.addEventListener('visibilitychange', sync);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  useEffect(() => {
    if (!visible || paused || stopped || reducedMotion) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % ATTEMPTS.length), 2600);
    return () => window.clearInterval(id);
  }, [visible, paused, stopped, reducedMotion]);

  const attempt = ATTEMPTS[index]!;
  const measured = Math.min(...attempt.runs);
  const passed = measured <= gateMs;
  const ratio = measured / BEST_MS;

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      // Capture, so focus landing on any dot inside counts. Without these a
      // keyboard user reading the panel has it change under them.
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="rule-t rule-b bg-surface/60 px-5 py-6 sm:px-7 sm:py-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="eyebrow">Two Sum · JavaScript</p>
        <p className="font-mono text-[11px] text-faint">
          gate = best {BEST_MS}ms × {TOLERANCE} + {FLOOR_MS}ms ={' '}
          <span className="text-fg">{gateMs}ms</span>
        </p>
      </div>

      {/* The plot. Deliberately a single axis rather than a chart library:
          one number against one threshold is the entire story. */}
      <div className="mt-6">
        <div className="relative h-11">
          {/* Budget region, drawn behind the bar so the bar reads as crossing
              out of it rather than sitting on top of a decoration. */}
          <div
            className="absolute inset-y-0 left-0 rounded-l-xs bg-success-soft"
            style={{ width: `${pct(gateMs)}%` }}
            aria-hidden
          />
          {/* The runtime bar, drawn BEFORE the threshold so the threshold can
              cross it. Red while the gate is not cleared: this is the state the
              whole product exists to explain — every test passed and the
              machine is still locked — so it has to be legible at a glance,
              before a word of the readout is read. It was plain ink, which on
              the dark theme is near-white and read as a neutral block. */}
          <div
            className={`absolute inset-y-2 left-0 rounded-r-xs transition-[width,background-color] duration-700 ease-out ${
              passed ? 'bg-success' : 'bg-danger'
            }`}
            style={{ width: `${pct(measured)}%` }}
            aria-hidden
          />

          {/* The threshold, last so it paints on top. Drawn before the bar it
              was hidden underneath it the moment a run overshot — which is
              every locked case, the one time the reader most needs to see
              where the budget ended. */}
          <div
            className="absolute inset-y-0 w-0.5 bg-fg"
            style={{ left: `${pct(gateMs)}%` }}
            aria-hidden
          />

          <span
            className="absolute -top-0.5 translate-x-2 font-mono text-[11px] font-medium text-fg"
            style={{ left: `${pct(gateMs)}%` }}
            aria-hidden
          >
            gate
          </span>
        </div>

        {/* Live region so the verdict is announced, not just animated. */}
        <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1" aria-live="polite">
          <span className="font-mono text-sm text-fg">{attempt.complexity}</span>
          <span className="text-sm text-muted">{attempt.label}</span>
          <span className="ml-auto font-mono text-sm">
            <span className="text-faint">
              {attempt.runs[0]}ms / {attempt.runs[1]}ms →{' '}
            </span>
            <span className={passed ? 'text-success' : 'text-danger'}>{measured}ms</span>
          </span>
        </div>

        <p className={`mt-3 font-mono text-[13px] ${passed ? 'text-success' : 'text-danger'}`}>
          {passed
            ? `unlocked · ${ratio.toFixed(2)}× the best known answer`
            : `still locked · roughly ${ratio.toFixed(1)}× slower than the best known answer`}
        </p>
      </div>

      {/* Manual control, because an auto-advancing carousel with no way to stop
          it is hostile to anyone who reads slowly. */}
      <div className="mt-6 flex items-center gap-1.5">
        {ATTEMPTS.map((a, i) => (
          <button
            key={a.complexity}
            onClick={() => {
              setIndex(i);
              setStopped(true);
            }}
            aria-label={`Show the ${a.complexity} attempt`}
            aria-current={i === index}
            className={`h-1 flex-1 rounded-xs transition-colors ${
              i === index ? 'bg-fg' : 'bg-border-strong hover:bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
