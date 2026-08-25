import React from 'react';
import {
  Image,
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
const recordPhotoUrl =
  'https://images.unsplash.com/photo-1676210134188-4c05dd172f89?auto=format&fit=crop&w=900&q=80';

const marketingPalette = {
  ink: '#173B35',
  inkDark: '#102B28',
  inkSoft: '#E0E9E3',
  orange: '#D95F26',
  orangeDark: '#A9471F',
  orangeSoft: '#F6DED0',
  paper: '#FAF7F1',
  paperWarm: '#F3E9DD',
  clay: '#8B5138',
  slate: '#31433F',
};

const openUrl = (url: string) => {
  Linking.openURL(url).catch(() => undefined);
};

const previewRecords = [
  {
    icon: 'camera' as const,
    label: 'Kitchen sink',
    detail: 'Shutoff location, disposal model, plumber note',
    tone: 'orange' as const,
  },
  {
    icon: 'area' as const,
    label: 'Utility room',
    detail: 'Main shutoff photo, filter size, service history',
    tone: 'green' as const,
  },
  {
    icon: 'todo' as const,
    label: 'Inspection follow-up',
    detail: 'GFCI outlet, gutter extension, crawlspace vapor barrier',
    tone: 'clay' as const,
  },
];

const messyRecords = [
  'Paint colors buried in text threads',
  'Warranty photos lost in camera rolls',
  'Contractor details split across messages',
  'Inspection PDFs detached from the property',
];

const organizedRecords = [
  'Room-by-room records with photos and notes',
  'Product and warranty details tied to the property',
  'Scoped context for contractors and repairs',
  'A clean handoff when ownership or management changes',
];

const essentials = [
  {
    icon: 'home' as const,
    title: 'A durable property record',
    body: 'Rooms, projects, repairs, photos, products, and documents stay connected to the place they belong.',
    tone: 'orange' as const,
  },
  {
    icon: 'lock' as const,
    title: 'Private by default',
    body: 'Keep the full record private, then share only the room, repair, or handoff context someone else needs.',
    tone: 'green' as const,
  },
  {
    icon: 'swap-horiz' as const,
    title: 'Built for the next request',
    body: 'Find the detail again for touch-ups, repairs, rentals, sales, insurance, and new contractors.',
    tone: 'clay' as const,
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
          <Icon name="lock" size={14} color={marketingPalette.orangeDark} />
        </View>
      </View>

      <View style={styles.homePhoto}>
        <Image
          source={{ uri: recordPhotoUrl }}
          style={styles.recordPhoto}
          resizeMode="cover"
        />
        <View style={styles.photoBadge}>
          <Icon name="camera" size={13} color={marketingPalette.inkDark} />
          <Text style={styles.photoBadgeText}>Kitchen sink record</Text>
        </View>
      </View>

      <View style={styles.deviceSectionHeader}>
        <Text style={styles.deviceSectionTitle}>Records worth keeping</Text>
        <Text style={styles.deviceSectionMeta}>Updated today</Text>
      </View>

      {previewRecords.map((record) => (
        <View
          key={record.label}
          style={[
            styles.recordRow,
            record.tone === 'green' && styles.recordRowGreen,
            record.tone === 'clay' && styles.recordRowClay,
          ]}
        >
          <View
            style={[
              styles.recordIcon,
              record.tone === 'green' && styles.recordIconGreen,
              record.tone === 'clay' && styles.recordIconClay,
            ]}
          >
            <Icon
              name={record.icon}
              size={17}
              color={marketingPalette.inkDark}
            />
          </View>
          <View style={styles.recordCopy}>
            <Text style={styles.recordLabel}>{record.label}</Text>
            <Text style={styles.recordDetail}>{record.detail}</Text>
          </View>
        </View>
      ))}

      <View style={styles.deviceFooter}>
        <Icon name="download" size={15} color={marketingPalette.inkDark} />
        <Text style={styles.deviceFooterText}>Exportable handoff packet</Text>
      </View>
    </View>
  </View>
);

const RecordColumn = ({
  title,
  items,
  tone,
  isNarrow,
}: {
  title: string;
  items: string[];
  tone: 'messy' | 'organized';
  isNarrow: boolean;
}) => (
  <View
    style={[
      styles.recordColumn,
      isNarrow && styles.recordColumnNarrow,
      tone === 'messy'
        ? styles.recordColumnMessy
        : styles.recordColumnOrganized,
    ]}
  >
    <View
      style={[
        styles.recordColumnStripe,
        tone === 'organized' && styles.recordColumnStripeOrganized,
      ]}
    />
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
  tone,
}: {
  icon: React.ComponentProps<typeof Icon>['name'];
  title: string;
  body: string;
  tone: 'orange' | 'green' | 'clay';
}) => (
  <View style={styles.essentialRow}>
    <View
      style={[
        styles.essentialIcon,
        tone === 'green' && styles.essentialIconGreen,
        tone === 'clay' && styles.essentialIconClay,
      ]}
    >
      <Icon name={icon} size={19} color={marketingPalette.inkDark} />
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
          <Logo size={34} color={marketingPalette.ink} />
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
          <Text style={styles.kicker}>
            Home records that survive the handoff
          </Text>
          <Text style={[styles.heroTitle, isNarrow && styles.heroTitleNarrow]}>
            Give every property a memory that lasts.
          </Text>
          <Text style={[styles.heroBody, isNarrow && styles.heroBodyNarrow]}>
            HomeDoc keeps repairs, room notes, photos, appliance details,
            contractor context, and handoff records in one private place.
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
                Open existing invite
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroNote}>
            Designed for owners, landlords, remodels, rentals, and property
            handoffs.
          </Text>
        </View>

        <View style={styles.heroVisual}>
          <AppPreview />
        </View>
      </View>

      <View style={[styles.compareSection, isNarrow && styles.compareNarrow]}>
        <View
          style={[styles.compareIntro, isNarrow && styles.compareIntroNarrow]}
        >
          <Text style={styles.sectionTitle}>
            Every property creates a trail. HomeDoc makes it usable.
          </Text>
        </View>
        <View
          style={[styles.compareGrid, isNarrow && styles.compareGridNarrow]}
        >
          <RecordColumn
            title="Where details live now"
            items={messyRecords}
            tone="messy"
            isNarrow={isNarrow}
          />
          <RecordColumn
            title="Where HomeDoc puts them"
            items={organizedRecords}
            tone="organized"
            isNarrow={isNarrow}
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
            tone={item.tone}
          />
        ))}
      </View>

      <View style={[styles.betaBand, isNarrow && styles.betaBandNarrow]}>
        <View style={styles.betaCopy}>
          <Text style={styles.betaTitle}>Start with one real property.</Text>
          <Text style={styles.betaBody}>
            The beta is built for people who already have inspections, repairs,
            contractor texts, photos, warranties, or project notes worth
            keeping.
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
    backgroundColor: marketingPalette.paper,
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
    color: marketingPalette.inkDark,
    fontSize: 19,
    lineHeight: 22,
    fontWeight: '800',
  },
  brandTag: {
    color: marketingPalette.clay,
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
    borderColor: '#D8CABD',
    backgroundColor: '#FFFFFF',
  },
  navButtonText: {
    color: marketingPalette.inkDark,
    fontWeight: '700',
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 54,
    marginHorizontal: -24,
    paddingHorizontal: 28,
    paddingVertical: 42,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    backgroundColor: marketingPalette.inkDark,
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
    color: '#F2BA85',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 16,
  },
  heroTitle: {
    color: theme.colors.text.inverse,
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
    color: 'rgba(255, 255, 255, 0.80)',
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
    backgroundColor: marketingPalette.orange,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  secondaryAction: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  secondaryActionText: {
    color: theme.colors.text.inverse,
    fontWeight: '800',
  },
  heroNote: {
    color: 'rgba(255, 255, 255, 0.66)',
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
    backgroundColor: marketingPalette.ink,
    padding: 10,
    shadowColor: '#0B211E',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.3,
    shadowRadius: 34,
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
    backgroundColor: '#FCFAF6',
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
    color: marketingPalette.orangeDark,
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
    backgroundColor: marketingPalette.orangeSoft,
  },
  homePhoto: {
    height: 146,
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#D9D0C4',
    overflow: 'hidden',
  },
  recordPhoto: {
    width: '100%',
    height: '100%',
  },
  photoBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
  },
  photoBadgeText: {
    color: marketingPalette.inkDark,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
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
    borderTopColor: '#E6DDD2',
    backgroundColor: '#FFFFFF',
  },
  recordRowGreen: {
    backgroundColor: 'rgba(63, 127, 104, 0.05)',
  },
  recordRowClay: {
    backgroundColor: 'rgba(139, 81, 56, 0.08)',
  },
  recordIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: marketingPalette.orangeSoft,
  },
  recordIconGreen: {
    backgroundColor: 'rgba(63, 127, 104, 0.12)',
  },
  recordIconClay: {
    backgroundColor: 'rgba(139, 81, 56, 0.13)',
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
    backgroundColor: '#FCFAF6',
    borderTopWidth: 1,
    borderTopColor: '#E6DDD2',
  },
  deviceFooterText: {
    color: marketingPalette.inkDark,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  compareSection: {
    flexDirection: 'row',
    gap: 36,
    alignItems: 'flex-start',
    marginHorizontal: -24,
    paddingHorizontal: 24,
    paddingVertical: 34,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(23, 59, 53, 0.16)',
    backgroundColor: marketingPalette.inkSoft,
    marginBottom: 54,
  },
  compareNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 22,
  },
  compareIntro: {
    flex: 0.95,
    minWidth: 0,
  },
  compareIntroNarrow: {
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
  },
  sectionTitle: {
    color: marketingPalette.inkDark,
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
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
  },
  recordColumn: {
    flex: 1,
    gap: 12,
    overflow: 'hidden',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 18,
    borderWidth: 1,
    borderColor: '#D3C7BA',
    backgroundColor: '#FFFFFF',
  },
  recordColumnNarrow: {
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
  },
  recordColumnMessy: {
    backgroundColor: 'rgba(217, 95, 38, 0.06)',
  },
  recordColumnOrganized: {
    backgroundColor: 'rgba(63, 127, 104, 0.06)',
  },
  recordColumnStripe: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: marketingPalette.orange,
  },
  recordColumnStripeOrganized: {
    backgroundColor: theme.colors.accent.main,
  },
  recordColumnTitle: {
    color: marketingPalette.orangeDark,
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
    marginHorizontal: -24,
    paddingHorizontal: 24,
    paddingVertical: 26,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(139, 81, 56, 0.20)',
    backgroundColor: marketingPalette.paperWarm,
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
    backgroundColor: marketingPalette.orangeSoft,
    borderWidth: 1,
    borderColor: 'rgba(217, 95, 38, 0.22)',
  },
  essentialIconGreen: {
    backgroundColor: 'rgba(63, 127, 104, 0.12)',
    borderColor: 'rgba(63, 127, 104, 0.24)',
  },
  essentialIconClay: {
    backgroundColor: 'rgba(139, 81, 56, 0.12)',
    borderColor: 'rgba(139, 81, 56, 0.24)',
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
    backgroundColor: marketingPalette.inkDark,
    borderWidth: 1,
    borderColor: 'rgba(16, 43, 40, 0.28)',
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
  betaTitle: {
    color: theme.colors.text.inverse,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    marginBottom: 8,
  },
  betaBody: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 720,
  },
  betaButton: {
    minHeight: 46,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
  },
  betaButtonText: {
    color: marketingPalette.inkDark,
    fontWeight: '800',
  },
  footerSpacer: {
    height: 28,
  },
});
