import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { theme } from '../utils/theme';

export const AiConsentNotice = ({
  accepted,
  onChange,
}: {
  accepted: boolean;
  onChange: (accepted: boolean) => void;
}) => (
  <View style={styles.container}>
    <Text style={styles.body}>
      AI planning sends this task, property name and city/state, area details,
      your answers, and plan chat to OpenAI to provide suggestions. Each set of
      questions, generated plan, and chat reply uses one AI request.
    </Text>
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked: accepted }}
      onPress={() => onChange(!accepted)}
      style={styles.choice}
    >
      <Text style={styles.choiceText}>
        {accepted ? '☑' : '☐'} I agree to send these details to OpenAI for this
        task.
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { gap: 8, marginBottom: 16 },
  body: { color: theme.colors.text.secondary, fontSize: 14, lineHeight: 20 },
  choice: { minHeight: 44, justifyContent: 'center' },
  choiceText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
  },
});
