import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrivacyPolicyLink } from '../components/PrivacyPolicyLink';
import { theme } from '../utils/theme';

export default function SupportScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>HomeDoc support</Text>
        <Text style={styles.body}>
          For help with sign-in, home records, purchases, or privacy, email
          cfox@skriber.com. Include your app version and what happened. Please
          leave passwords and sensitive home details out of your message.
        </Text>
        <TouchableOpacity
          accessibilityRole="link"
          onPress={() =>
            Linking.openURL('mailto:cfox@skriber.com?subject=HomeDoc%20support')
          }
        >
          <Text style={styles.link}>Email HomeDoc support</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Subscriptions</Text>
        <Text style={styles.body}>
          In the iOS app, open Account to restore purchases or manage your Apple
          subscription. Use the same HomeDoc account you used when subscribing.
          Purchases made through the website are managed through web billing
          settings.
        </Text>
        <Text style={styles.heading}>Account deletion</Text>
        <Text style={styles.body}>
          Sign in, open Account, and choose Delete account. This permanently
          removes your account; shared records may be transferred to eligible
          collaborators as described in the privacy policy. Deleting an account
          does not cancel a subscription. You can also email us for help with a
          deletion or data request.
        </Text>
        <PrivacyPolicyLink />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background.default },
  content: {
    padding: 24,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
    gap: 18,
  },
  title: { fontSize: 32, fontWeight: '800', color: theme.colors.text.primary },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  body: { fontSize: 17, lineHeight: 26, color: theme.colors.text.secondary },
  link: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.primary.main,
    minHeight: 44,
  },
});
