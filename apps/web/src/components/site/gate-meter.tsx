'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
 * diagram: it calls nothing, it compares three complexity classes, and it is
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

const gateMs = Math.ceil(BEST_MS * TOLERANCE) + FLOOR_MS;
/** The axis has to hold the slowest attempt with room to breathe. */
const SCALE_MS = 480;
const pct = (ms: number) => Math.min(100, (ms / SCALE_MS) * 100);

export function GateMeter() {
  const [index, setIndex] = useState(0);

  /*
    The instrument demonstrates itself, until someone takes it over.

    It cycles the three attempts on its own, because a reader who never touches
    it should still see the point being made: all three pass the tests, and only
    one clears the gate. A static first frame makes that argument only to people
    who happen to click.

    The moment anyone does interact, the cycle stops for good. That is not a
    nicety — WCAG 2.2.2 requires a mechanism to stop content that moves or
    updates automatically, and a control that also stops the automation is the
    least intrusive mechanism available here. It never resumes, because content
    that starts moving again after you have deliberately chosen a view is worse
    than content that never stopped.
  */
  const [auto, setAuto] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const take = useCallback((next: number) => {
    setAuto(false);
    setIndex(next);
  }, []);

  useEffect(() => {
    if (!auto) return;

    // Automatic movement is exactly what this preference asks not to see, and
    // the attempts stay reachable by the buttons either way.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let onScreen = true;
    let timer = 0;

    const tick = () => {
      // Nothing advances behind a hidden tab or an instrument scrolled past:
      // it would spend battery narrating to nobody, and the reader would return
      // to a frame they did not choose.
      if (!document.hidden && onScreen) {
        setIndex((i) => (i + 1) % ATTEMPTS.length);
      }
      timer = window.setTimeout(tick, 3600);
    };
    timer = window.setTimeout(tick, 3600);

    const observer = new IntersectionObserver(
      (entries) => {
        const latest = entries[entries.length - 1];
        if (latest) onScreen = latest.isIntersecting;
      },
      { threshold: 0.35 },
    );
    if (rootRef.current) observer.observe(rootRef.current);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [auto]);
  const attempt = ATTEMPTS[index]!;
  const measured = Math.min(...attempt.runs);
  const passed = measured <= gateMs;
  const ratio = measured / BEST_MS;

  return (
    <div className="gate-instrument" ref={rootRef}>
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
            /* Full width, scaled — not a width of N%. This is the one bar on
               the page that animates, and transitioning width makes the browser
               lay out and paint every frame, where a transform goes straight to
               the compositor. pct() is untouched and the gate marker is
               positioned independently, so the arithmetic is exactly as before. */
            className={`gate-runtime absolute inset-y-2 left-0 w-full origin-left rounded-r-xs ${
              passed ? 'bg-success' : 'bg-danger'
            }`}
            style={{ transform: `scaleX(${pct(measured) / 100})` }}
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

      {/* Explicit choices keep the comparison readable at any pace. */}
      <div className="mt-6 flex items-center gap-1.5">
        {ATTEMPTS.map((a, i) => (
          <button
            key={a.complexity}
            onClick={() => take(i)}
            onFocus={() => setAuto(false)}
            aria-label={`Show the ${a.complexity} attempt`}
            aria-pressed={i === index}
            className={`gate-attempt ${
              i === index ? 'is-selected' : ''
            }`}
          >{a.complexity}</button>
        ))}
      </div>
    </div>
  );
}
