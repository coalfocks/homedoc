import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import {
  EmptyStateCard,
  MetricPill,
  PageHeader,
  Screen,
  SectionTitle,
} from '../components/AppChrome';
import { BetaFeedbackCard } from '../components/BetaFeedbackCard';
import { UpgradeCard } from '../components/UpgradeCard';
import { useAuth } from '../contexts/AuthContext';
import { useBilling } from '../hooks/useBilling';
import { supabase } from '../lib/supabase';
import { openFeedbackEmail } from '../utils/feedback';
import { theme } from '../utils/theme';

const proFeatures = [
  'AI maintenance plans with materials, costs, warnings, and follow-up chat',
  'Unlimited properties for your house, rentals, cabins, and family homes',
  'Share-ready transfer flows so home knowledge moves with the property',
  'Future handoff packets for buyers, tenants, realtors, and inspectors',
];

const goToMarketUseCases = [
  {
    title: 'Move-in memory',
    body: 'Capture paint colors, appliance models, warranties, filters, shutoffs, and contractor details before they vanish into camera roll hell.',
  },
  {
    title: 'Maintenance planning',
    body: 'Turn a messy todo into a scoped plan with tools, parts, warnings, rough cost, and a clean checklist.',
  },
  {
    title: 'Home handoff',
    body: 'Transfer the home record to a buyer, partner, property manager, or tenant when ownership or responsibility changes.',
  },
];

const UpgradeScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    entitlement,
    isPro,
    betaAccess,
    checkoutLoading,
    error,
    openCheckout,
    openBillingPortal,
  } = useBilling();

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your HomeDoc account and the properties owned by this account. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            const { error: deleteError } =
              await supabase.functions.invoke('delete-account');

            if (deleteError) {
              Alert.alert(
                'Could not delete account',
                deleteError.message || 'Please send a deletion request.',
              );
              return;
            }

            await signOut();
          },
        },
      ],
    );
  };

  if (betaAccess) {
    const betaFeatures = [
      'AI planning for home todos',
      'Multiple properties while beta access is active',
      'Share and transfer flows for home handoff testing',
      'Feedback capture with app version and account context',
    ];

    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <PageHeader
          eyebrow="HOMEDOC BETA"
          title="Free beta access is active"
          subtitle="Use the full app, then tell us what feels useful, confusing, or missing before paid plans go live."
        />

        <View style={styles.activeCard}>
          <Text style={styles.activeTitle}>No payment required</Text>
          <Text style={styles.activeBody}>
            Pro surfaces are included during beta so testers can exercise the
            complete workflow without hitting checkout.
          </Text>
        </View>

        <SectionTitle
          title="What to try"
          subtitle="The goal is to learn whether documenting a home feels valuable enough to keep doing."
        />
        <View style={styles.featureList}>
          {betaFeatures.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <BetaFeedbackCard context="Beta" compact />

        <SectionTitle
          title="Privacy and account"
          subtitle="HomeDoc stores home details, addresses, and photos. Uploaded images currently use public storage URLs during beta."
        />
        <View style={styles.accountCard}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              openFeedbackEmail('Privacy or data request', user?.email)
            }
          >
            <Text style={styles.secondaryButtonText}>Privacy request</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={confirmDeleteAccount}
          >
            <Text style={styles.deleteAccountButtonText}>Delete account</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow={betaAccess ? 'HOMEDOC BETA' : 'HOMEDOC PRO'}
        title={
          betaAccess
            ? 'Pro is included while HomeDoc is in beta'
            : 'Keep the house knowledge worth paying for'
        }
        subtitle={
          betaAccess
            ? 'Use everything, then tell us what should stay, what should change, and what would eventually be worth paying for.'
            : 'HomeDoc Pro is for AI planning, unlimited records, and clean handoffs when a home changes hands.'
        }
      />

      <View style={styles.metricRow}>
        <MetricPill label="Plan" value={isPro ? 'Pro' : 'Free'} />
        <MetricPill label="Status" value={entitlement.status || 'free'} />
      </View>

      {betaAccess ? (
        <View style={styles.activeCard}>
          <Text style={styles.activeTitle}>Free beta access is active</Text>
          <Text style={styles.activeBody}>
            AI planning, extra properties, and handoff surfaces are unlocked for
            beta feedback. No payment is required right now.
          </Text>
        </View>
      ) : isPro ? (
        <View style={styles.activeCard}>
          <Text style={styles.activeTitle}>Pro is active</Text>
          <Text style={styles.activeBody}>
            AI plans and Pro surfaces are unlocked on this account.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={openBillingPortal}
            disabled={checkoutLoading}
          >
            <Text style={styles.secondaryButtonText}>
              {checkoutLoading ? 'Opening...' : 'Manage billing'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <UpgradeCard
          title="Upgrade when the home record becomes valuable"
          body="Start free. Go Pro when you want AI planning, more properties, and handoff-ready records."
          cta="Start Pro"
          loading={checkoutLoading}
          onPress={openCheckout}
        />
      )}

      <BetaFeedbackCard context="Beta and Pro" compact />

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Billing is not ready yet</Text>
          <Text style={styles.errorBody}>{error}</Text>
        </View>
      ) : null}

      <SectionTitle
        title="What Pro unlocks"
        subtitle="The paid tier should feel like the operational layer for a real home, not a prettier notes list."
      />

      <View style={styles.featureList}>
        {proFeatures.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <SectionTitle
        title="Why people buy"
        subtitle="The wedge is not organization. It is avoiding expensive forgotten home knowledge."
      />

      <View style={styles.useCaseList}>
        {goToMarketUseCases.map((item) => (
          <View key={item.title} style={styles.useCaseCard}>
            <Text style={styles.useCaseTitle}>{item.title}</Text>
            <Text style={styles.useCaseBody}>{item.body}</Text>
          </View>
        ))}
      </View>

      <EmptyStateCard
        icon="home"
        title="Best GTM wedge"
        description="Start with realtors, inspectors, property managers, and move-in moments. Transfer/share creates the loop; AI planning creates retention."
      />
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
    borderRadius: theme.borderRadius.lg,
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
    borderRadius: theme.borderRadius.lg,
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
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.88)',
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
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.86)',
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
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.sm,
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
