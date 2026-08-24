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

const rooms = [
  {
    title: 'Kitchen',
    meta: 'Last updated 2 days ago',
    body: 'Paint: Swiss Coffee. Dishwasher warranty and installer note saved.',
    icon: 'home' as const,
  },
  {
    title: 'Utility Room',
    meta: '4 open tasks',
    body: 'Furnace filter: 16x25x1. Water shutoff photos attached.',
    icon: 'area' as const,
  },
  {
    title: 'Inspection Punch List',
    meta: 'Shared with contractor',
    body: 'Prioritize GFCI outlet, gutter extension, and crawlspace vapor barrier.',
    icon: 'todo' as const,
  },
];

const featureRows = [
  {
    icon: 'area' as const,
    title: 'Rooms',
    body: 'Photos, measurements, paint colors, model numbers, documents, and notes stay attached to the room where they matter.',
  },
  {
    icon: 'camera' as const,
    title: 'Repairs',
    body: 'Capture what broke, who fixed it, which part was used, and what to check next time.',
  },
  {
    icon: 'note' as const,
    title: 'Products and warranties',
    body: 'Keep appliance details, filter sizes, warranty terms, manuals, and service notes where you can actually find them.',
  },
  {
    icon: 'todo' as const,
    title: 'Projects',
    body: 'Turn inspections, quotes, and half-finished ideas into useful next steps instead of another forgotten note.',
  },
  {
    icon: 'lock' as const,
    title: 'Contractor access',
    body: 'Share the room-specific context a contractor needs without giving away the whole home record.',
  },
  {
    icon: 'swap-horiz' as const,
    title: 'Handoffs',
    body: 'Package the facts someone else needs without forwarding old texts or rebuilding context from scratch.',
  },
];

const useCases = [
  'Find the exact paint color before touching up a wall.',
  'Send a handyman room-specific context before they arrive.',
  'Pull appliance details, filters, warranties, and service dates in seconds.',
  'Give a buyer or property manager a clean record instead of a folder mess.',
];

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
      <Icon name={icon} size={19} color={theme.colors.primary.dark} />
    </View>
    <View style={styles.featureCopy}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureBody}>{body}</Text>
    </View>
  </View>
);

const MockAppPanel = () => (
  <View style={styles.productShot}>
    <View style={styles.productTopBar}>
      <View style={styles.windowDots}>
        <View style={[styles.windowDot, styles.windowDotWarm]} />
        <View style={[styles.windowDot, styles.windowDotGold]} />
        <View style={[styles.windowDot, styles.windowDotGreen]} />
      </View>
      <Text style={styles.productTopLabel}>homedoc/property</Text>
    </View>

    <View style={styles.productHeader}>
      <View>
        <Text style={styles.mockEyebrow}>PROPERTY FILE</Text>
        <Text style={styles.mockTitle}>Maple House</Text>
        <Text style={styles.mockSubTitle}>8 areas, 24 notes, 11 todos</Text>
      </View>
      <View style={styles.mockBadge}>
        <Icon name="lock" size={14} color={theme.colors.accent.dark} />
        <Text style={styles.mockBadgeText}>Private</Text>
      </View>
    </View>

    <View style={styles.snapshotRow}>
      <View style={styles.snapshotCard}>
        <Text style={styles.snapshotValue}>3</Text>
        <Text style={styles.snapshotLabel}>shared contractors</Text>
      </View>
      <View style={styles.snapshotCard}>
        <Text style={styles.snapshotValue}>14</Text>
        <Text style={styles.snapshotLabel}>photos with context</Text>
      </View>
    </View>

    <View style={styles.priorityPanel}>
      <View style={styles.priorityIcon}>
        <Icon name="priority" size={18} color={theme.colors.warning.dark} />
      </View>
      <View style={styles.priorityCopy}>
        <Text style={styles.priorityTitle}>Next useful thing</Text>
        <Text style={styles.priorityBody}>
          Confirm gutter extension quote before the next storm.
        </Text>
      </View>
    </View>

    {rooms.map((room) => (
      <View key={room.title} style={styles.mockCard}>
        <View style={styles.mockCardIcon}>
          <Icon name={room.icon} size={18} color={theme.colors.primary.dark} />
        </View>
        <View style={styles.mockCardCopy}>
          <View style={styles.mockCardTopRow}>
            <Text style={styles.mockCardTitle}>{room.title}</Text>
            <Text style={styles.mockCardMeta}>{room.meta}</Text>
          </View>
          <Text style={styles.mockCardBody}>{room.body}</Text>
        </View>
      </View>
    ))}
  </View>
);

