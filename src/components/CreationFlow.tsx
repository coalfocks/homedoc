import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from '@rneui/themed';
import { theme } from '../utils/theme';
import { Icon } from './Icon';

type CreationIntroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  stepLabel: string;
  completedSteps: number;
  totalSteps: number;
};

export const CreationIntro: React.FC<CreationIntroProps> = ({
  eyebrow,
  title,
  subtitle,
  stepLabel,
  completedSteps,
  totalSteps,
}) => {
  const progress = totalSteps ? completedSteps / totalSteps : 0;

  return (
    <FadeInView style={styles.intro}>
      <View style={styles.introTopRow}>
        <View style={styles.eyebrowPill}>
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>
        <Text style={styles.stepText}>
          {completedSteps}/{totalSteps}
        </Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{stepLabel}</Text>
    </FadeInView>
  );
};

type CreationCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export const CreationCard: React.FC<CreationCardProps> = ({
  children,
  style,
}) => <View style={[styles.card, style]}>{children}</View>;

type CreationPromptProps = {
  title: string;
  body: string;
  icon?: 'home' | 'area' | 'note' | 'todo' | 'add';
};

export const CreationPrompt: React.FC<CreationPromptProps> = ({
  title,
  body,
  icon = 'add',
}) => (
  <View style={styles.prompt}>
    <View style={styles.promptIcon}>
      <Icon name={icon} size={18} color={theme.colors.primary.main} />
    </View>
    <View style={styles.promptTextWrap}>
      <Text style={styles.promptTitle}>{title}</Text>
      <Text style={styles.promptBody}>{body}</Text>
    </View>
  </View>
);

type SubmitFooterProps = {
  title: string;
  hint: string;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  onPress: () => void;
};

export const SubmitFooter: React.FC<SubmitFooterProps> = ({
  title,
  hint,
  disabled = false,
  loading = false,
  success = false,
  onPress,
}) => {
  const buttonText = success ? 'Saved' : loading ? 'Saving...' : title;

  return (
    <View style={styles.footer}>
      <View style={styles.footerTextWrap}>
        <Text style={styles.footerTitle}>
          {success ? 'Created successfully' : hint}
        </Text>
        <Text style={styles.footerBody}>
          {success
            ? 'Taking you back with the new item ready.'
            : disabled
              ? 'Complete the required fields to continue.'
              : 'Ready when you are.'}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.submitButton,
          disabled && styles.submitButtonDisabled,
          success && styles.submitButtonSuccess,
        ]}
        onPress={onPress}
        disabled={disabled || loading || success}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primary.contrast} />
        ) : success ? (
          <Icon name="todo" size={18} color={theme.colors.primary.contrast} />
        ) : (
          <Icon name="add" size={18} color={theme.colors.primary.contrast} />
        )}
        <Text
          style={[
            styles.submitButtonText,
            disabled && styles.submitButtonTextDisabled,
          ]}
        >
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

type ErrorPanelProps = {
  message: string | null;
};

export const ErrorPanel: React.FC<ErrorPanelProps> = ({ message }) => {
  if (!message) return null;

  return (
    <View style={styles.errorPanel}>
      <Text style={styles.errorTitle}>Something needs attention</Text>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
};

const FadeInView: React.FC<{
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ children, style }) => {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: theme.animation.duration.standard,
      useNativeDriver: true,
    }).start();
  }, [value]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: value,
          transform: [
            {
              translateY: value.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  intro: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  introTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  eyebrowPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(201, 122, 43, 0.14)',
  },
  eyebrowText: {
    color: theme.colors.secondary.dark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  stepText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },
  progressTrack: {
    height: 8,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(31, 77, 107, 0.1)',
    overflow: 'hidden',
    marginTop: theme.spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.accent.main,
  },
  progressLabel: {
    color: theme.colors.text.slate,
    fontSize: 13,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: theme.spacing.md,
  },
  prompt: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(63, 127, 104, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(63, 127, 104, 0.18)',
    marginBottom: theme.spacing.md,
  },
  promptIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.paper,
  },
  promptTextWrap: {
    flex: 1,
  },
  promptTitle: {
    color: theme.colors.accent.dark,
    fontWeight: '800',
    marginBottom: 2,
  },
  promptBody: {
    color: theme.colors.text.slate,
    lineHeight: 20,
  },
  footer: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary.dark,
    gap: theme.spacing.md,
    ...theme.shadows.md,
  },
  footerTextWrap: {
    gap: 2,
  },
  footerTitle: {
    color: theme.colors.primary.contrast,
    fontSize: 15,
    fontWeight: '800',
  },
  footerBody: {
    color: 'rgba(255,255,255,0.76)',
    lineHeight: 20,
  },
  submitButton: {
    minHeight: 50,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.secondary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  submitButtonSuccess: {
    backgroundColor: theme.colors.success.main,
  },
  submitButtonText: {
    color: theme.colors.primary.contrast,
    fontWeight: '800',
    fontSize: 16,
  },
  submitButtonTextDisabled: {
    color: 'rgba(255,255,255,0.54)',
  },
  errorPanel: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(200, 85, 61, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200, 85, 61, 0.18)',
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    color: theme.colors.error.dark,
    fontWeight: '800',
    marginBottom: 2,
  },
  errorText: {
    color: theme.colors.error.dark,
    lineHeight: 20,
  },
});
