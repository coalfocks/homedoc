import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Input, Button } from '@rneui/themed';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';

const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleEmailAuth = async () => {
    try {
      setLoading(true);
      if (isSignUp) {
        await signUp(email, password);
        setShowConfirmation(true);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
    } catch (error) {
      console.error('Apple sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmation) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Logo size={64} color={theme.colors.primary.main} />
            <Text h3 style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a confirmation link to{'\n'}
              <Text style={styles.emailText}>{email}</Text>
            </Text>
          </View>
          
          <View style={styles.confirmationContent}>
            <ActivityIndicator size="large" color={theme.colors.primary.main} />
            <Text style={styles.confirmationText}>
              Please check your email and click the confirmation link to complete your registration.
            </Text>
            <Button
              title="Back to Sign In"
              type="clear"
              onPress={() => {
                setShowConfirmation(false);
                setIsSignUp(false);
              }}
              titleStyle={styles.linkButtonText}
              containerStyle={styles.linkButton}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Logo size={64} color={theme.colors.primary.main} />
          <Text h3 style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp 
              ? 'Sign up to start documenting your home'
              : 'Sign in to access your home documentation'
            }
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Icon name="email" size={20} color={theme.colors.text.primary} />}
            leftIconContainerStyle={{ marginRight: 10 }}
            containerStyle={styles.inputContainer}
            inputStyle={[styles.input, { color: theme.colors.text.primary }]}
            placeholderTextColor={theme.colors.text.secondary}
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            leftIcon={<Icon name="lock" size={20} color={theme.colors.text.primary} />}
            leftIconContainerStyle={{ marginRight: 10 }}
            containerStyle={styles.inputContainer}
            inputStyle={[styles.input, { color: theme.colors.text.primary }]}
            placeholderTextColor={theme.colors.text.secondary}
          />
          
          <Button 
            title={isSignUp ? "Sign Up" : "Sign In"} 
            onPress={handleEmailAuth} 
            loading={loading}
            buttonStyle={styles.primaryButton}
            containerStyle={styles.buttonContainer}
          />

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

          <Button
            title={isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            type="clear"
            onPress={() => setIsSignUp(!isSignUp)}
            titleStyle={styles.linkButtonText}
            containerStyle={styles.linkButton}
          />
        </View>
      </View>
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
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: theme.colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  emailText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 8,
    height: 50,
  },
  input: {
    color: theme.colors.text.primary,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: 8,
    height: 50,
  },
  primaryButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  socialButton: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 8,
    height: 50,
    marginBottom: 10,
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
    backgroundColor: theme.colors.neutral[200],
  },
  dividerText: {
    color: theme.colors.text.secondary,
    marginHorizontal: 10,
  },
  linkButton: {
    marginTop: 20,
  },
  linkButtonText: {
    color: theme.colors.primary.main,
    fontSize: 16,
    fontWeight: '500',
  },
  confirmationContent: {
    alignItems: 'center',
    padding: 20,
  },
  confirmationText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    lineHeight: 24,
  },
});

export default AuthScreen;
