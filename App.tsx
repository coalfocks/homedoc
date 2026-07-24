import React, { useState } from 'react';
import {
  Platform,
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
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

  return marketingHosts.has(hostname);
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
        HomeDoc could not load its Supabase settings. Please install the latest
        TestFlight build.
      </Text>
    </View>
  </View>
);

const AppContent = () => {
  const { session, loading } = useAuth();

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

  return session ? (
    <View style={styles.appShellHost}>
      <View style={styles.appShell}>
        <AppNavigator />
      </View>
    </View>
  ) : (
    <AuthScreen />
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
        maxWidth: 1040,
      },
      default: {},
    }),
  },
});

export default App;
