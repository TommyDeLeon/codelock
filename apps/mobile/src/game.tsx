import { StyleSheet, Text, View } from 'react-native';
import { DIFFICULTIES, type StatsSummary, type UserProgress } from '@codelock/shared';
import { radius, spacing, type ThemeColors } from '@/theme';

/**
 * The game layer, transcribed for React Native.
 *
 * Same mechanics as every other client, and the same rule behind them: nothing
 * here is invented. Tier, streak, ratio-to-the-record and personal bests are
 * all real fields, so every number can be interrogated. Rendered as
 * instrumentation — thin bars, pips and tabular figures — because these are
 * measurements rather than points.
 *
 * Colour is reward-only. A panel with no green in it is one that has not been
 * earned yet, and that is the whole of the mechanism.
 */

export function TierLadder({ progress, theme }: { progress: UserProgress; theme: ThemeColors }) {
  const index = DIFFICULTIES.indexOf(progress.currentDifficulty);

  return (
    <View>
      <Eyebrow theme={theme}>Tier</Eyebrow>
      <View style={styles.ladder} accessibilityLabel="Difficulty ladder">
        {DIFFICULTIES.map((tier, i) => (
          <View key={tier} style={styles.rung}>
            <View
              style={[styles.bar, { backgroundColor: i <= index ? theme.accent : theme.surface2 }]}
            />
            <Text style={[styles.rungLabel, { color: i === index ? theme.fg : theme.faint }]}>
              {tier.toLowerCase()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function StreakPips({ progress, theme }: { progress: UserProgress; theme: ThemeColors }) {
  const {
    consecutiveFastSolves,
    consecutiveFailures,
    promoteAfterFastSolves,
    demoteAfterFailures,
    currentDifficulty,
  } = progress;

  const next = DIFFICULTIES[DIFFICULTIES.indexOf(currentDifficulty) + 1];

  return (
    <View>
      <Eyebrow theme={theme}>Streak</Eyebrow>
      <View style={styles.streakRow}>
        <View
          style={styles.pips}
          accessibilityRole="image"
          accessibilityLabel={`${consecutiveFastSolves} of ${promoteAfterFastSolves} fast solves`}
        >
          {Array.from({ length: promoteAfterFastSolves }, (_, i) => (
            <View
              key={i}
              style={[
                styles.pip,
                i < consecutiveFastSolves
                  ? { backgroundColor: theme.accent }
                  : { borderWidth: 1, borderColor: theme.border },
              ]}
            />
          ))}
        </View>
        {/* The rule in words, always. This product never shows a number the
            user cannot interrogate. */}
        <Text style={[styles.mono, { color: theme.muted }]}>
          {next
            ? `${consecutiveFastSolves} / ${promoteAfterFastSolves} fast solves to ${next.toLowerCase()}`
            : `${consecutiveFastSolves} fast solves in a row`}
        </Text>
      </View>

      {/* Stated as a fact, never as a threat. This app can take the screen
          away; loss-aversion copy on top of that would be coercive. */}
      <Text style={[styles.note, { color: theme.faint }]}>
        {consecutiveFailures > 0
          ? `${consecutiveFailures} of ${demoteAfterFailures} failed sessions toward easing back down.`
          : 'A solve inside the problem’s average time counts as fast. One slow solve resets the streak.'}
      </Text>
    </View>
  );
}

export function RankReadout({
  speed,
  theme,
}: {
  speed: StatsSummary['speed'];
  theme: ThemeColors;
}) {
  if (speed.medianRatio === null || speed.medianRatio <= 0) {
    return (
      <View>
        <Eyebrow theme={theme}>Against the record</Eyebrow>
        <Text style={[styles.note, { color: theme.faint }]}>
          No ratio yet. Solve a problem that already has a recorded best and your distance from it
          appears here.
        </Text>
      </View>
    );
  }

  // 1.00x is the record, so the bar fills as the user approaches it.
  const fill = Math.min(100, (1 / speed.medianRatio) * 100);

  return (
    <View>
      <Eyebrow theme={theme}>Against the record</Eyebrow>
      <View style={styles.ratioRow}>
        <Text style={[styles.ratio, { color: theme.fg }]}>{speed.medianRatio.toFixed(2)}×</Text>
        <Text style={[styles.note, { color: theme.muted }]}>off the best known answer</Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.surface2 }]}>
        <View style={[styles.fill, { backgroundColor: theme.accent, width: `${fill}%` }]} />
      </View>
      <Text style={[styles.mono, { color: theme.faint, marginTop: spacing.xs }]}>
        median of {speed.sampleSize} solve{speed.sampleSize === 1 ? '' : 's'}
        {speed.recordsHeld > 0
          ? ` · ${speed.recordsHeld} record${speed.recordsHeld === 1 ? '' : 's'} held`
          : ''}
      </Text>
    </View>
  );
}

export function PersonalBests({
  bests,
  theme,
}: {
  bests: StatsSummary['personalBests'];
  theme: ThemeColors;
}) {
  return (
    <View>
      <Eyebrow theme={theme}>Personal bests</Eyebrow>
      {bests.length === 0 ? (
        <Text style={[styles.note, { color: theme.faint }]}>
          Nothing yet. Your fastest run on each problem lands here once you solve one.
        </Text>
      ) : (
        bests.map((best) => (
          <View
            key={`${best.slug}:${best.language}`}
            style={[styles.bestRow, { borderTopColor: theme.border }]}
          >
            <View style={styles.bestTitle}>
              <Text numberOfLines={1} style={[styles.bestName, { color: theme.fg }]}>
                {best.title}
              </Text>
              <Text style={[styles.mono, { color: theme.faint }]}>
                {best.language.toLowerCase()}
              </Text>
            </View>
            <View style={styles.bestFigures}>
              <Text style={[styles.mono, { color: theme.fg }]}>{best.runtimeMs} ms</Text>
              {/* Holding the record is the only thing here that earns colour. */}
              <Text style={[styles.mono, { color: best.holdsRecord ? theme.accent : theme.faint }]}>
                {best.holdsRecord ? 'record' : best.ratio === null ? '—' : `${best.ratio}× off`}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function Eyebrow({ children, theme }: { children: string; theme: ThemeColors }) {
  return <Text style={[styles.eyebrow, { color: theme.faint }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  ladder: { flexDirection: 'row', gap: spacing.xs },
  rung: { flex: 1 },
  bar: { height: 4, borderRadius: radius.xs },
  rungLabel: { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pips: { flexDirection: 'row', gap: 6 },
  pip: { width: 10, height: 10, borderRadius: 5 },
  mono: { fontSize: 12, fontVariant: ['tabular-nums'] },
  note: { fontSize: 12.5, lineHeight: 18, marginTop: spacing.sm },
  ratioRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  ratio: { fontSize: 26, fontWeight: '600', fontVariant: ['tabular-nums'] },
  track: { height: 4, borderRadius: radius.xs, overflow: 'hidden', marginTop: spacing.md },
  fill: { height: '100%' },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  bestTitle: { flex: 1, gap: 2 },
  bestName: { fontSize: 14 },
  bestFigures: { alignItems: 'flex-end', gap: 2 },
});
