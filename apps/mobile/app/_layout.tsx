import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useColorScheme } from 'react-native';
import { colors } from '@/theme';

// A lock notification must interrupt, even in the foreground — that is the
// whole point of the timer expiring.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];

  useEffect(() => {
    void Notifications.setNotificationChannelAsync('codelock-timer', {
      name: 'Session timer',
      importance: Notifications.AndroidImportance.MAX,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1b6b4a',
    });
  }, []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.fg,
          headerTitleStyle: { fontSize: 15, fontWeight: '600' },
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'CodeLock' }} />
        <Stack.Screen name="progress" options={{ title: 'Progress' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen
          name="lock"
          options={{
            title: 'Locked',
            // No header, no back gesture, no swipe-away: the lock screen is
            // not a page you navigate off.
            headerShown: false,
            gestureEnabled: false,
            animation: 'fade',
          }}
        />
      </Stack>
    </>
  );
}
