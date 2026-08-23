import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { StatsSummary } from '@codelock/shared';
import { colors, radius, spacing, type ThemeColors } from '@/theme';
import { mobileApi } from '@/session';
import { PromoBand } from '@/promo-band';
import { PersonalBests, RankReadout, StreakPips, TierLadder } from '@/game';

/**
 * Progress — the native home of the game layer on mobile.
 *
 * Ported from the web dashboard rather than loaded from it: a phone should not
 * have to render a desktop-first web page to answer "how am I doing". The lock
 * screen stays on the web app's `/lock`, because that is a code editor and
 * genuinely wants a browser engine.
 *
 * Single column, in the order the design calls for: tier and streak first, rank
 * next, then the figures, then the run log.
 */
export default function ProgressScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];

  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await mobileApi.stats());
      setError(null);
    } catch (err) {
      // Keep whatever is already on screen. Blanking a dashboard on a dropped
      // connection reads as "you have no progress", which is a lie.
      setError(err instanceof Error ? err.message : 'Could not reach CodeLock');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (!stats) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        {error ? (
          <>
            <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
            <Pressable onPress={() => void load()} accessibilityRole="button">
              <Text style={[styles.link, { color: theme.accent }]}>Try again</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={theme.accent} />
        )}
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.screenFlush, { backgroundColor: theme.bg }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      <PromoBand />
      <View style={styles.screen}>
        {error && (
          <Text style={[styles.stale, { color: theme.warning }]}>
            {error} — showing the last figures.
          </Text>
        )}

        <Section theme={theme}>
          <TierLadder progress={stats.progress} theme={theme} />
        </Section>

        <Section theme={theme}>
          <StreakPips progress={stats.progress} theme={theme} />
        </Section>

        <Section theme={theme}>
          <RankReadout speed={stats.speed} theme={theme} />
        </Section>

        <View style={styles.figures}>
          <Figure
            theme={theme}
            label="Solved"
            value={String(stats.progress.totalSolved)}
            detail={`${stats.submissions.acceptanceRate}% accepted`}
          />
          <Figure
            theme={theme}
            label="Locks cleared"
            value={String(stats.locks.unlockedCount)}
            detail="last 30 sessions"
          />
          <Figure
            theme={theme}
            label="Median unlock"
            value={compact(stats.locks.medianUnlockSeconds)}
            detail="lock to solved"
          />
        </View>

        <Section theme={theme}>
          <PersonalBests bests={stats.personalBests} theme={theme} />
        </Section>

        <Section theme={theme}>
          <Text style={[styles.eyebrow, { color: theme.faint }]}>Run log</Text>
          {stats.locks.recent.length === 0 ? (
            <Text style={[styles.note, { color: theme.faint }]}>
              No sessions yet. Arm a timer and this fills in.
            </Text>
          ) : (
            stats.locks.recent.map((lock) => (
              <View key={lock.id} style={[styles.logRow, { borderTopColor: theme.border }]}>
                <View style={styles.logMain}>
                  <Text numberOfLines={1} style={[styles.logTitle, { color: theme.fg }]}>
                    {lock.problem?.title ?? 'Session'}
                  </Text>
                  <Text style={[styles.mono, { color: theme.faint }]}>
                    {lock.resolvedAt ? new Date(lock.resolvedAt).toLocaleDateString() : '—'}
                    {` · ${lock.attempts} attempt${lock.attempts === 1 ? '' : 's'}`}
                  </Text>
                </View>
                {/* Cleared is the only outcome that earns colour. */}
                <Text
                  style={[
                    styles.outcome,
                    {
                      color: lock.state === 'UNLOCKED' ? theme.accent : theme.muted,
                      borderColor: lock.state === 'UNLOCKED' ? theme.accent : theme.border,
                    },
                  ]}
                >
                  {OUTCOME[lock.state] ?? lock.state.toLowerCase()}
                </Text>
              </View>
            ))
          )}
        </Section>
      </View>
    </ScrollView>
  );
}

const OUTCOME: Record<string, string> = {
  UNLOCKED: 'solved',
  ABANDONED: 'abandoned',
  EXPIRED: 'expired',
  LOCKED: 'locked',
  ARMED: 'armed',
};

/** Seconds as the shortest honest reading: 45s, 12m, 1h 04m. */
function compact(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function Section({ children, theme }: { children: React.ReactNode; theme: ThemeColors }) {
  // Hairline rules, not stacked cards — and never a card inside a card.
  return <View style={[styles.section, { borderTopColor: theme.border }]}>{children}</View>;
}

function Figure({
  label,
  value,
  detail,
  theme,
}: {
  label: string;
  value: string;
  detail: string;
  theme: ThemeColors;
}) {
  return (
    <View style={[styles.figure, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <Text style={[styles.figureLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[styles.figureValue, { color: theme.fg }]}>{value}</Text>
      <Text style={[styles.figureDetail, { color: theme.faint }]}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
  // The band is full-bleed, so padding moves to an inner view.
  screenFlush: { flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  section: { borderTopWidth: 1, paddingTop: spacing.lg },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  note: { fontSize: 12.5, lineHeight: 18 },
  mono: { fontSize: 12, fontVariant: ['tabular-nums'] },
  figures: { flexDirection: 'row', gap: spacing.sm },
  figure: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  figureLabel: { fontSize: 11.5 },
  figureValue: {
    fontSize: 20,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  figureDetail: { fontSize: 11 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  logMain: { flex: 1, gap: 2 },
  logTitle: { fontSize: 14 },
  outcome: {
    fontSize: 11,
    borderWidth: 1,
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  error: { fontSize: 13.5, textAlign: 'center' },
  stale: { fontSize: 12.5 },
  link: { fontSize: 14, fontWeight: '600' },
});
