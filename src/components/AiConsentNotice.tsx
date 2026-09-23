import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { theme } from '../utils/theme';

export const AiConsentNotice = ({
  accepted,
  onChange,
}: {
  accepted: boolean;
  onChange: (accepted: boolean) => void;
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.body}>
        AI uses this task and related home details to suggest a plan. Each
        question set, plan, or chat reply uses one AI request.
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded: showDetails }}
        onPress={() => setShowDetails(!showDetails)}
        style={styles.detailsToggle}
      >
        <Text style={styles.detailsToggleText}>
          {showDetails ? 'Hide details' : 'How AI uses your information'}
        </Text>
      </TouchableOpacity>
      {showDetails ? (
        <View style={styles.details}>
          <Text style={styles.detailsText}>
            When you allow AI planning, HomeDoc sends this task, property name
            and city/state, area details, your answers, and plan chat to OpenAI
            to generate suggestions. Requests are made only after you allow AI
            planning for this task.
          </Text>
        </View>
      ) : null}
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityState={{ checked: accepted }}
        onPress={() => onChange(!accepted)}
        style={styles.choice}
      >
        <Text style={styles.choiceText}>
          {accepted ? '☑' : '☐'} Allow AI planning for this task.
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 8, marginBottom: 16 },
  body: { color: theme.colors.text.secondary, fontSize: 14, lineHeight: 20 },
  detailsToggle: { minHeight: 44, justifyContent: 'center' },
  detailsToggleText: {
    color: theme.colors.primary.main,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  details: {
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(23, 59, 53, 0.06)',
  },
  detailsText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    lineHeight: 19,
  },
  choice: { minHeight: 44, justifyContent: 'center' },
  choiceText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
});
