import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { useAuth } from '../contexts/AuthContext';
import { openFeedbackEmail } from '../utils/feedback';
import { theme } from '../utils/theme';

type BetaFeedbackCardProps = {
  context: string;
  compact?: boolean;
};

export const BetaFeedbackCard: React.FC<BetaFeedbackCardProps> = ({
  context,
  compact = false,
}) => {
  const { user } = useAuth();

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.copy}>
        <Text style={styles.title}>Beta feedback wanted</Text>
        <Text style={styles.body}>
          Tell us what made sense, what felt clunky, and what would make this
          worth keeping around.
        </Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => openFeedbackEmail(context, user?.email)}
      >
        <Text style={styles.buttonText}>Send feedback</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  compactCard: {
    padding: theme.spacing.md,
  },
  copy: {
    gap: 4,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '800',
  },
  body: {
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.body2.lineHeight,
  },
  button: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 12,
  },
  buttonText: {
    color: theme.colors.primary.contrast,
    fontWeight: '800',
  },
});
