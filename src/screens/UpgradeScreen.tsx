import React from 'react';
import {
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '@rneui/themed';
import { PageHeader, Screen, SectionTitle } from '../components/AppChrome';
import { BetaFeedbackCard } from '../components/BetaFeedbackCard';
import { UpgradeCard } from '../components/UpgradeCard';
import { useAuth } from '../contexts/AuthContext';
import { useBilling } from '../hooks/useBilling';
import { supabase } from '../lib/supabase';
import { openFeedbackEmail } from '../utils/feedback';
import { PrivacyPolicyLink } from '../components/PrivacyPolicyLink';
import { theme } from '../utils/theme';
import { showDialog } from '../utils/dialogs';
import { isFreeBeta } from '../config/beta';

const UpgradeScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    entitlement,
    isPro,
    betaAccess,
    loading,
    checkoutLoading,
    error,
    notice,
    prices,
    billingInterval,
    setBillingInterval,
    openCheckout,
    restorePurchases,
    openBillingPortal,
  } = useBilling({ loadOffering: true });
  const isIos = Platform.OS === 'ios';
  const displayedPrices = isIos
    ? prices
    : Platform.OS === 'web'
      ? { annual: 'US$14.99', monthly: 'US$2.99' }
      : null;
  const confirmDeleteAccount = () => {
    showDialog(
      'Delete account',
      'This permanently deletes your HomeDoc account. Properties with an eligible household member or collaborator may be transferred to them; other properties and their records are deleted. This cannot be undone. Deleting your account does not cancel an Apple subscription; manage it in App Store subscriptions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            const { error: deleteError } =
              await supabase.functions.invoke('delete-account');
            if (deleteError) {
              showDialog(
                'Could not delete account',
                'Please try again or contact cfox@skriber.com.',
              );
              return;
            }
            await signOut();
          },
        },
      ],
    );
  };
  const features = betaAccess
    ? [
        'Multiple properties while beta access is active',
        '20 AI requests per calendar month',
      ]
    : [
        'Additional properties',
        '50 AI requests per calendar month. Questions, plans, and follow-up messages each count as one request.',
      ];

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="HOMEDOC"
        title="Your plan and account"
        subtitle="Keep home details, photos, notes, and maintenance tasks together."
      />
      {betaAccess ? (
        <View style={styles.activeCard}>
          <Text style={styles.activeTitle}>Free beta access is active</Text>
          <Text style={styles.activeBody}>
            Your beta access continues without payment. We will announce any
            change before it ends.
          </Text>
        </View>
      ) : isPro ? (
        <View style={styles.activeCard}>
          <Text style={styles.activeTitle}>HomeDoc Pro is active</Text>
          <Text style={styles.activeBody}>
            AI planning and additional properties are available on your account.
          </Text>
        </View>
      ) : (
        <>
          <SectionTitle
            title="Start with one home, free"
            subtitle="Basic home records stay free and accessible. Save photos, notes, areas, and tasks; sharing and home transfer are included. Try AI with 4 requests each calendar month."
          />
          <UpgradeCard
            title="HomeDoc Pro"
            body="Add extra properties and get 50 AI requests per calendar month. Questions, plans, and follow-up messages each count as one request. Basic home records stay free and accessible if you cancel."
            interval={billingInterval}
            prices={displayedPrices}
            selectionDisabled={checkoutLoading}
            onIntervalChange={setBillingInterval}
            cta={
              displayedPrices?.[billingInterval]
                ? `${isIos ? 'Subscribe' : 'Continue'} — ${displayedPrices[billingInterval]}/${billingInterval === 'annual' ? 'year' : 'month'}`
                : 'App Store pricing unavailable'
            }
            loading={checkoutLoading || loading}
            disabled={
              (isIos && !displayedPrices?.[billingInterval]) ||
              Platform.OS === 'android'
            }
            onPress={openCheckout}
          />
          {isIos && prices?.[billingInterval] ? (
            <Text style={styles.activeBody}>
              HomeDoc Pro is an auto-renewing {billingInterval} subscription at{' '}
              {prices[billingInterval]} per{' '}
              {billingInterval === 'annual' ? 'year' : 'month'}. Payment is
              charged to your Apple Account at confirmation. It renews unless
              cancelled at least 24 hours before the current period ends. Manage
              or cancel in App Store subscriptions.
            </Text>
          ) : null}
        </>
      )}
      {isPro ? (
        <>
          <SectionTitle
            title={
              betaAccess
                ? 'Included with your beta access'
                : 'Included with Pro'
            }
          />
          <View style={styles.featureList}>
            {features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Text style={styles.check}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.activeBody}>
            AI questions, generated plans, and follow-up messages each count as
            a request. Allowances reset at the beginning of each UTC calendar
            month.
          </Text>
        </>
      ) : null}
      {isIos && !isFreeBeta ? (
        <TouchableOpacity
          style={styles.secondaryButton}
          disabled={checkoutLoading}
          onPress={restorePurchases}
        >
          <Text style={styles.secondaryButtonText}>Restore purchases</Text>
        </TouchableOpacity>
      ) : null}
      {(isIos && !isFreeBeta) ||
      (!isIos && entitlement.provider === 'stripe') ? (
        <TouchableOpacity
          style={styles.secondaryButton}
          disabled={checkoutLoading}
          onPress={openBillingPortal}
        >
          <Text style={styles.secondaryButtonText}>
            {isIos ? 'Manage Apple subscriptions' : 'Manage billing'}
          </Text>
        </TouchableOpacity>
      ) : null}
      {isIos && entitlement.provider === 'stripe' ? (
        <Text style={styles.activeBody}>
          Your current plan was purchased on the web. Manage that plan on the
          HomeDoc website.
        </Text>
      ) : null}
      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not complete billing</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </View>
      ) : null}
      {notice ? (
        <Text accessibilityLiveRegion="polite" style={styles.activeBody}>
          {notice}
        </Text>
      ) : null}
      <SectionTitle title="Privacy and account" />
      <View style={styles.accountCard}>
        <PrivacyPolicyLink
          style={styles.secondaryButton}
          textStyle={styles.secondaryButtonText}
        />
        {isIos ? (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              Linking.openURL(
                'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/',
              )
            }
          >
            <Text style={styles.secondaryButtonText}>Terms of use</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => openFeedbackEmail('HomeDoc support', user?.email)}
        >
          <Text style={styles.secondaryButtonText}>Contact support</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteAccountButton}
          onPress={confirmDeleteAccount}
        >
          <Text style={styles.deleteAccountButtonText}>Delete account</Text>
        </TouchableOpacity>
      </View>
      <BetaFeedbackCard context="Account" compact betaAccess={betaAccess} />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 140,
  },
  metricRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  activeCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(47, 133, 90, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(47, 133, 90, 0.22)',
    marginBottom: theme.spacing.lg,
  },
  activeTitle: {
    color: theme.colors.success.dark,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  activeBody: {
    color: theme.colors.text.slate,
    lineHeight: theme.typography.body2.lineHeight,
    marginBottom: theme.spacing.md,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.success.dark,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: theme.colors.success.dark,
    fontWeight: '800',
  },
  errorCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(200, 85, 61, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(200, 85, 61, 0.18)',
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    color: theme.colors.error.dark,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  errorBody: {
    color: theme.colors.text.slate,
    lineHeight: theme.typography.body2.lineHeight,
  },
  accountCard: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: theme.spacing.lg,
  },
  deleteAccountButton: {
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.error.main,
    paddingVertical: 12,
  },
  deleteAccountButtonText: {
    color: theme.colors.error.main,
    fontWeight: '800',
  },
  featureList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  check: {
    color: theme.colors.accent.dark,
    fontSize: 16,
    fontWeight: '900',
  },
  featureText: {
    flex: 1,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.body2.lineHeight,
  },
  useCaseList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  useCaseCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  useCaseTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  useCaseBody: {
    color: theme.colors.text.slate,
    lineHeight: theme.typography.body2.lineHeight,
  },
});

export default UpgradeScreen;
