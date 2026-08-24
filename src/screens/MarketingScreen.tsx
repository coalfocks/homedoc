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

const previewRecords = [
  {
    icon: 'area' as const,
    label: 'Kitchen',
    detail: 'Swiss Coffee paint, appliance warranty, backsplash tile source',
  },
  {
    icon: 'camera' as const,
    label: 'Utility room',
    detail: 'Water shutoff photo, furnace filter size, service note',
  },
  {
    icon: 'todo' as const,
    label: 'Inspection follow-up',
    detail: 'GFCI outlet, gutter extension, crawlspace vapor barrier',
  },
];

const messyRecords = [
  'Paint color in an old text thread',
  'Warranty photo buried in camera roll',
  'Contractor notes split across messages',
  'Inspection PDF no one can find later',
];

const organizedRecords = [
  'Room records with notes and photos',
  'Product details kept with the property',
  'Contractor context scoped to the job',
  'Buyer-ready handoff when the home changes hands',
];

const essentials = [
  {
    icon: 'home' as const,
    title: 'One property file',
    body: 'Rooms, projects, repairs, photos, products, and documents stay tied to the house instead of scattered across apps.',
  },
  {
    icon: 'lock' as const,
    title: 'Private by default',
    body: 'Keep the home record to yourself, then share only the room or handoff context someone else needs.',
  },
  {
    icon: 'swap-horiz' as const,
    title: 'Useful later',
    body: 'HomeDoc is built for the second time you need the detail: touch-ups, repairs, rentals, sales, and new contractors.',
  },
];

const AppPreview = () => (
  <View style={styles.deviceShadow}>
    <View style={styles.deviceFrame}>
      <View style={styles.deviceStatus}>
        <Text style={styles.deviceStatusText}>9:41</Text>
        <View style={styles.deviceStatusPills}>
          <View style={styles.statusPill} />
          <View style={[styles.statusPill, styles.statusPillShort]} />
        </View>
      </View>

      <View style={styles.deviceHeader}>
        <View>
          <Text style={styles.deviceEyebrow}>PROPERTY</Text>
          <Text style={styles.deviceTitle}>Maple House</Text>
        </View>
        <View style={styles.deviceLock}>
          <Icon name="lock" size={14} color={theme.colors.accent.dark} />
        </View>
      </View>

      <View style={styles.homePhoto}>
        <View style={styles.homeRoof} />
        <View style={styles.homeBody}>
          <View style={styles.homeWindow} />
          <View style={styles.homeDoor} />
          <View style={styles.homeWindow} />
        </View>
      </View>

      <View style={styles.deviceSectionHeader}>
        <Text style={styles.deviceSectionTitle}>Records worth keeping</Text>
        <Text style={styles.deviceSectionMeta}>Updated today</Text>
      </View>

      {previewRecords.map((record) => (
        <View key={record.label} style={styles.recordRow}>
          <View style={styles.recordIcon}>
            <Icon
              name={record.icon}
              size={17}
              color={theme.colors.primary.dark}
            />
          </View>
          <View style={styles.recordCopy}>
            <Text style={styles.recordLabel}>{record.label}</Text>
            <Text style={styles.recordDetail}>{record.detail}</Text>
          </View>
        </View>
      ))}

      <View style={styles.deviceFooter}>
        <Icon name="download" size={15} color={theme.colors.primary.dark} />
        <Text style={styles.deviceFooterText}>Exportable handoff packet</Text>
      </View>
    </View>
  </View>
);

const RecordColumn = ({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'messy' | 'organized';
}) => (
  <View style={styles.recordColumn}>
    <Text
      style={[
        styles.recordColumnTitle,
        tone === 'organized' && styles.recordColumnTitleOrganized,
      ]}
    >
      {title}
    </Text>
    {items.map((item) => (
      <View key={item} style={styles.recordColumnRow}>
        <Icon
          name={tone === 'organized' ? 'check' : 'close'}
          size={15}
          color={
            tone === 'organized'
              ? theme.colors.accent.dark
              : theme.colors.error.dark
          }
        />
        <Text style={styles.recordColumnText}>{item}</Text>
      </View>
    ))}
  </View>
);

const Essential = ({
  icon,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  body: string;
}) => (
  <View style={styles.essentialRow}>
    <View style={styles.essentialIcon}>
      <Icon name={icon} size={19} color={theme.colors.primary.dark} />
    </View>
    <View style={styles.essentialCopy}>
      <Text style={styles.essentialTitle}>{title}</Text>
      <Text style={styles.essentialBody}>{body}</Text>
    </View>
  </View>
);

