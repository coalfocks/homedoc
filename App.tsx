import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@rneui/themed';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import { theme } from './src/utils/theme';

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

  return session ? <AppNavigator /> : <AuthScreen />;
};

const App = () => {
  const [isSplashComplete, setIsSplashComplete] = useState(false);

  if (!isSplashComplete) {
    return <SplashScreen onFinish={() => setIsSplashComplete(true)} />;
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

export default App;
