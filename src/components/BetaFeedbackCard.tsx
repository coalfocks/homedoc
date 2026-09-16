import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { useAuth } from '../contexts/AuthContext';
import { openFeedbackEmail } from '../utils/feedback';
import { theme } from '../utils/theme';

type BetaFeedbackCardProps = {
  context: string;
  compact?: boolean;
  title?: string;
  body?: string;
};

export const BetaFeedbackCard: React.FC<BetaFeedbackCardProps> = ({
  context,
  compact = false,
  title = 'Help improve HomeDoc',
  body = 'Found a problem or have an idea? Let us know.',
}) => {
  const { user } = useAuth();

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: theme.spacing.lg,
  },
  compactCard: {
    paddingVertical: theme.spacing.md,
  },
  copy: {
    flexGrow: 1,
    flexBasis: 240,
    gap: 4,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.body2.fontSize,
    fontWeight: '600',
  },
  body: {
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.body2.lineHeight,
  },
  button: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  buttonText: {
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
});
