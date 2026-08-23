import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import type { Integration, LeetCodeStats, TimerConfig } from '@codelock/shared';
import { colors, radius, spacing, type ThemeColors } from '@/theme';
import { mobileApi } from '@/session';
import { PromoBand } from '@/promo-band';

/**
 * Settings — the schedule and the LeetCode link, native.
 *
 * GitHub is shown but not connectable here on purpose. Its OAuth callback is
 * registered against the web origin, and adding a mobile deep-link redirect is
 * a change to the GitHub app registration rather than to this code. Offering a
 * connect button that cannot work would be worse than saying where it lives.
 */

/** Sunday first, matching the bitmask where Sunday is bit 0. */
const DAYS = [
  { bit: 0, short: 'S', label: 'Sunday' },
  { bit: 1, short: 'M', label: 'Monday' },
  { bit: 2, short: 'T', label: 'Tuesday' },
  { bit: 3, short: 'W', label: 'Wednesday' },
  { bit: 4, short: 'T', label: 'Thursday' },
  { bit: 5, short: 'F', label: 'Friday' },
  { bit: 6, short: 'S', label: 'Saturday' },
] as const;

const WEEKDAYS = 0b0111110;
const EVERY_DAY = 0b1111111;

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const fromTime = (value: string): number | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 24 || m > 59) return null;
  return h * 60 + m;
};

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];

  const [timer, setTimer] = useState<TimerConfig | null>(null);
  const [integrations, setIntegrations] = useState<Integration[] | null>(null);
  const [leetcode, setLeetcode] = useState<LeetCodeStats | null>(null);
  const [username, setUsername] = useState('');
  const [fromText, setFromText] = useState('00:00');
  const [toText, setToText] = useState('24:00');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [{ timerConfig }, list] = await Promise.all([
        mobileApi.timer(),
        mobileApi.integrations(),
      ]);
      setTimer(timerConfig);
      setFromText(toTime(timerConfig.activeFromMinute));
      setToText(toTime(timerConfig.activeToMinute));
      setIntegrations(list.integrations);

      if (list.integrations.some((i) => i.provider === 'LEETCODE')) {
        // Cached server-side; the upstream endpoint is unofficial and does go
        // down, so a failure here is not worth surfacing as an error.
        const stats = await mobileApi.leetcodeStats().catch(() => null);
        setLeetcode(stats?.stats ?? null);
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not reach CodeLock');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveTimer(patch: Partial<TimerConfig>) {
    if (!timer) return;
    const previous = timer;
    setTimer({ ...timer, ...patch });
    setBusy(true);
    try {
      await mobileApi.saveTimer(patch);
      setStatus('Saved. It applies to the next session.');
    } catch (err) {
      setTimer(previous);
      setStatus(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  function commitWindow() {
    const from = fromTime(fromText);
    const to = fromTime(toText);
    if (from === null || to === null) return setStatus('Times must look like 09:00.');
    if (from === to) return setStatus('A zero-length window would never fire.');
    void saveTimer({ activeFromMinute: from, activeToMinute: to });
  }

  async function linkLeetCode() {
    setBusy(true);
    try {
      const { stats } = await mobileApi.linkLeetCode(username.trim());
      setLeetcode(stats);
      setUsername('');
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not link that account');
    } finally {
      setBusy(false);
    }
  }

  if (!timer) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        {status ? (
          <Text style={[styles.error, { color: theme.danger }]}>{status}</Text>
        ) : (
          <ActivityIndicator color={theme.accent} />
        )}
      </View>
    );
  }

  const github = integrations?.find((i) => i.provider === 'GITHUB') ?? null;
  const wraps = timer.activeFromMinute > timer.activeToMinute;

  return (
    <ScrollView contentContainerStyle={[styles.screenFlush, { backgroundColor: theme.bg }]}>
      <PromoBand />
      <View style={styles.screen}>
        {/* --- schedule ---------------------------------------------------- */}
        <Section theme={theme} title="When CodeLock can lock you">
          <View style={styles.days}>
            {DAYS.map((day) => {
              const on = (timer.activeDaysMask & (1 << day.bit)) !== 0;
              return (
                <Pressable
                  key={day.bit}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={day.label}
                  onPress={() =>
                    void saveTimer({
                      activeDaysMask: timer.activeDaysMask ^ (1 << day.bit),
                    })
                  }
                  style={[
                    styles.day,
                    {
                      borderColor: on ? theme.accent : theme.border,
                      backgroundColor: on ? theme.accent : theme.surface,
                    },
                  ]}
                >
                  <Text style={[styles.dayText, { color: on ? theme.accentFg : theme.muted }]}>
                    {day.short}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.presets}>
            <Preset
              theme={theme}
              label="Weekdays"
              onPress={() => void saveTimer({ activeDaysMask: WEEKDAYS })}
            />
            <Preset
              theme={theme}
              label="Every day"
              onPress={() => void saveTimer({ activeDaysMask: EVERY_DAY })}
            />
          </View>

          <View style={styles.timeRow}>
            <TimeField
              theme={theme}
              label="From"
              value={fromText}
              onChange={setFromText}
              onBlur={commitWindow}
            />
            <TimeField
              theme={theme}
              label="To"
              value={toText}
              onChange={setToText}
              onBlur={commitWindow}
            />
          </View>

          {timer.activeDaysMask === 0 && (
            <Text style={[styles.note, { color: theme.warning }]}>
              No days selected — CodeLock will never lock you.
            </Text>
          )}
          {wraps && (
            <Text style={[styles.note, { color: theme.muted }]}>
              This window crosses midnight, so it runs into the next morning.
            </Text>
          )}
        </Section>

        {/* --- leetcode ---------------------------------------------------- */}
        <Section theme={theme} title="LeetCode">
          {leetcode ? (
            <>
              <View style={styles.statRow}>
                <Stat theme={theme} label="solved" value={String(leetcode.solved.total)} />
                <Stat theme={theme} label="easy" value={String(leetcode.solved.easy)} />
                <Stat theme={theme} label="medium" value={String(leetcode.solved.medium)} />
                <Stat theme={theme} label="hard" value={String(leetcode.solved.hard)} />
              </View>
              <Text style={[styles.note, { color: theme.faint }]}>
                {leetcode.username} · snapshot from{' '}
                {new Date(leetcode.fetchedAt).toLocaleDateString()}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void mobileApi.disconnect('LEETCODE').then(load)}
              >
                <Text style={[styles.link, { color: theme.muted }]}>Disconnect</Text>
              </Pressable>
            </>
          ) : (
            <>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="LeetCode username"
                placeholderTextColor={theme.faint}
                autoCapitalize="none"
                accessibilityLabel="LeetCode username"
                style={[
                  styles.input,
                  {
                    borderColor: theme.border,
                    color: theme.fg,
                    backgroundColor: theme.surface,
                  },
                ]}
              />
              <Pressable
                accessibilityRole="button"
                disabled={busy || username.trim().length === 0}
                onPress={() => void linkLeetCode()}
                style={[
                  styles.button,
                  {
                    backgroundColor: theme.fg,
                    opacity: busy || !username.trim() ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.buttonText, { color: theme.bg }]}>Link account</Text>
              </Pressable>
            </>
          )}
        </Section>

        {/* --- github ------------------------------------------------------ */}
        <Section theme={theme} title="GitHub">
          <Text style={[styles.note, { color: theme.muted }]}>
            {github
              ? `Connected as ${github.externalUsername}${
                  github.repoFullName ? `, mirroring to ${github.repoFullName}` : ''
                }. Accepted solutions are committed after the lock releases; a failed push never keeps you locked.`
              : 'Not connected. Connect it from the desktop app — the GitHub sign-in flow only accepts a redirect back to CodeLock on a desktop browser.'}
          </Text>
          {github && (
            <Pressable
              accessibilityRole="button"
              onPress={() => void mobileApi.disconnect('GITHUB').then(load)}
            >
              <Text style={[styles.link, { color: theme.muted }]}>Disconnect</Text>
            </Pressable>
          )}
        </Section>

        {status && <Text style={[styles.note, { color: theme.faint }]}>{status}</Text>}
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: ThemeColors;
}) {
  return (
    <View style={[styles.section, { borderTopColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.fg }]}>{title}</Text>
      {children}
    </View>
  );
}

function Preset({
  label,
  onPress,
  theme,
}: {
  label: string;
  onPress: () => void;
  theme: ThemeColors;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.preset, { borderColor: theme.border }]}
    >
      <Text style={[styles.presetText, { color: theme.muted }]}>{label}</Text>
    </Pressable>
  );
}

function TimeField({
  label,
  value,
  onChange,
  onBlur,
  theme,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  theme: ThemeColors;
}) {
  return (
    <View style={styles.timeField}>
      <Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        placeholder="09:00"
        placeholderTextColor={theme.faint}
        keyboardType="numbers-and-punctuation"
        accessibilityLabel={label}
        style={[
          styles.input,
          {
            borderColor: theme.border,
            color: theme.fg,
            backgroundColor: theme.surface,
          },
        ]}
      />
    </View>
  );
}

function Stat({ label, value, theme }: { label: string; value: string; theme: ThemeColors }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: theme.fg }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.faint }]}>{label}</Text>
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
    padding: spacing.lg,
  },
  section: { borderTopWidth: 1, paddingTop: spacing.lg, gap: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  days: { flexDirection: 'row', gap: spacing.xs },
  day: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: { fontSize: 13, fontWeight: '600' },
  presets: { flexDirection: 'row', gap: spacing.sm },
  preset: {
    borderWidth: 1,
    borderRadius: radius.xs,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  presetText: { fontSize: 12.5 },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  timeField: { flex: 1, gap: spacing.xs },
  fieldLabel: { fontSize: 12 },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  button: {
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
  note: { fontSize: 12.5, lineHeight: 18 },
  link: { fontSize: 13.5, paddingVertical: spacing.sm },
  statRow: { flexDirection: 'row', gap: spacing.lg },
  stat: { gap: 2 },
  statValue: { fontSize: 18, fontWeight: '600', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  error: { fontSize: 13.5, textAlign: 'center' },
});
