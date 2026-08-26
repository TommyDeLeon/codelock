'use client';

import { useEffect, useRef } from 'react';

/**
 * The ambient background for the marketing heroes.
 *
 * Source code seen from too far away to read: the ragged indent ladder of a
 * file, drifting slowly upward in two parallax layers. All of the drawing and
 * all of the motion is CSS — see "the code field" in globals.css — so this
 * component exists for one reason only, which is to stop it.
 *
 * WHY THIS IS NOT A CANVAS: the effect is a uniform vertical translation of a
 * repeating pattern, which the compositor does for free. A canvas would put the
 * same two layers on the main thread behind a rAF loop, a resize path and a
 * device-pixel-ratio path, and would be the slower of the two on the phone it
 * matters most on.
 *
 * WHY IT PAUSES: an animation still ticking under a hidden tab, or under a
 * reader who scrolled past it ten sections ago, is spending battery on
 * something nobody is looking at. Both conditions are watched here and both
 * resolve to one attribute; the CSS turns that into `animation-play-state`.
 *
 * TWO VARIANTS. `hero` fades downward, away from the headline. `close` fades
 * upward out of the rule above it and adds the horizon — a single wide, soft
 * brand-green light low in the section. Closing bands were the one place these
 * pages had nothing in them at all, which on the dark theme read as the page
 * running out rather than ending.
 *
 * The parent must establish a positioning and stacking context: `.hero-stage`
 * does it for heroes, and closing sections carry `relative isolate`.
 *
 * Rendered only inside `(site)` sections and the login backdrop. It must never
 * appear on /lock, the desktop dashboard, or the mobile Progress and Settings
 * screens — those are tools, and §1 MOTION of docs/DESIGN.md allows them state
 * changes and nothing else.
 */
export function CodeField({ variant = 'hero' }: { variant?: 'hero' | 'close' }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Held outside the callbacks rather than in state: this drives one DOM
    // attribute and nothing renders from it, so putting it through React would
    // buy a re-render of the whole hero per scroll-past for no benefit.
    let onScreen = true;

    const apply = () => {
      el.dataset.paused = String(document.hidden || !onScreen);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // One observed element, so the last entry is the current state.
        const latest = entries[entries.length - 1];
        if (latest) onScreen = latest.isIntersecting;
        apply();
      },
      // The field is bounded to the hero, so "off screen" is a real condition
      // it reaches on an ordinary scroll. threshold 0 is what we want: any part
      // of it visible counts as visible, and the pause happens once the whole
      // band has left.
      { threshold: 0 },
    );

    observer.observe(el);
    document.addEventListener('visibilitychange', apply);
    // The observer fires once on observe(), but visibility has to be sampled —
    // the page can already be hidden when this mounts, e.g. restored into a
    // background tab.
    apply();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', apply);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={variant === 'close' ? 'code-field code-field--rise' : 'code-field'}
      aria-hidden="true"
      data-paused="false"
    >
      {/* The horizon belongs to closing sections only. A hero already has the
          gate meter as its focal object and does not need a second light. */}
      {variant === 'close' && <div className="code-field__glow" />}
      <div className="code-field__bands">
        <div className="code-field__layer code-field__layer--far" />
        <div className="code-field__layer code-field__layer--near" />
      </div>
    </div>
  );
}
