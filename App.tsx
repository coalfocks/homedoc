import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@rneui/themed';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import { MarketingScreen } from './src/screens/MarketingScreen';
import { theme } from './src/utils/theme';
import { isSupabaseConfigured } from './src/lib/supabase';

const marketingHosts = new Set([
  'homedocumentation.com',
  'www.homedocumentation.com',
]);

const isMarketingHost = () => {
  if (Platform.OS !== 'web') return false;

  const hostname =
    typeof window !== 'undefined' ? window.location.hostname : '';

  return marketingHosts.has(hostname) || hostname.endsWith('.ngrok-free.app');
};

const ConfigErrorScreen = () => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.default,
      padding: theme.spacing.lg,
    }}
  >
    <View
      style={{
        width: '100%',
        maxWidth: 360,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.background.paper,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
      }}
    >
      <ActivityIndicator size="large" color={theme.colors.error.main} />
      <Text
        style={{
          marginTop: theme.spacing.md,
          color: theme.colors.text.primary,
          fontSize: theme.typography.h3.fontSize,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        App configuration is missing
      </Text>
      <Text
        style={{
          marginTop: theme.spacing.sm,
          color: theme.colors.text.secondary,
          fontSize: theme.typography.body2.fontSize,
          lineHeight: theme.typography.body2.lineHeight,
          textAlign: 'center',
        }}
      >
        HomeDoc could not load its settings. Please reload the page or update
        the mobile app, then try again.
      </Text>
    </View>
  </View>
);

const AppContent = () => {
  const { session, loading, sessionError, retrySession } = useAuth();

  const handleWebInputFocus = useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      if (Platform.OS !== 'web') return;

      const target = event.target as HTMLElement;
      const isTextField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true';

      if (!isTextField) return;

      const scrollFocusedFieldIntoView = () => {
        target.scrollIntoView({
          block: 'center',
          inline: 'nearest',
          behavior: 'smooth',
        });
      };

      window.setTimeout(scrollFocusedFieldIntoView, 80);
      window.setTimeout(scrollFocusedFieldIntoView, 320);
    },
    [],
  );

  const handleAppShellHostWheel = useCallback(
    (event: React.WheelEvent<HTMLElement>) => {
      if (Platform.OS !== 'web') return;

      const shell = document.getElementById('app-shell');
      if (!shell || shell.contains(event.target as Node)) return;

      const scrollViews = Array.from(
        document.querySelectorAll<HTMLElement>('[id^="app-screen-scroll-"]'),
      );
      const scrollView = scrollViews.find((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          element.scrollHeight > element.clientHeight
        );
      });

      if (!scrollView) return;

      scrollView.scrollTop += event.deltaY;
      event.preventDefault();
    },
    [],
  );

  if (sessionError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          padding: 24,
          backgroundColor: theme.colors.background.default,
        }}
      >
        <Text
          accessibilityRole="alert"
          style={{ color: theme.colors.text.primary, marginBottom: 16 }}
        >
          {sessionError}
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={retrySession}
          style={{
            padding: 16,
            backgroundColor: theme.colors.primary.main,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: theme.colors.primary.contrast,
              textAlign: 'center',
            }}
          >
            Try again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background.default,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
      </View>
    );
  }

  return (
    <View
      style={styles.keyboardFocusHost}
      {...(Platform.OS === 'web'
        ? ({ onFocusCapture: handleWebInputFocus } as object)
        : {})}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingHost}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {session ? (
          <View
            style={styles.appShellHost}
            {...(Platform.OS === 'web'
              ? ({ onWheel: handleAppShellHostWheel } as object)
              : {})}
          >
            <View nativeID="app-shell" style={styles.appShell}>
              <AppNavigator />
            </View>
          </View>
        ) : (
          <AuthScreen />
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const App = () => {
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  if (isMarketingHost()) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <ThemeProvider theme={theme}>
          <MarketingScreen />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  if (!isSplashComplete) {
    return <SplashScreen onFinish={() => setIsSplashComplete(true)} />;
  }

  if (!isSupabaseConfigured) {
    return <ConfigErrorScreen />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  keyboardFocusHost: {
    flex: 1,
  },
  keyboardAvoidingHost: {
    flex: 1,
  },
  appShellHost: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  appShell: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        maxWidth: 1280,
      },
      default: {},
    }),
  },
});

export default App;
