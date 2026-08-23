import { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '@/theme';
import { clearSession, loadSession, mobileApi } from '@/session';
import {
  ENFORCEMENT_COPY,
  enforcementLevel,
  ensureNotificationPermission,
  ensureOverlayPermission,
  offerBatteryExemption,
  scheduleLockNotification,
} from '@/lock-permissions';
import { NativeLock } from '../modules/codelock-lock';
import { LockMark } from '@/lock-mark';
import { getAccessToken } from '@/session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import type { OAuthProviderName } from '@codelock/shared';

const PRESETS = [15, 30, 60, 90];

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];

  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [providers, setProviders] = useState<OAuthProviderName[]>([]);

  // Only offer buttons the server can complete; one with no client id
  // configured would open a broken consent screen in the user's browser.
  useEffect(() => {
    void mobileApi.oauthProviders().then(setProviders).catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    void (async () => {
      const has = await loadSession();
      setSignedIn(has);
      setReady(true);
      if (has) await refreshLock();
    })();
  }, []);

  // Poll rather than trust a local countdown: the server owns the deadline, and
  // a backgrounded phone stops running timers anyway.
  useEffect(() => {
    if (!signedIn) return;
    const id = setInterval(() => void refreshLock(), 20_000);
    return () => clearInterval(id);
  }, [signedIn]);

  async function refreshLock() {
    try {
      const { session } = await mobileApi.activeLock();
      if (!session) {
        // The server says nothing is locked, so any overlay still up is
        // stale — from a crash, or a session resolved on another device.
        if (NativeLock.isLocked()) NativeLock.release();
        return setRemaining(null);
      }
      if (session.state === 'LOCKED') {
        // Raise the real overlay where the platform allows it. It survives
        // Recents, a process kill, and a reboot; the in-app route below is the
        // soft lock, and is all iOS can offer.
        if (NativeLock.isSupported && NativeLock.canDrawOverlay()) {
          const webUrl = (Constants.expoConfig?.extra?.webUrl as string) ?? '';
          NativeLock.engage(session.id, webUrl, getAccessToken() ?? '');
        }
        return router.replace('/lock');
      }
      setRemaining(session.secondsRemaining);
    } catch {
      // Offline: keep whatever is on screen rather than flashing an error.
    }
  }

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      if (mode === 'login') await mobileApi.login(email.trim(), password);
      else
        await mobileApi.register({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        });
      await afterSignIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  }

  /**
   * Sign in with a provider.
   *
   * The consent screen opens in the system browser rather than a WebView: a
   * WebView is an app-controlled window that can read what is typed into it,
   * which is exactly what a password field must not be inside. The session is
   * then claimed with the one-time handoff minted before opening it.
   */
  async function signInWith(provider: OAuthProviderName) {
    setBusy(true);
    setError(null);
    try {
      const { url, handoff } = await mobileApi.oauthStart(provider);
      await WebBrowser.openAuthSessionAsync(url);

      // The browser dismissing does not mean the server finished, so poll
      // rather than assume. Gives up when the handoff expires server-side.
      const deadline = Date.now() + 2 * 60_000;
      while (Date.now() < deadline) {
        const user = await mobileApi.oauthClaim(handoff);
        if (user) return afterSignIn();
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      setError('That sign-in timed out. Try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  }

  /** Shared tail of every sign-in route: permissions, then the lock state. */
  async function afterSignIn() {
    setSignedIn(true);
    await ensureNotificationPermission();
    // Ask on Android whether or not it is already granted; the helper is a
    // no-op when it is, and this is the only moment the user has context for
    // why a screen-covering permission is being requested.
    if (NativeLock.isSupported) {
      const granted = await ensureOverlayPermission();
      if (granted) offerBatteryExemption();
    }
    await refreshLock();
  }

  async function startSession(minutes: number) {
    setBusy(true);
    try {
      const session = await mobileApi.arm(minutes);
      await scheduleLockNotification(new Date(session.fireAt));
      setRemaining(session.secondsRemaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start a session');
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (!signedIn) {
    return (
      <ScrollView
        contentContainerStyle={[styles.screen, { backgroundColor: theme.bg }]}
        keyboardShouldPersistTaps="handled"
      >
        <LockMark size={28} />
        <Text style={[styles.title, { color: theme.fg }]}>
          {mode === 'login' ? 'Sign in' : 'Create your account'}
        </Text>
        <Text style={[styles.body, { color: theme.muted }]}>
          Use the same account as the web and desktop apps.
        </Text>

        {providers.length > 0 && (
          <>
            {providers.map((provider) => (
              <Pressable
                key={provider}
                onPress={() => void signInWith(provider)}
                disabled={busy}
                accessibilityRole="button"
                style={[
                  styles.providerButton,
                  { borderColor: theme.border, backgroundColor: theme.surface, opacity: busy ? 0.6 : 1 },
                ]}
              >
                <Text style={[styles.buttonText, { color: theme.fg }]}>
                  Continue with {provider === 'GITHUB' ? 'GitHub' : 'Google'}
                </Text>
              </Pressable>
            ))}

            <Text style={[styles.hint, { color: theme.faint }]}>
              Opens your browser. Works for signing in and signing up.
            </Text>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <Text style={[styles.hint, { color: theme.faint }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
            </View>
          </>
        )}

        {mode === 'register' && (
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Name"
            placeholderTextColor={theme.faint}
            autoComplete="name"
            accessibilityLabel="Name"
            style={[styles.input, { borderColor: theme.border, color: theme.fg, backgroundColor: theme.surface }]}
          />
        )}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.faint}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          accessibilityLabel="Email"
          style={[styles.input, { borderColor: theme.border, color: theme.fg, backgroundColor: theme.surface }]}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.faint}
          secureTextEntry
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          accessibilityLabel="Password"
          style={[styles.input, { borderColor: theme.border, color: theme.fg, backgroundColor: theme.surface }]}
        />

        {mode === 'register' && (
          <Text style={[styles.hint, { color: theme.faint }]}>
            Password must be at least 12 characters.
          </Text>
        )}

        {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}

        <Pressable
          onPress={() => void signIn()}
          disabled={busy}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: theme.accent, opacity: busy ? 0.6 : 1 }]}
        >
          <Text style={[styles.buttonText, { color: theme.accentFg }]}>
            {busy ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
          accessibilityRole="button"
          style={styles.switchMode}
        >
          <Text style={[styles.body, { color: theme.muted, textAlign: 'center' }]}>
            {mode === 'login' ? 'No account yet? Create one' : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.screen, { backgroundColor: theme.bg }]}>
      {remaining === null ? (
        <>
          <Text style={[styles.title, { color: theme.fg }]}>Start a focus block</Text>
          <View style={styles.row}>
            {PRESETS.map((minutes) => (
              <Pressable
                key={minutes}
                onPress={() => void startSession(minutes)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`Start a ${minutes} minute session`}
                style={[styles.preset, { borderColor: theme.border, backgroundColor: theme.surface }]}
              >
                <Text style={[styles.presetText, { color: theme.fg }]}>{minutes}m</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.label, { color: theme.muted }]}>Locks in</Text>
          <Text style={[styles.countdown, { color: theme.fg }]}>
            {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </Text>
        </>
      )}

      {/* The platform's real capability, stated on the device it applies to. */}
      <View style={[styles.notice, { backgroundColor: theme.surface2 }]}>
        <Text style={[styles.noticeText, { color: theme.muted }]}>
          {ENFORCEMENT_COPY[enforcementLevel()]}
        </Text>
      </View>

      <View style={styles.navRow}>
        <Pressable
          onPress={() => router.push('/progress')}
          accessibilityRole="button"
          style={[styles.navItem, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <Text style={[styles.navText, { color: theme.fg }]}>Progress</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          style={[styles.navItem, { borderColor: theme.border, backgroundColor: theme.surface }]}
        >
          <Text style={[styles.navText, { color: theme.fg }]}>Settings</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => void clearSession().then(() => setSignedIn(false))}
        accessibilityRole="button"
        style={styles.signOut}
      >
        <Text style={[styles.body, { color: theme.muted }]}>Sign out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },
  label: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  countdown: { fontSize: 48, fontWeight: '600', fontVariant: ['tabular-nums'] },
  body: { fontSize: 14 },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  button: {
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  preset: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 72,
    alignItems: 'center',
  },
  presetText: { fontSize: 15, fontWeight: '600' },
  notice: { padding: spacing.md, borderRadius: radius.sm, marginTop: spacing.md },
  noticeText: { fontSize: 13, lineHeight: 19 },
  error: { fontSize: 13 },
  providerButton: {
    height: 46,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 12.5, lineHeight: 18 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divider: { flex: 1, height: 1 },
  switchMode: { paddingVertical: spacing.md },
  navRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  navItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  navText: { fontSize: 14, fontWeight: '600' },
  signOut: { marginTop: 'auto', paddingVertical: spacing.md },
});
