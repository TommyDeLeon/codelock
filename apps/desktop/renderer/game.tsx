import { DIFFICULTIES, type StatsSummary, type UserProgress } from '@codelock/shared';

/**
 * The game layer.
 *
 * Every mechanic here is a real field: tier, streak, rank against the record,
 * and personal bests. Nothing is invented — no XP, no coins, no levels beyond
 * the three the backend enforces — because the product's whole proposition is
 * that its numbers mean something and can be checked.
 *
 * Rendered as instrumentation: thin bars, pips, and mono figures with tabular
 * digits. Colour is reward-only, so a panel with no green in it is one that has
 * not been earned yet.
 */

export function TierLadder({ progress }: { progress: UserProgress }) {
  const index = DIFFICULTIES.indexOf(progress.currentDifficulty);

  return (
    <section>
      <p className="eyebrow">Tier</p>
      <ol
        aria-label="Difficulty ladder"
        style={{
          display: 'flex',
          gap: 4,
          listStyle: 'none',
          margin: '8px 0 0',
          padding: 0,
        }}
      >
        {DIFFICULTIES.map((tier, i) => (
          <li key={tier} style={{ flex: 1 }}>
            <div
              style={{
                height: 4,
                borderRadius: 'var(--radius-xs)',
                background: i <= index ? 'var(--accent)' : 'var(--surface-2)',
                transition: 'background-color 500ms',
              }}
            />
            <span
              className="mono"
              style={{
                display: 'block',
                marginTop: 6,
                fontSize: 10.5,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: i === index ? 'var(--fg)' : 'var(--faint)',
              }}
            >
              {tier.toLowerCase()}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function StreakPips({ progress }: { progress: UserProgress }) {
  const {
    consecutiveFastSolves,
    consecutiveFailures,
    promoteAfterFastSolves,
    demoteAfterFailures,
    currentDifficulty,
  } = progress;

  const next = DIFFICULTIES[DIFFICULTIES.indexOf(currentDifficulty) + 1];

  return (
    <section>
      <p className="eyebrow">Streak</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <div
          role="img"
          aria-label={`${consecutiveFastSolves} of ${promoteAfterFastSolves} fast solves`}
          style={{ display: 'flex', gap: 6 }}
        >
          {Array.from({ length: promoteAfterFastSolves }, (_, i) => (
            <span
              key={i}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: i < consecutiveFastSolves ? 'var(--accent)' : 'transparent',
                border: i < consecutiveFastSolves ? 'none' : '1px solid var(--border)',
                transition: 'background-color 500ms',
              }}
            />
          ))}
        </div>
        {/* The rule in words, always. This product never shows a number the
            user cannot interrogate. */}
        <p className="mono" style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
          {next
            ? `${consecutiveFastSolves} / ${promoteAfterFastSolves} fast solves to ${next.toLowerCase()}`
            : `${consecutiveFastSolves} fast solves in a row`}
        </p>
      </div>

      {/* Stated as a fact, never as a threat. This app can take the screen
          away; loss-aversion copy on top of that would be coercive. */}
      <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--faint)' }}>
        {consecutiveFailures > 0
          ? `${consecutiveFailures} of ${demoteAfterFailures} failed sessions toward easing back down.`
          : 'A solve inside the problem’s average time counts as fast. One slow solve resets the streak.'}
      </p>
    </section>
  );
}

export function RankReadout({ speed }: { speed: StatsSummary['speed'] }) {
  if (speed.medianRatio === null || speed.medianRatio <= 0) {
    return (
      <section>
        <p className="eyebrow">Against the record</p>
        <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--faint)' }}>
          No ratio yet. Solve a problem that already has a recorded best and your distance from it
          appears here.
        </p>
      </section>
    );
  }

  // 1.00x is the record, so the bar fills as the user approaches it.
  const fill = Math.min(100, (1 / speed.medianRatio) * 100);

  return (
    <section>
      <p className="eyebrow">Against the record</p>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginTop: 8,
        }}
      >
        <span className="mono" style={{ fontSize: 26, fontWeight: 600 }}>
          {speed.medianRatio.toFixed(2)}×
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>off the best known answer</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(fill)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="How close your solves run to the record"
        style={{
          height: 4,
          marginTop: 12,
          borderRadius: 'var(--radius-xs)',
          background: 'var(--surface-2)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${fill}%`,
            background: 'var(--accent)',
            transition: 'width 700ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>
      <p className="mono" style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--faint)' }}>
        median of {speed.sampleSize} solve{speed.sampleSize === 1 ? '' : 's'}
        {speed.recordsHeld > 0 && (
          <>
            {' · '}
            <span style={{ color: 'var(--accent)' }}>
              {speed.recordsHeld} record{speed.recordsHeld === 1 ? '' : 's'} held
            </span>
          </>
        )}
      </p>
    </section>
  );
}

export function PersonalBests({ bests }: { bests: StatsSummary['personalBests'] }) {
  return (
    <section>
      <p className="eyebrow">Personal bests</p>
      {bests.length === 0 ? (
        <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--faint)' }}>
          Nothing yet. Your fastest run on each problem lands here once you solve one.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0 }}>
          {bests.map((best) => (
            <li
              key={`${best.slug}:${best.language}`}
              className="rule"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '10px 0',
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {best.title}
                </span>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--faint)' }}>
                  {best.language.toLowerCase()}
                </span>
              </span>
              <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <span className="mono" style={{ display: 'block', fontSize: 12.5 }}>
                  {best.runtimeMs} ms
                </span>
                {/* Holding the record is the only thing here that earns colour. */}
                <span
                  className="mono"
                  style={{
                    fontSize: 11.5,
                    color: best.holdsRecord ? 'var(--accent)' : 'var(--faint)',
                  }}
                >
                  {best.holdsRecord ? 'record' : best.ratio === null ? '—' : `${best.ratio}× off`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
