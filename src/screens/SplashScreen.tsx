import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text } from '@rneui/themed';
import { Logo } from '../components/Logo';
import { theme } from '../utils/theme';

type SplashScreenProps = {
  onFinish: () => void;
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const liftAnim = useRef(new Animated.Value(16)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: theme.animation.duration.complex,
        useNativeDriver: true,
      }),
      Animated.timing(liftAnim, {
        toValue: 0,
        duration: theme.animation.duration.complex,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: theme.animation.duration.standard,
        useNativeDriver: true,
      }).start(onFinish);
    }, 1800);

    return () => clearTimeout(timer);
  }, [fadeAnim, liftAnim, onFinish, scaleAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.topWash} />
      <View style={styles.bottomWash} />
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [{ translateY: liftAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoWrap}>
          <Logo size={84} color={theme.colors.primary.main} />
        </View>
        <Text style={styles.eyebrow}>HOME RECORDS, ORGANIZED</Text>
        <Text style={styles.title}>HomeDoc</Text>
        <Text style={styles.subtitle}>
          Document every room, photo, warranty, and repair without turning your
          camera roll into a junk drawer.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.default,
    padding: theme.spacing.lg,
  },
  topWash: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: 'rgba(201, 122, 43, 0.12)',
  },
  bottomWash: {
    position: 'absolute',
    bottom: -110,
    left: -50,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(31, 77, 107, 0.10)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.lg,
  },
  logoWrap: {
    width: 124,
    height: 124,
    borderRadius: 62,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 77, 107, 0.08)',
    marginBottom: theme.spacing.lg,
  },
  eyebrow: {
    color: theme.colors.secondary.dark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.h1.fontSize,
    lineHeight: theme.typography.h1.lineHeight,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body1.fontSize,
    lineHeight: theme.typography.body1.lineHeight,
    textAlign: 'center',
  },
});

export default SplashScreen;
