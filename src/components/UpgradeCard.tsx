import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { theme } from '../utils/theme';
import type { BillingInterval } from '../lib/nativeBilling';

type UpgradeCardProps = {
  title?: string;
  body?: string;
  cta?: string;
  compact?: boolean;
  loading?: boolean;
  disabled?: boolean;
  interval?: BillingInterval;
  prices?: Partial<Record<BillingInterval, string>> | null;
  selectionDisabled?: boolean;
  onIntervalChange?: (interval: BillingInterval) => void;
  onPress: () => void;
};

export const UpgradeCard: React.FC<UpgradeCardProps> = ({
  title = 'HomeDoc Pro',
  body = 'Get more AI planning and add extra properties. Your existing home records stay available.',
  cta = 'Upgrade',
  compact = false,
  loading = false,
  disabled = false,
  interval,
  prices,
  selectionDisabled = false,
  onIntervalChange,
  onPress,
}) => (
  <View style={[styles.card, compact && styles.cardCompact]}>
    <View style={styles.kicker}>
      <Text style={styles.kickerText}>PRO</Text>
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.body}>{body}</Text>
    {interval && onIntervalChange ? (
      <View style={styles.intervalOptions}>
        {(['annual', 'monthly'] as const).map((option) => {
          const selected = interval === option;
          const price = prices?.[option];
          return (
            <TouchableOpacity
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: selectionDisabled }}
              style={[
                styles.intervalOption,
                selected && styles.intervalSelected,
              ]}
              onPress={() => onIntervalChange(option)}
              disabled={selectionDisabled}
            >
              <View style={styles.intervalCopy}>
                <Text style={styles.intervalTitle}>
                  {option === 'annual' ? 'Annual' : 'Monthly'}
                  {option === 'annual' ? ' · Save with yearly billing' : ''}
                </Text>
                <Text style={styles.intervalPrice}>
                  {price
                    ? `${price}/${option === 'annual' ? 'year' : 'month'}`
                    : `Billed ${option === 'annual' ? 'yearly' : 'monthly'}`}
                </Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <View style={styles.radioDot} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    ) : null}
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
  intervalOptions: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  intervalOption: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    gap: theme.spacing.md,
  },
  intervalSelected: {
    borderColor: theme.colors.secondary.main,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  intervalCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  intervalTitle: {
    color: theme.colors.primary.contrast,
    fontWeight: '800',
  },
  intervalPrice: {
    color: 'rgba(255,255,255,0.82)',
  },
  radio: {
    flexShrink: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.secondary.main,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.secondary.main,
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
