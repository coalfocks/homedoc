import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useProperties } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { useBilling } from '../hooks/useBilling';
import {
  AddButton,
  EmptyStateCard,
  MetricPill,
  PageHeader,
  Screen,
  SectionTitle,
  SortControl,
} from '../components/AppChrome';
import { BetaFeedbackCard } from '../components/BetaFeedbackCard';
import { SignedImage } from '../components/SignedImage';
import { UpgradeCard } from '../components/UpgradeCard';
import { formatAddressLines } from '../utils/address';
import { SortOrder, sortRecords } from '../utils/sortRecords';
import { theme } from '../utils/theme';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, loading: authLoading } = useAuth();
  const { properties, loading, error, refetch } = useProperties(user?.id);
  const { isPro, betaAccess, checkoutLoading } = useBilling();
  const [sortOrder, setSortOrder] = useState<SortOrder>('alphabetical');
  const sortedProperties = useMemo(
    () =>
      sortRecords(
        properties,
        sortOrder,
        (property: any) => property.nickname || property.name,
      ),
    [properties, sortOrder],
  );

  const totalAreas = properties.reduce(
    (sum, property: any) => sum + (property.area_count ?? 0),
    0,
  );
  const hasReachedFreePropertyLimit = !isPro && properties.length >= 1;
  const handleAddProperty = () => {
    if (hasReachedFreePropertyLimit) {
      navigation.navigate('Upgrade');
      return;
    }

    navigation.navigate('CreateProperty');
  };

  if (authLoading || (loading && properties.length === 0)) {
    return (
      <Screen>
        <PageHeader
          eyebrow="HOME RECORDS"
          title="Properties"
          subtitle="Loading your homes and the records attached to them."
        />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <EmptyStateCard
          icon="home"
          title="Sign in to open your homes"
          description="HomeDoc keeps each address, room, and note tied to your account so nothing gets lost."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="HOME RECORDS"
        title="Properties"
        subtitle="The homes, rentals, and handoff records you are responsible for."
      />

      <BetaFeedbackCard
        context="Properties"
        compact
        title={betaAccess ? 'Free beta is on' : 'Beta feedback wanted'}
        body={
          betaAccess
            ? 'Pro features are included for now. Send feedback when something feels clunky or worth keeping.'
            : 'Tell us what made sense, what felt clunky, and what would make this worth keeping around.'
        }
      />

      {!isPro && properties.length > 0 ? (
        <UpgradeCard
          compact
          title="Add rentals, cabins, and family homes with Pro"
          body="Your first property is free. Upgrade when HomeDoc becomes the operating system for more than one place."
          cta="See Pro"
          loading={checkoutLoading}
          onPress={() => navigation.navigate('Upgrade')}
        />
      ) : null}

      <View style={styles.metricRow}>
        <MetricPill
          label="Properties"
          value={properties.length.toString().padStart(2, '0')}
        />
        <MetricPill
          label="Known areas"
          value={totalAreas.toString().padStart(2, '0')}
        />
      </View>

      {error ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>We hit a sync snag</Text>
          <Text style={styles.noticeBody}>{error}</Text>
        </View>
      ) : null}

      <SectionTitle
        title="Property file"
        subtitle="Open a place to manage its rooms, maintenance notes, and photos."
      />

      <AddButton
        label={
          hasReachedFreePropertyLimit ? 'Add another with Pro' : 'Add property'
        }
        onPress={handleAddProperty}
      />

      {properties.length === 0 ? (
        <>
          <View style={styles.startGuide}>
            <Text style={styles.startGuideTitle}>
              Start with one real place
            </Text>
            <Text style={styles.startGuideBody}>
              Add a property, create an area like Kitchen or Utility Room, then
              save one note or todo you would normally have to hunt for later.
            </Text>
          </View>
          <EmptyStateCard
            icon="home"
            title="No properties yet"
            description="A good beta test starts with the home you live in, rent out, or help maintain."
            actionLabel="Add your first property"
            onActionPress={handleAddProperty}
          />
        </>
      ) : (
        <View style={styles.list}>
          <SortControl
            value={sortOrder}
            onChange={setSortOrder}
            options={[
              { label: 'A-Z', value: 'alphabetical' },
              { label: 'Newest', value: 'newest' },
              { label: 'Oldest', value: 'oldest' },
            ]}
          />
          {sortedProperties.map((item: any) => {
            const addressLines = formatAddressLines(item);

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() =>
                  navigation.navigate('Property', { propertyId: item.id })
                }
                style={styles.card}
              >
                {item.image_url ? (
                  <SignedImage
                    imagePath={item.image_url}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imageFallback}>
                    <Text style={styles.imageFallbackText}>
                      {item.name?.slice(0, 1)?.toUpperCase() || 'H'}
                    </Text>
                  </View>
                )}
                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleWrap}>
                      <Text style={styles.cardTitle}>
                        {item.nickname || item.name}
                      </Text>
                      {item.nickname ? (
                        <Text style={styles.cardSubtitle}>{item.name}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.badge}>Open</Text>
                  </View>
                  {addressLines.length > 0 ? (
                    <>
                      {addressLines.map((line) => (
                        <Text key={line} style={styles.address}>
                          {line}
                        </Text>
                      ))}
                    </>
                  ) : (
                    <Text style={styles.address}>
                      Add the address when you need it.
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
  noticeCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(200, 85, 61, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(200, 85, 61, 0.18)',
  },
  noticeTitle: {
    color: theme.colors.error.dark,
    fontWeight: '700',
    marginBottom: 4,
  },
  noticeBody: {
    color: theme.colors.text.slate,
  },
  startGuide: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(40, 80, 106, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(40, 80, 106, 0.14)',
    marginBottom: theme.spacing.md,
  },
  startGuideTitle: {
    color: theme.colors.primary.dark,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  startGuideBody: {
    color: theme.colors.text.slate,
    lineHeight: theme.typography.body2.lineHeight,
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.sm,
  },
  propertyImage: {
    width: 132,
    height: 132,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 132,
    height: 132,
    backgroundColor: 'rgba(40, 80, 106, 0.12)',
  },
  imageFallbackText: {
    color: theme.colors.primary.dark,
    fontSize: 34,
    fontWeight: '800',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    padding: theme.spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '700',
  },
  cardSubtitle: {
    marginTop: 2,
    color: theme.colors.text.secondary,
  },
  badge: {
    alignSelf: 'flex-start',
    color: theme.colors.primary.dark,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '800',
  },
  address: {
    color: theme.colors.text.slate,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
  },
});

export default HomeScreen;
