import React from 'react';
import {
  ActivityIndicator,
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
}) => {
  return (
    <View style={styles.intro}>
      <View style={styles.introTopRow}>
        <Text style={styles.eyebrowText}>{eyebrow}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {stepLabel ? <Text style={styles.subtitle}>{stepLabel}</Text> : null}
    </View>
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
}) => (
  <View style={styles.prompt}>
    <Text style={styles.promptTitle}>{title}</Text>
    <Text style={styles.promptBody}>{body}</Text>
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
        {!success && disabled ? (
          <Text style={styles.footerBody}>Complete the required fields.</Text>
        ) : null}
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

const styles = StyleSheet.create({
  intro: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  introTopRow: {
    marginBottom: theme.spacing.xs,
  },
  eyebrowText: {
    color: theme.colors.primary.light,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '600',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },
  prompt: {
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary.light,
    paddingLeft: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  promptBody: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text.secondary,
  },
  card: {
    paddingVertical: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  footer: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    gap: theme.spacing.md,
  },
  footerTextWrap: {
    gap: 2,
  },
  footerTitle: {
    color: theme.colors.text.secondary,
    fontSize: 15,
    fontWeight: '600',
  },
  footerBody: {
    color: theme.colors.text.secondary,
    lineHeight: 19,
    marginTop: 2,
  },
  submitButton: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.border.strong,
  },
  submitButtonSuccess: {
    backgroundColor: theme.colors.success.main,
  },
  submitButtonText: {
    color: theme.colors.primary.contrast,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    paddingBottom: 2,
  },
  submitButtonTextDisabled: {
    color: theme.colors.background.paper,
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
    fontWeight: '600',
    marginBottom: 2,
  },
  errorText: {
    color: theme.colors.error.dark,
    lineHeight: 20,
  },
});