export const MarketingScreen = () => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 780;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
      <View style={styles.nav}>
        <View style={styles.brand}>
          <Logo size={34} color={theme.colors.primary.main} />
          <View>
            <Text style={styles.brandName}>HomeDoc</Text>
            <Text style={styles.brandTag}>Property memory</Text>
          </View>
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
          <View style={styles.kickerPill}>
            <Icon name="home" size={14} color={theme.colors.primary.dark} />
            <Text style={styles.kicker}>PRIVATE HOME RECORDS</Text>
          </View>
          <Text style={[styles.heroTitle, isNarrow && styles.heroTitleNarrow]}>
            Your house should remember things for you.
          </Text>
          <Text style={[styles.heroBody, isNarrow && styles.heroBodyNarrow]}>
            HomeDoc keeps room notes, repair photos, appliance details,
            contractor context, and handoff-ready records in one calm property
            file.
          </Text>
          <View style={styles.heroProof}>
            <Text style={styles.heroProofText}>
              Built for homeowners, landlords, Airbnb hosts, and anyone who has
              ever asked, "where did we save that?"
            </Text>
          </View>
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
              <Text style={styles.secondaryActionText}>
                I already have an invite
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.heroVisual, isNarrow && styles.heroVisualNarrow]}>
          <MockAppPanel />
        </View>
      </View>

      <View style={[styles.momentsBand, isNarrow && styles.momentsBandNarrow]}>
        <Text style={styles.momentsTitle}>
          Made for the moments homes create
        </Text>
        <View style={styles.momentList}>
          {useCases.map((item) => (
            <View key={item} style={styles.momentItem}>
              <Icon name="check" size={16} color={theme.colors.accent.dark} />
              <Text style={styles.momentText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionKicker}>WHAT HOMEDOC HOLDS</Text>
        <Text style={styles.sectionTitle}>
          The details that usually get scattered across texts, camera rolls, and
          memory.
        </Text>
        <View style={styles.featureGrid}>
          {featureRows.map((feature) => (
            <FeatureRow
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              body={feature.body}
            />
          ))}
        </View>
      </View>

      <View style={[styles.betaBand, isNarrow && styles.betaBandNarrow]}>
        <View style={styles.betaCopy}>
          <Text style={styles.betaEyebrow}>EARLY ACCESS</Text>
          <Text style={styles.betaTitle}>Start with one real property.</Text>
          <Text style={styles.betaBody}>
            The beta is best if you already have inspections, repairs,
            contractor texts, photos, warranties, or project notes you keep
            meaning to organize.
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
    backgroundColor: '#F8F6F1',
  },
  pageContent: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  nav: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 42,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandName: {
    color: theme.colors.text.primary,
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '800',
  },
  brandTag: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  navButton: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: '#FFFFFF',
  },
  navButtonText: {
    color: theme.colors.primary.dark,
    fontWeight: '700',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 42,
    marginBottom: 42,
  },
  heroNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 28,
    marginBottom: 34,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroCopyNarrow: {
    width: '100%',
  },
  kickerPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(40, 80, 106, 0.08)',
    marginBottom: 18,
  },
  kicker: {
    color: theme.colors.primary.dark,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  heroTitle: {
    color: theme.colors.text.primary,
    fontSize: 56,
    lineHeight: 61,
    fontWeight: '800',
    maxWidth: 620,
    marginBottom: 18,
  },
  heroTitleNarrow: {
    fontSize: 40,
    lineHeight: 45,
  },
  heroBody: {
    color: theme.colors.text.slate,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 610,
    marginBottom: 18,
  },
  heroBodyNarrow: {
    fontSize: 17,
    lineHeight: 26,
  },
  heroProof: {
    maxWidth: 590,
    paddingLeft: 16,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.secondary.main,
    marginBottom: 28,
  },
  heroProofText: {
    color: theme.colors.primary.dark,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
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
    fontWeight: '800',
  },
  secondaryAction: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    backgroundColor: '#FFFFFF',
  },
  secondaryActionText: {
    color: theme.colors.primary.dark,
    fontWeight: '800',
  },
  heroVisual: {
    flex: 1,
    minWidth: 340,
  },
  heroVisualNarrow: {
    width: '100%',
    minWidth: 0,
  },
  productShot: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    overflow: 'hidden',
    shadowColor: '#62584F',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
  },
  productTopBar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
    backgroundColor: theme.colors.background.elevated,
  },
  windowDots: {
    flexDirection: 'row',
    gap: 6,
  },
  windowDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  windowDotWarm: {
    backgroundColor: '#D77B68',
  },
  windowDotGold: {
    backgroundColor: '#E7BE71',
  },
  windowDotGreen: {
    backgroundColor: '#6DA28E',
  },
  productTopLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    padding: 18,
    paddingBottom: 14,
  },
  mockEyebrow: {
    color: theme.colors.secondary.dark,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  mockTitle: {
    color: theme.colors.text.primary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  mockSubTitle: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  mockBadge: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(63, 127, 104, 0.12)',
  },
  mockBadgeText: {
    color: theme.colors.accent.dark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  snapshotCard: {
    flex: 1,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    backgroundColor: '#F4F1EA',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  snapshotValue: {
    color: theme.colors.primary.dark,
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
  },
  snapshotLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  priorityPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 18,
    marginBottom: 10,
    padding: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(217, 164, 65, 0.14)',
  },
  priorityIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(217, 164, 65, 0.18)',
  },
  priorityCopy: {
    flex: 1,
    minWidth: 0,
  },
  priorityTitle: {
    color: theme.colors.warning.dark,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  priorityBody: {
    color: theme.colors.text.primary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  mockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  mockCardIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 80, 106, 0.09)',
  },
  mockCardCopy: {
    flex: 1,
    minWidth: 0,
  },
  mockCardTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 3,
  },
  mockCardTitle: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  mockCardMeta: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  mockCardBody: {
    color: theme.colors.text.slate,
    fontSize: 13,
    lineHeight: 18,
  },
  momentsBand: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 28,
    paddingVertical: 28,
    paddingHorizontal: 28,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary.dark,
    marginBottom: 52,
  },
  momentsBandNarrow: {
    flexDirection: 'column',
    gap: 18,
  },
  momentsTitle: {
    flex: 1,
    color: theme.colors.text.inverse,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
  },
  momentList: {
    flex: 1.35,
    gap: 12,
  },
  momentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  momentText: {
    flex: 1,
    color: 'rgba(255,255,255,0.84)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  section: {
    marginBottom: 52,
  },
  sectionKicker: {
    color: theme.colors.secondary.dark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    maxWidth: 760,
    marginBottom: 22,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 80, 106, 0.09)',
  },
  featureCopy: {
    flex: 1,
    minWidth: 0,
  },
  featureTitle: {
    color: theme.colors.text.primary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
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
    padding: 26,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: 32,
  },
  betaBandNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  betaCopy: {
    flex: 1,
    minWidth: 0,
  },
  betaEyebrow: {
    color: theme.colors.accent.dark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  betaTitle: {
    color: theme.colors.text.primary,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    marginBottom: 8,
  },
  betaBody: {
    color: theme.colors.text.slate,
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
    fontWeight: '800',
  },
  footerSpacer: {
    height: 28,
  },
});