export const MarketingScreen = () => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 820;

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
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>PRIVATE HOME RECORDS</Text>
          <Text style={[styles.heroTitle, isNarrow && styles.heroTitleNarrow]}>
            Stop re-learning your house every time something breaks.
          </Text>
          <Text style={[styles.heroBody, isNarrow && styles.heroBodyNarrow]}>
            HomeDoc keeps the details of a property in one useful place: rooms,
            repairs, photos, appliance info, contractor context, and clean
            handoffs.
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
              <Text style={styles.secondaryActionText}>
                I already have an invite
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroNote}>
            Built for owners, landlords, short-term rentals, remodels, and
            property handoffs.
          </Text>
        </View>

        <View style={styles.heroVisual}>
          <AppPreview />
        </View>
      </View>

      <View style={[styles.compareSection, isNarrow && styles.compareNarrow]}>
        <View style={styles.compareIntro}>
          <Text style={styles.sectionKicker}>THE ACTUAL PROBLEM</Text>
          <Text style={styles.sectionTitle}>
            A home creates records whether you organize them or not.
          </Text>
        </View>
        <View
          style={[styles.compareGrid, isNarrow && styles.compareGridNarrow]}
        >
          <RecordColumn
            title="Where details live now"
            items={messyRecords}
            tone="messy"
          />
          <RecordColumn
            title="Where HomeDoc puts them"
            items={organizedRecords}
            tone="organized"
          />
        </View>
      </View>

      <View style={styles.essentialsSection}>
        {essentials.map((item) => (
          <Essential
            key={item.title}
            icon={item.icon}
            title={item.title}
            body={item.body}
          />
        ))}
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
    maxWidth: 1080,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  nav: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 46,
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
    gap: 54,
    marginBottom: 62,
  },
  heroNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 36,
    marginBottom: 46,
  },
  heroCopy: {
    flex: 1.02,
    minWidth: 0,
  },
  kicker: {
    color: theme.colors.secondary.dark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 16,
  },
  heroTitle: {
    color: theme.colors.text.primary,
    fontSize: 50,
    lineHeight: 55,
    fontWeight: '800',
    maxWidth: 640,
    marginBottom: 18,
  },
  heroTitleNarrow: {
    fontSize: 38,
    lineHeight: 43,
  },
  heroBody: {
    color: theme.colors.text.slate,
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 620,
    marginBottom: 26,
  },
  heroBodyNarrow: {
    fontSize: 17,
    lineHeight: 26,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
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
  heroNote: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 560,
  },
  heroVisual: {
    flex: 0.92,
    alignItems: 'center',
    minWidth: 320,
  },
  deviceShadow: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 36,
    backgroundColor: '#302C28',
    padding: 10,
    shadowColor: '#62584F',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
  },
  deviceFrame: {
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  deviceStatus: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: theme.colors.background.elevated,
  },
  deviceStatusText: {
    color: theme.colors.text.primary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  deviceStatusPills: {
    flexDirection: 'row',
    gap: 5,
  },
  statusPill: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.text.primary,
  },
  statusPillShort: {
    width: 10,
    backgroundColor: theme.colors.text.secondary,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
  },
  deviceEyebrow: {
    color: theme.colors.secondary.dark,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  deviceTitle: {
    color: theme.colors.text.primary,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
  },
  deviceLock: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(63, 127, 104, 0.12)',
  },
  homePhoto: {
    height: 128,
    justifyContent: 'flex-end',
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#E7E1D6',
    overflow: 'hidden',
  },
  homeRoof: {
    alignSelf: 'center',
    width: 142,
    height: 42,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: theme.colors.primary.dark,
  },
  homeBody: {
    alignSelf: 'center',
    width: 192,
    height: 74,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 12,
    borderTopLeftRadius: theme.borderRadius.sm,
    borderTopRightRadius: theme.borderRadius.sm,
    backgroundColor: '#F9FAFB',
  },
  homeWindow: {
    width: 30,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#C9DBE8',
    borderWidth: 1,
    borderColor: '#9FB8C9',
  },
  homeDoor: {
    width: 34,
    height: 48,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: theme.colors.secondary.main,
  },
  deviceSectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    marginBottom: 6,
  },
  deviceSectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  deviceSectionMeta: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  recordRow: {
    flexDirection: 'row',
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  recordIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(40, 80, 106, 0.09)',
  },
  recordCopy: {
    flex: 1,
    minWidth: 0,
  },
  recordLabel: {
    color: theme.colors.text.primary,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    marginBottom: 2,
  },
  recordDetail: {
    color: theme.colors.text.slate,
    fontSize: 12,
    lineHeight: 17,
  },
  deviceFooter: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.background.elevated,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
  },
  deviceFooterText: {
    color: theme.colors.primary.dark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  compareSection: {
    flexDirection: 'row',
    gap: 36,
    alignItems: 'flex-start',
    marginBottom: 54,
  },
  compareNarrow: {
    flexDirection: 'column',
    gap: 22,
  },
  compareIntro: {
    flex: 0.95,
    minWidth: 0,
  },
  sectionKicker: {
    color: theme.colors.secondary.dark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 10,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '800',
  },
  compareGrid: {
    flex: 1.25,
    flexDirection: 'row',
    gap: 16,
  },
  compareGridNarrow: {
    width: '100%',
    flexDirection: 'column',
  },
  recordColumn: {
    flex: 1,
    gap: 12,
  },
  recordColumnTitle: {
    color: theme.colors.error.dark,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  recordColumnTitleOrganized: {
    color: theme.colors.accent.dark,
  },
  recordColumnRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  recordColumnText: {
    flex: 1,
    color: theme.colors.text.slate,
    fontSize: 14,
    lineHeight: 20,
  },
  essentialsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    paddingTop: 30,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.subtle,
    marginBottom: 46,
  },
  essentialRow: {
    flexBasis: 300,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  essentialIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  essentialCopy: {
    flex: 1,
    minWidth: 0,
  },
  essentialTitle: {
    color: theme.colors.text.primary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    marginBottom: 5,
  },
  essentialBody: {
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
