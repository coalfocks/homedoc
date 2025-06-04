import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Input } from '@rneui/themed';
import { supabase } from '../utils/supabaseClient';
import { theme } from '../utils/theme';

const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign In" onPress={handleEmailSignIn} loading={loading} containerStyle={styles.button} />
      <Button
        title="Send Magic Link"
        onPress={handleOtp}
        type="outline"
        containerStyle={styles.button}
      />
      <Button
        title="Sign In with Google"
        onPress={() => handleOAuth('google')}
        containerStyle={styles.button}
      />
      <Button
        title="Sign In with Apple"
        onPress={() => handleOAuth('apple')}
        containerStyle={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: theme.colors.background.default,
    padding: theme.spacing.lg,
  },
  button: {
    marginTop: theme.spacing.sm,
  },
});

export default AuthScreen;
