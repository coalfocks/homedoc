import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { theme } from '../utils/theme';

type UpgradeCardProps = {
  title?: string;
  body?: string;
  cta?: string;
  compact?: boolean;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export const UpgradeCard: React.FC<UpgradeCardProps> = ({
  title = 'HomeDoc Pro',
  body = 'Get more AI planning and add extra properties. Your existing home records stay available.',
  cta = 'Upgrade',
  compact = false,
  loading = false,
  disabled = false,
  onPress,
}) => (
  <View style={[styles.card, compact && styles.cardCompact]}>
    <View style={styles.kicker}>
      <Text style={styles.kickerText}>PRO</Text>
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.body}>{body}</Text>
    <TouchableOpacity
      style={[styles.button, (loading || disabled) && styles.buttonDisabled]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.85}
    >
      <Text style={styles.buttonText}>{loading ? 'Opening...' : cta}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary.dark,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  cardCompact: {
    padding: theme.spacing.md,
  },
  kicker: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginBottom: theme.spacing.sm,
  },
  kickerText: {
    color: theme.colors.primary.contrast,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
  },
  title: {
    color: theme.colors.primary.contrast,
    fontSize: theme.typography.h3.fontSize,
    lineHeight: theme.typography.h3.lineHeight,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  body: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
    marginBottom: theme.spacing.md,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.secondary.main,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.secondary.contrast,
    fontWeight: '800',
  },
});
