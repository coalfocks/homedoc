import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
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
} from '../components/AppChrome';
import { UpgradeCard } from '../components/UpgradeCard';
import { theme } from '../utils/theme';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, loading: authLoading } = useAuth();
  const { properties, loading, error, refetch } = useProperties(user?.id);
  const { isPro, checkoutLoading } = useBilling();

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
          eyebrow="YOUR HOME BASE"
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
        eyebrow="YOUR HOME BASE"
        title="Properties"
        subtitle="The homes you manage, with room-by-room records ready whenever something breaks."
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
        title="Your places"
        subtitle="Open a property to manage rooms, maintenance notes, and photos."
      />

      <AddButton
        label={
          hasReachedFreePropertyLimit ? 'Add another with Pro' : 'Add property'
        }
        onPress={handleAddProperty}
      />

      {properties.length === 0 ? (
        <EmptyStateCard
          icon="home"
          title="No properties yet"
          description="Start with the main house, rental, or cabin you actually need to remember details for."
          actionLabel="Add your first property"
          onActionPress={handleAddProperty}
        />
      ) : (
        <View style={styles.list}>
          {properties.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              onPress={() =>
                navigation.navigate('Property', { propertyId: item.id })
              }
              style={styles.card}
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
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
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Property</Text>
                  </View>
                </View>
                <Text style={styles.address}>
                  {item.address_line_1}
                  {item.address_line_2 ? `, ${item.address_line_2}` : ''}
                </Text>
                <Text style={styles.address}>
                  {item.city}, {item.state} {item.zip_code}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
    marginBottom: theme.spacing.xl,
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
  list: {
    gap: theme.spacing.md,
  },
  card: {
    overflow: 'hidden',
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.md,
  },
  propertyImage: {
    width: '100%',
    height: 190,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 190,
    backgroundColor: theme.colors.primary.light,
  },
  imageFallbackText: {
    color: theme.colors.primary.contrast,
    fontSize: 40,
    fontWeight: '800',
  },
  cardBody: {
    padding: theme.spacing.lg,
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
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '700',
  },
  cardSubtitle: {
    marginTop: 2,
    color: theme.colors.text.secondary,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(31, 77, 107, 0.08)',
  },
  badgeText: {
    color: theme.colors.primary.dark,
    fontSize: 11,
    fontWeight: '700',
  },
  address: {
    color: theme.colors.text.slate,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
  },
});

export default HomeScreen;
