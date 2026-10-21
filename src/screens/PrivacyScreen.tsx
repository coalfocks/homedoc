import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '@rneui/themed';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';

const privacyEmail =
  'mailto:cfox@skriber.com?subject=HomeDoc%20privacy%20request';

const providerLinks = [
  { label: 'Supabase privacy notice', url: 'https://supabase.com/privacy' },
  {
    label: 'OpenAI API data controls',
    url: 'https://developers.openai.com/api/docs/guides/your-data',
  },
  {
    label: 'OpenAI privacy policy',
    url: 'https://openai.com/policies/privacy-policy/',
  },
  { label: 'Stripe privacy center', url: 'https://stripe.com/privacy' },
  {
    label: 'RevenueCat privacy policy',
    url: 'https://www.revenuecat.com/privacy',
  },
  {
    label: 'Apple privacy policy',
    url: 'https://www.apple.com/legal/privacy/',
  },
];

const openLink = (url: string) => {
  Linking.openURL(url).catch(() => undefined);
};

const PrivacySection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.paragraph}>{children}</Text>
);

export const PrivacyContent = () => (
  <View style={styles.content}>
    <Text style={styles.eyebrow}>HOMEDOC · PUBLIC BETA</Text>
    <Text accessibilityRole="header" style={styles.title}>
      Privacy policy
    </Text>
    <Text style={styles.updated}>Last updated October 20, 2026</Text>
    <Paragraph>
      This page explains what the HomeDoc beta app handles, why it uses that
      information, and how to ask us about your data. We will update this page
      when our data practices change as the beta develops.
    </Paragraph>

    <PrivacySection title="Information you put in HomeDoc">
      <Paragraph>
        HomeDoc stores the information you enter to organize a property,
        including its name and address, areas and descriptions, notes, photos,
        maintenance tasks, task status, and optional due dates and times saved
        with those records. HomeDoc does not currently send notifications for
        due dates. Records can also include AI-generated plans and the follow-up
        messages you choose to send. If you share or hand off a property,
        HomeDoc also stores account emails and roles needed to manage that
        access, including contractor contact details you provide.
      </Paragraph>
      <Paragraph>
        To create and secure an account, HomeDoc processes your email address,
        sign-in credentials or sign-in method, and session information. The app
        supports email-and-password sign-in and email sign-in links.
      </Paragraph>
      <Paragraph>
        If you choose to send beta feedback by email, HomeDoc opens your email
        app with the screen, platform, app version, and account email prefilled.
        You decide whether to send it and can edit the message first.
      </Paragraph>
    </PrivacySection>

    <PrivacySection title="How the app uses and shares information">
      <Paragraph>
        HomeDoc uses Supabase for account sign-in and to store app records and
        uploaded images. Images are stored in a private bucket. Access to a
        property can be shared with another HomeDoc account; household members
        and property collaborators can access shared records, and an invited
        contractor can access the area assigned to them. A property transfer
        moves that property's record into the recipient's household, where its
        members can access it.
      </Paragraph>
      <Paragraph>
        Private image links are temporary. A link that was already issued can
        remain usable until it expires, for up to one hour, even if sharing is
        changed in the meantime.
      </Paragraph>
      <Paragraph>
        When you use AI planning or chat, the app sends OpenAI the task title
        and details, priority, property name, area name and description, and the
        property's city and state. It does not automatically send property
        photos or the street-address fields. Personal information you type into
        a task, plan answers, or follow-up message is included in the relevant
        request. Answers go with a plan request; a follow-up also includes the
        saved plan and recent conversation. Generated plans and follow-up
        messages are saved with the task in HomeDoc.
      </Paragraph>
      <Paragraph>
        OpenAI says its API data is not used to train or improve its models by
        default. OpenAI's API documentation says default abuse-monitoring logs
        may include prompts and responses and are retained for up to 30 days,
        unless a longer period is required by law or needed for security. We
        have not verified any special retention setting for HomeDoc's API
        account. See OpenAI's current data-controls documentation for details.
      </Paragraph>
    </PrivacySection>

    <PrivacySection title="Payments and service providers">
      <Paragraph>
        Basic home records are free. Existing beta access does not require
        payment. When you purchase a subscription in the iOS app, Apple
        processes payment. When you view iOS subscription options, purchase, or
        restore, RevenueCat verifies purchases and receives your HomeDoc account
        ID, purchase identifiers, subscription status, and purchase-related
        device information. HomeDoc stores the verified plan and expiration to
        provide account features. RevenueCat also provides subscription
        analytics. Stripe handles subscriptions purchased through web checkout.
        HomeDoc does not collect card details in its own forms.
      </Paragraph>
      <Paragraph>
        HomeDoc uses Supabase, OpenAI for AI planning, and Apple and RevenueCat
        for iOS subscriptions. Stripe is used for web checkout. Each provider
        has its own privacy and data handling terms, which can change. Review
        their current notices below.
      </Paragraph>
    </PrivacySection>

    <PrivacySection title="Retention and account deletion">
      <Paragraph>
        HomeDoc keeps account and property information while it is used to
        provide the service. You can request account deletion in the app or by
        contacting us. Deleting an account removes its login and unshared owned
        records and linked images. Shared property records may remain available
        to others or be transferred to an existing collaborator or household
        member. If deletion or image cleanup fails, contact us for follow-up. We
        do not state a fixed retention period for provider backups or
        operational logs.
      </Paragraph>
      <Paragraph>
        You can also ask us to review or correct information, or to remove your
        access from a shared property. We may need to verify that the request
        relates to your account.
      </Paragraph>
    </PrivacySection>

    <PrivacySection title="Contact">
      <Paragraph>
        For privacy questions or data requests, email HomeDoc at{' '}
        <Text
          accessibilityRole="link"
          onPress={() => openLink(privacyEmail)}
          style={styles.inlineLink}
        >
          cfox@skriber.com
        </Text>
        .
      </Paragraph>
      <View style={styles.linkList}>
        {providerLinks.map((link) => (
          <TouchableOpacity
            key={link.url}
            accessibilityRole="link"
            onPress={() => openLink(link.url)}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>{link.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </PrivacySection>
    <Text style={styles.footer}>HomeDoc · October 2026</Text>
  </View>
);

const PrivacyScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <SafeAreaView
    style={styles.screen}
    edges={['top', 'left', 'right', 'bottom']}
  >
    <View style={styles.topBar}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Close privacy policy"
        onPress={onClose}
        style={styles.closeButton}
      >
        <Text style={styles.closeText}>‹ Back</Text>
      </TouchableOpacity>
    </View>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator
    >
      <PrivacyContent />
    </ScrollView>
  </SafeAreaView>
);

export default PrivacyScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  topBar: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  closeButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  closeText: {
    color: theme.colors.primary.main,
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.paper,
    ...theme.shadows.sm,
  },
  eyebrow: {
    color: theme.colors.secondary.dark,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    marginTop: theme.spacing.xs,
    color: theme.colors.primary.dark,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
  },
  updated: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  section: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.primary.dark,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '800',
  },
  paragraph: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 23,
  },
  inlineLink: {
    color: theme.colors.info.dark,
    textDecorationLine: 'underline',
  },
  linkList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  linkButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.elevated,
  },
  linkText: {
    color: theme.colors.info.dark,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: theme.spacing.xl,
    color: theme.colors.text.secondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
