import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';
import { betaFeedbackEmail, betaFeedbackSubject } from '../config/beta';

export const openFeedbackEmail = async (
  context: string,
  accountEmail?: string | null,
) => {
  const appVersion = Constants.expoConfig?.version || 'unknown';
  const body = [
    `Screen: ${context}`,
    `Platform: ${Platform.OS}`,
    `App version: ${appVersion}`,
    `Account email: ${accountEmail || 'not provided'}`,
    '',
    'What felt useful?',
    '',
    'What was confusing or missing?',
    '',
    'Anything you expected HomeDoc to do?',
  ].join('\n');

  const url = `mailto:${betaFeedbackEmail}?subject=${encodeURIComponent(
    betaFeedbackSubject,
  )}&body=${encodeURIComponent(body)}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(
        'Email not available',
        `Send feedback to ${betaFeedbackEmail} and include your account email.`,
      );
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Email not available',
      `Send feedback to ${betaFeedbackEmail} and include your account email.`,
    );
  }
};
