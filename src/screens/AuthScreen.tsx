import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, Input, Button } from '@rneui/themed';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'magic' | 'password';

const AuthScreen: React.FC = () => {
  const {
    signIn,
    signUp,
    signInWithMagicLink,
    signInWithGoogle,
    signInWithApple,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('magic');
  const [isSignUp, setIsSignUp] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleEmailAuth = async () => {
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address first.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Missing password', 'Enter your password to continue.');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        await signUp(normalizedEmail, password);
        setMagicLinkSent(true);
      } else {
        await signIn(normalizedEmail, password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert(
        'Authentication failed',
        error?.message || 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address first.');
      return;
    }

    try {
      setLoading(true);
      await signInWithMagicLink(normalizedEmail);
      setMagicLinkSent(true);
      setIsSignUp(false);
    } catch (error: any) {
      console.error('Magic link error:', error);
      Alert.alert(
        'Magic link failed',
        error?.message || 'We could not send the magic link. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert(
        'Google sign-in failed',
        error?.message || 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
    } catch (error: any) {
      console.error('Apple sign in error:', error);
      Alert.alert(
        'Apple sign-in failed',
        error?.message || 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <View style={styles.container}>
        <View style={styles.backgroundOrbTop} />
        <View style={styles.backgroundOrbBottom} />
        <View style={styles.content}>
          <View style={styles.authCard}>
            <View style={styles.header}>
              <Logo size={64} color={theme.colors.primary.main} />
              <Text h3 style={styles.title}>
                Check your email
              </Text>
              <Text style={styles.subtitle}>
                We sent a sign-in link to{'\n'}
                <Text style={styles.emailText}>{normalizedEmail}</Text>
              </Text>
            </View>

            <View style={styles.confirmationBadge}>
              <Icon
                name="check"
                size={18}
                color={theme.colors.accent.contrast}
              />
            </View>
            <Text style={styles.confirmationText}>
              Open the email on this device and tap the link to jump back into
              HomeDoc.
            </Text>
            <Button
              title="Send another link"
              onPress={handleMagicLink}
              loading={loading}
              buttonStyle={styles.primaryButton}
              containerStyle={styles.buttonContainer}
            />
            <Button
              title="Use password instead"
              type="clear"
              onPress={() => {
                setMagicLinkSent(false);
                setAuthMode('password');
              }}
              titleStyle={styles.linkButtonText}
              containerStyle={styles.linkButtonCompact}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Logo size={72} color={theme.colors.primary.main} />
            <Text h3 style={styles.eyebrow}>
              HOME CARE, WITHOUT THE CHAOS
            </Text>
            <Text h1 style={styles.heroTitle}>
              {authMode === 'magic'
                ? 'Open HomeDoc with one tap.'
                : isSignUp
                  ? 'Create your HomeDoc account.'
                  : 'Sign back into HomeDoc.'}
            </Text>
            <Text style={styles.heroSubtitle}>
              Keep warranties, photos, notes, and room-by-room details in one
              place instead of a dozen random folders.
            </Text>
          </View>

          <View style={styles.authCard}>
            <View style={styles.modeSwitcher}>
              <Button
                title="Magic Link"
                onPress={() => setAuthMode('magic')}
                buttonStyle={[
                  styles.modeButton,
                  authMode === 'magic' && styles.modeButtonActive,
                ]}
                titleStyle={[
                  styles.modeButtonTitle,
                  authMode === 'magic' && styles.modeButtonTitleActive,
                ]}
              />
              <Button
                title={isSignUp ? 'Create Account' : 'Password'}
                onPress={() => setAuthMode('password')}
                buttonStyle={[
                  styles.modeButton,
                  authMode === 'password' && styles.modeButtonActive,
                ]}
                titleStyle={[
                  styles.modeButtonTitle,
                  authMode === 'password' && styles.modeButtonTitleActive,
                ]}
              />
            </View>

            <Input
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              leftIcon={
                <Icon
                  name="email"
                  size={20}
                  color={theme.colors.text.primary}
                />
              }
              leftIconContainerStyle={styles.leftIconContainer}
              containerStyle={styles.inputContainer}
              inputContainerStyle={styles.inputInner}
              inputStyle={styles.input}
              placeholderTextColor={theme.colors.text.secondary}
            />

            {authMode === 'password' ? (
              <>
                <Input
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  leftIcon={
                    <Icon
                      name="lock"
                      size={20}
                      color={theme.colors.text.primary}
                    />
                  }
                  leftIconContainerStyle={styles.leftIconContainer}
                  containerStyle={styles.inputContainer}
                  inputContainerStyle={styles.inputInner}
                  inputStyle={styles.input}
                  placeholderTextColor={theme.colors.text.secondary}
                />
                <Button
                  title={isSignUp ? 'Create account' : 'Sign in'}
                  onPress={handleEmailAuth}
                  loading={loading}
                  buttonStyle={styles.primaryButton}
                  containerStyle={styles.buttonContainer}
                />
                <Button
                  title={
                    isSignUp
                      ? 'Already have an account? Use password sign in'
                      : 'Need an account? Create one with email + password'
                  }
                  type="clear"
                  onPress={() => setIsSignUp(!isSignUp)}
                  titleStyle={styles.linkButtonText}
                  containerStyle={styles.linkButtonCompact}
                />
              </>
            ) : (
              <>
                <Text style={styles.helperText}>
                  We’ll email you a secure sign-in link that opens straight back
                  into the app.
                </Text>
                <Button
                  title="Send magic link"
                  onPress={handleMagicLink}
                  loading={loading}
                  buttonStyle={styles.primaryButton}
                  containerStyle={styles.buttonContainer}
                />
              </>
            )}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Continue with Google"
              buttonStyle={styles.socialButton}
              titleStyle={styles.socialButtonTitle}
              onPress={handleGoogleSignIn}
            />
            <Button
              title="Continue with Apple"
              buttonStyle={styles.socialButton}
              titleStyle={styles.socialButtonTitle}
              onPress={handleAppleSignIn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  backgroundOrbTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(138, 117, 255, 0.18)',
  },
  backgroundOrbBottom: {
    position: 'absolute',
    bottom: -140,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 107, 78, 0.14)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  eyebrow: {
    color: theme.colors.primary.light,
    marginTop: 20,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  heroTitle: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 12,
  },
  heroSubtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 360,
  },
  authCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: 'rgba(42, 47, 62, 0.92)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...theme.shadows.lg,
  },
  title: {
    color: theme.colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: 'transparent',
    minHeight: 42,
  },
  modeButtonActive: {
    backgroundColor: theme.colors.primary.main,
  },
  modeButtonTitle: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'none',
  },
  modeButtonTitleActive: {
    color: theme.colors.primary.contrast,
  },
  inputContainer: {
    marginBottom: 4,
    paddingHorizontal: 0,
  },
  inputInner: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 14,
    borderBottomWidth: 0,
    minHeight: 58,
    paddingHorizontal: 14,
  },
  leftIconContainer: {
    marginRight: 10,
  },
  input: {
    color: theme.colors.text.primary,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: 14,
    minHeight: 54,
  },
  socialButton: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 14,
    minHeight: 54,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  socialButtonTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    color: theme.colors.text.secondary,
    marginHorizontal: 10,
  },
  helperText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 4,
  },
  linkButtonCompact: {
    marginTop: 6,
  },
  linkButtonText: {
    color: theme.colors.primary.main,
    fontSize: 15,
    fontWeight: '500',
  },
  confirmationContent: {
    alignItems: 'center',
  },
  confirmationBadge: {
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent.main,
    marginBottom: 20,
  },
  confirmationText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 30,
    lineHeight: 24,
  },
});

export default AuthScreen;
