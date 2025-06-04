import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@rneui/themed';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import SplashScreen from './src/screens/SplashScreen';
import AuthScreen from './src/screens/AuthScreen';
import { supabase } from './src/utils/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { theme } from './src/utils/theme';

const App = () => {
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!isSplashComplete) {
    return <SplashScreen onFinish={() => setIsSplashComplete(true)} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          {session ? <AppNavigator /> : <AuthScreen />}
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
