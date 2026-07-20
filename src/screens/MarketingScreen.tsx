import React from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text } from '@rneui/themed';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { theme } from '../utils/theme';

const appUrl = 'https://app.homedocumentation.com';
const betaEmail = 'mailto:cfox@skriber.com?subject=HomeDoc beta access';

const openUrl = (url: string) => {
  Linking.openURL(url).catch(() => undefined);
};

const FeatureRow = ({
  icon,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  body: string;
}) => (
  <View style={styles.featureRow}>
    <View style={styles.featureIcon}>
      <Icon name={icon} size={20} color={theme.colors.primary.main} />
    </View>
    <View style={styles.featureCopy}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureBody}>{body}</Text>
    </View>
  </View>
);

const MockAppPanel = () => (
  <View style={styles.mockFrame}>
    <View style={styles.mockHeader}>
      <View>
        <Text style={styles.mockEyebrow}>YOUR HOME BASE</Text>
        <Text style={styles.mockTitle}>Maple House</Text>
      </View>
      <View style={styles.mockBadge}>
        <Text style={styles.mockBadgeText}>Beta</Text>
      </View>
    </View>

    <View style={styles.mockStats}>
      <View style={styles.mockStat}>
        <Text style={styles.mockStatValue}>08</Text>
        <Text style={styles.mockStatLabel}>Areas</Text>
      </View>
      <View style={styles.mockStat}>
        <Text style={styles.mockStatValue}>24</Text>
        <Text style={styles.mockStatLabel}>Notes</Text>
      </View>
      <View style={styles.mockStat}>
        <Text style={styles.mockStatValue}>11</Text>
        <Text style={styles.mockStatLabel}>Todos</Text>
      </View>
    </View>

    {[
      ['Kitchen', 'Paint: Swiss Coffee. Dishwasher warranty saved.'],
      ['Utility Room', 'Furnace filter: 16x25x1. Replaced last month.'],
      ['Inspection', 'Prioritize GFCI outlet and gutter extension.'],
    ].map(([title, body]) => (
      <View key={title} style={styles.mockCard}>
        <View style={styles.mockCardImage}>
          <Text style={styles.mockCardInitial}>{title.slice(0, 1)}</Text>
        </View>
        <View style={styles.mockCardCopy}>
          <Text style={styles.mockCardTitle}>{title}</Text>
          <Text style={styles.mockCardBody}>{body}</Text>
        </View>
      </View>
    ))}
  </View>
);

