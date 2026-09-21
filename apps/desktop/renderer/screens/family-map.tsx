import { useEffect, useState } from 'react';
import type { FamilyProgress } from '@codelock/shared';
import { api } from '../api';

/**
 * The curriculum, and how much of it has been met.
 *
 * The skill map beside this one answers "what can you do". This answers "where
 * have you been", and it is the one that reads as progress: a family fills in,
 * and the gaps say what to study next. That combination is the point — a number
 * going up is only worth watching while it also tells you something you can act
 * on.
 *
 * Deliberately not a streak. A streak punishes a bad week by erasing
 * everything, and for a tool that already takes your screen, a broken streak is
 * a very good reason to uninstall it. Nothing here can go down.
 *
 * Locked families are greyed rather than hidden. Hidden, the map can only say
 * where you already are; shown, it is a route.
 */
export function FamilyMap() {
  const [families, setFamilies] = useState<FamilyProgress[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .families()
      .then((r) => setFamilies(r.families))
      .catch(() => setFailed(true));
  }, []);

  // A section that cannot load says nothing rather than rendering an empty
  // map, which would read as "you have done none of this".
  if (failed) return null;

  return (
    <section>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>Curriculum</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px', maxWidth: 640 }}>
        Distinct problems met in each family — solving the same one again does not move a bar.
        Greyed families have not opened yet; they do as you work through the ones above them.
      </p>

      {families === null ? (
        <p style={{ fontSize: 13, color: 'var(--faint)', margin: 0 }}>Reading your history…</p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: 8,
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          }}
        >
          {families.map((family) => (
            <FamilyRow key={family.family} family={family} />
          ))}
        </ul>
      )}
    </section>
  );
}

function FamilyRow({ family }: { family: FamilyProgress }) {
  const share = family.total === 0 ? 0 : family.solved / family.total;
  const started = family.solved > 0;

  return (
    <li
      style={{
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        fontSize: 13,
        // Locked and untouched families recede; anything started reads at full
        // strength, because having begun something is what is worth seeing.
        opacity: family.unlocked || started ? 1 : 0.45,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <p style={{ margin: 0, fontWeight: 500 }}>{family.label}</p>
        <p
          style={{
            margin: '0 0 0 auto',
            color: 'var(--muted)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {family.solved}/{family.total}
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={family.solved}
        aria-valuemin={0}
        aria-valuemax={family.total}
        aria-label={`${family.label}: ${family.solved} of ${family.total} problems met`}
        style={{
          marginTop: 8,
          height: 4,
          borderRadius: 999,
          background: 'var(--surface-2, rgba(0,0,0,0.08))',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.round(share * 100)}%`,
            height: '100%',
            background: started ? 'var(--accent)' : 'transparent',
          }}
        />
      </div>

      <p style={{ margin: '6px 0 0', color: 'var(--faint)', fontSize: 12 }}>
        {!family.unlocked && !started
          ? 'Not open yet'
          : family.typicalRatio === null
            ? started
              ? 'Met, not yet timed'
              : 'Nothing met yet'
            : describeRatio(family.typicalRatio)}
      </p>
    </li>
  );
}

/**
 * The speed texture, in words rather than a second bar.
 *
 * The ratio is runtime against the budget, so 1.0 sits exactly on the bar. It
 * is stated as a fact about past solves and never as a target: this is a
 * progress screen, and a number a learner feels judged by belongs on the lock
 * screen, where they can still do something about it.
 */
function describeRatio(ratio: number): string {
  if (ratio <= 0.6) return `Comfortably inside the budget (${ratio}× typical)`;
  if (ratio <= 1) return `Inside the budget (${ratio}× typical)`;
  if (ratio <= 1.5) return `Around the budget (${ratio}× typical)`;
  return `Usually slower than the budget (${ratio}× typical)`;
}
