import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useFocusEffect, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import Constants from 'expo-constants';
import { colors } from '@/theme';
import { getAccessToken } from '@/session';
import { NativeLock } from '../modules/codelock-lock';

/**
 * The lock screen, rendered as the web app inside a WebView.
 *
 * Monaco is a browser editor; there is no native equivalent worth maintaining
 * in parallel. Hosting the same `/lock` route means the editor, the speed gate,
 * and the grading UI are written once and behave identically everywhere.
 *
 * The native side contributes what a WebView cannot: swallowing the Android
 * back button, keeping the screen awake, and refusing to unmount until the web
 * app reports a server-verified unlock.
 */
export default function LockScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);

  // A dark screen that sleeps mid-problem would be its own small cruelty.
  useKeepAwake();

  // Back must not dismiss the lock. Returning true marks the event handled.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => !unlocked);
      return () => subscription.remove();
    }, [unlocked]),
  );

  const webUrl = (Constants.expoConfig?.extra?.webUrl as string) ?? 'https://app.codelock.dev';

  /**
   * Hand the WebView its session before any React code runs.
   *
   * The token comes from SecureStore (Keychain / Keystore), never from the
   * page. Injecting it at document start means the web app hydrates already
   * authenticated instead of flashing a login screen.
   */
  const injectedBeforeLoad = `
    (function () {
      try {
        window.localStorage.setItem('codelock.access', ${JSON.stringify(getAccessToken() ?? '')});
        window.__CODELOCK_NATIVE__ = true;
      } catch (e) {}
      true;
    })();
  `;

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data) as { type?: string };
      // The web app posts this only after the API returned an unlock token,
      // which it cannot mint itself.
      if (payload.type === 'codelock:unlocked') {
        setUnlocked(true);
        // Drop the native overlay too. Without this the in-app screen closes
        // and the system overlay stays up over the launcher — the worst of
        // both, and the user would have no way back.
        NativeLock.release();
        router.replace('/');
      }
    } catch {
      // Ignore anything that is not our protocol.
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <WebView
        source={{ uri: `${webUrl}/lock` }}
        injectedJavaScriptBeforeContentLoaded={injectedBeforeLoad}
        onMessage={onMessage}
        onLoadEnd={() => setLoading(false)}
        // Monaco needs both; without them the editor renders blank.
        javaScriptEnabled
        domStorageEnabled
        // No pull-to-refresh escape hatch, no zooming out of the overlay.
        bounces={false}
        overScrollMode="never"
        scalesPageToFit={false}
        setSupportMultipleWindows={false}
        // Keep navigation inside our own origin.
        onShouldStartLoadWithRequest={(request) =>
          request.url.startsWith(webUrl) || request.url === 'about:blank'
        }
        style={{ backgroundColor: theme.bg }}
      />

      {loading && (
        <View style={[styles.overlay, { backgroundColor: theme.bg }]}>
          <ActivityIndicator color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.muted }]}>Loading your problem…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    // Written out rather than spreading StyleSheet.absoluteFill, which is a
    // registered style *id* (a number) — spreading it yields an empty object
    // and the overlay would silently collapse to zero size.
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14 },
});
