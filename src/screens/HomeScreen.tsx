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
  const { properties, loading, error } = useProperties(user?.id);
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
        <PageHeader title="Properties" subtitle="Loading your properties." />
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
        title="Properties"
        subtitle="Your homes and property records."
      />

      <View style={styles.metricRow}>
        <MetricPill label="Properties" value={properties.length.toString()} />
        <MetricPill label="Known areas" value={totalAreas.toString()} />
      </View>

      {error ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>We hit a sync snag</Text>
          <Text style={styles.noticeBody}>{error}</Text>
        </View>
      ) : null}

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
          description="Add the home you live in, rent out, or help maintain."
          actionLabel="Add your first property"
          onActionPress={handleAddProperty}
        />
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
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle}>
                      {item.nickname || item.name}
                    </Text>
                    {item.nickname ? (
                      <Text style={styles.cardSubtitle}>{item.name}</Text>
                    ) : null}
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

      <View style={styles.secondaryContent}>
        {!isPro && properties.length > 0 ? (
          <UpgradeCard
            compact
            title="Add more properties with Pro"
            body="Your first property is free."
            cta="See Pro"
            loading={checkoutLoading}
            onPress={() => navigation.navigate('Upgrade')}
          />
        ) : null}

        <BetaFeedbackCard
          context="Properties"
          compact
          title={betaAccess ? 'Beta access' : 'Share beta feedback'}
          body={
            betaAccess
              ? 'Pro features are included during the beta. Feedback is welcome.'
              : 'Tell us what is working and what feels unclear.'
          }
        />
      </View>
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
  list: {
    gap: theme.spacing.md,
  },
  secondaryContent: {
    marginTop: theme.spacing.xl,
  },
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  propertyImage: {
    width: 112,
    height: 112,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 112,
    height: 112,
    backgroundColor: 'rgba(23, 59, 53, 0.12)',
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
  cardTitleWrap: {
    flex: 1,
    marginBottom: theme.spacing.xs,
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
  address: {
    color: theme.colors.text.slate,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
  },
});

export default HomeScreen;