export const MarketingScreen = () => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 760;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.nav}>
        <View style={styles.brand}>
          <Logo size={34} color={theme.colors.primary.main} />
          <Text style={styles.brandName}>HomeDoc</Text>
        </View>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => openUrl(appUrl)}
        >
          <Text style={styles.navButtonText}>Open app</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.hero, isNarrow && styles.heroNarrow]}>
        <View style={[styles.heroCopy, isNarrow && styles.heroCopyNarrow]}>
          <Text style={styles.kicker}>PRIVATE HOME RECORDS</Text>
          <Text style={[styles.heroTitle, isNarrow && styles.heroTitleNarrow]}>
            The memory your house should have come with.
          </Text>
          <Text style={[styles.heroBody, isNarrow && styles.heroBodyNarrow]}>
            HomeDoc keeps the details every homeowner loses: project notes,
            photos, appliance info, contractor history, maintenance todos, and
            the little facts you only remember when something breaks.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => openUrl(betaEmail)}
            >
              <Text style={styles.primaryActionText}>Request beta access</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => openUrl(appUrl)}
            >
              <Text style={styles.secondaryActionText}>I have an invite</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.heroVisual, isNarrow && styles.heroVisualNarrow]}>
          <MockAppPanel />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Built for real home chaos</Text>
        <View style={styles.featureGrid}>
          <FeatureRow
            icon="home"
            title="Room-by-room memory"
            body="Keep paint colors, model numbers, warranties, measurements, and notes tied to the place they belong."
          />
          <FeatureRow
            icon="note"
            title="Photos with context"
            body="Store the thing you found, fixed, replaced, or need to remember without digging through your camera roll."
          />
          <FeatureRow
            icon="todo"
            title="Maintenance todos"
            body="Turn scattered reminders into a practical list for the home you live in, rent out, or manage."
          />
        </View>
      </View>

      <View style={[styles.betaBand, isNarrow && styles.betaBandNarrow]}>
        <View>
          <Text style={styles.betaTitle}>Early beta is open by invite.</Text>
          <Text style={styles.betaBody}>
            We are starting with homeowners who have real records to organize:
            inspections, repairs, contractor texts, photos, and projects they
            keep meaning to finish.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.betaButton}
          onPress={() => openUrl(betaEmail)}
        >
          <Text style={styles.betaButtonText}>Join the beta</Text>
        </TouchableOpacity>
      </View>

      {Platform.OS === 'web' ? <View style={styles.footerSpacer} /> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  pageContent: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  nav: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    color: theme.colors.text.primary,
    fontSize: 19,
    fontWeight: '800',
  },
  navButton: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.strong,
    backgroundColor: theme.colors.background.elevated,
  },
  navButtonText: {
    color: theme.colors.primary.dark,
    fontWeight: '800',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 48,
    marginBottom: 72,
  },
  heroNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 28,
    marginBottom: 48,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroCopyNarrow: {
    width: '100%',
  },
  kicker: {
    color: theme.colors.secondary.dark,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 12,
  },
  heroTitle: {
    color: theme.colors.text.primary,
    fontSize: 56,
    lineHeight: 62,
    fontWeight: '900',
    maxWidth: 620,
    marginBottom: 20,
  },
  heroTitleNarrow: {
    fontSize: 40,
    lineHeight: 46,
  },
  heroBody: {
    color: theme.colors.text.slate,
    fontSize: 19,
    lineHeight: 30,
    maxWidth: 620,
    marginBottom: 28,
  },
  heroBodyNarrow: {
    fontSize: 17,
    lineHeight: 26,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  primaryAction: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary.main,
  },
  primaryActionText: {
    color: theme.colors.primary.contrast,
    fontWeight: '900',
  },
  secondaryAction: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.strong,
    backgroundColor: theme.colors.background.elevated,
  },
  secondaryActionText: {
    color: theme.colors.primary.dark,
    fontWeight: '900',
  },
  heroVisual: {
    flex: 1,
    minWidth: 320,
  },
  heroVisualNarrow: {
    width: '100%',
    minWidth: 0,
  },
  mockFrame: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    padding: 18,
    shadowColor: '#6F6254',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 26,
  },
  mockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  mockEyebrow: {
    color: theme.colors.primary.light,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  mockTitle: {
    color: theme.colors.text.primary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  mockBadge: {
    height: 30,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(63, 127, 104, 0.12)',
  },
  mockBadgeText: {
    color: theme.colors.accent.dark,
    fontWeight: '900',
  },
  mockStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  mockStat: {
    flex: 1,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  mockStatValue: {
    color: theme.colors.primary.dark,
    fontSize: 24,
    fontWeight: '900',
  },
  mockStatLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  mockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginTop: 10,
  },
  mockCardImage: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 77, 107, 0.10)',
  },
  mockCardInitial: {
    color: theme.colors.primary.dark,
    fontSize: 20,
    fontWeight: '900',
  },
  mockCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  mockCardTitle: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  mockCardBody: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  section: {
    marginBottom: 52,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 20,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureRow: {
    flexBasis: 320,
    flexGrow: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 18,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31, 77, 107, 0.10)',
  },
  featureCopy: {
    flex: 1,
    minWidth: 0,
  },
  featureTitle: {
    color: theme.colors.text.primary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  featureBody: {
    color: theme.colors.text.slate,
    fontSize: 15,
    lineHeight: 22,
  },
  betaBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    padding: 24,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary.dark,
    marginBottom: 32,
  },
  betaBandNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  betaTitle: {
    color: theme.colors.text.inverse,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    marginBottom: 8,
  },
  betaBody: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 720,
  },
  betaButton: {
    minHeight: 46,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 18,
    backgroundColor: theme.colors.secondary.main,
  },
  betaButtonText: {
    color: theme.colors.secondary.contrast,
    fontWeight: '900',
  },
  footerSpacer: {
    height: 28,
  },
});
