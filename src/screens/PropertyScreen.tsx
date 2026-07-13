import React from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAreas, useProperty } from '../hooks/useData';
import { useBilling } from '../hooks/useBilling';
import { supabase } from '../lib/supabase';
import {
  AddButton,
  EmptyStateCard,
  MetricPill,
  PageHeader,
  Screen,
  SectionTitle,
} from '../components/AppChrome';
import { theme } from '../utils/theme';

type PropertyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Property'>;
  route: RouteProp<RootStackParamList, 'Property'>;
};

const PropertyScreen: React.FC<PropertyScreenProps> = ({
  navigation,
  route,
}) => {
  const { property, loading, error } = useProperty(route.params.propertyId);
  const { areas } = useAreas(route.params.propertyId);
  const { isPro } = useBilling();

  if (loading) {
    return (
      <Screen>
        <PageHeader
          eyebrow="PROPERTY DETAIL"
          title="Loading property"
          subtitle="Pulling rooms, notes, and photos together."
        />
      </Screen>
    );
  }

  if (error || !property) {
    return (
      <Screen>
        <EmptyStateCard
          icon="home"
          title="Property not available"
          description={error || 'This property could not be found.'}
        />
      </Screen>
    );
  }

  const confirmDeleteProperty = () => {
    Alert.alert(
      'Delete property',
      `Delete "${property.name}" and everything attached to it? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error: deleteError } = await supabase
              .from('properties')
              .delete()
              .eq('id', property.id);

            if (!deleteError) {
              navigation.navigate('Main');
            }
          },
        },
      ],
    );
  };

  const heroTitle = property.nickname || property.name;

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="PROPERTY DETAIL"
        title={heroTitle}
        subtitle={`${property.address_line_1}${property.address_line_2 ? `, ${property.address_line_2}` : ''}\n${property.city}, ${property.state} ${property.zip_code}`}
        actionLabel="Edit"
        onActionPress={() =>
          navigation.navigate('EditProperty', { propertyId: property.id })
        }
      />

      {property.image_url ? (
        <Image
          source={{ uri: property.image_url }}
          style={styles.heroImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.heroFallback}>
          <Text style={styles.heroFallbackText}>
            {heroTitle.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.metricRow}>
        <MetricPill label="Areas" value={areas.length.toString()} />
      </View>

      <View style={styles.actionStrip}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('TransferProperty', {
              propertyId: property.id,
              mode: 'share',
            })
          }
        >
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('TransferProperty', {
              propertyId: property.id,
              mode: 'transfer',
            })
          }
        >
          <Text style={styles.actionButtonText}>Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={confirmDeleteProperty}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {!isPro ? (
        <TouchableOpacity
          style={styles.handoffCard}
          onPress={() => navigation.navigate('Upgrade')}
          activeOpacity={0.86}
        >
          <View style={styles.handoffBadge}>
            <Text style={styles.handoffBadgeText}>PRO</Text>
          </View>
          <Text style={styles.handoffTitle}>Build a home handoff packet</Text>
          <Text style={styles.handoffBody}>
            Package rooms, notes, maintenance plans, and ownership transfer into
            something a buyer, tenant, or property manager can actually use.
          </Text>
          <Text style={styles.handoffAction}>See Pro</Text>
        </TouchableOpacity>
      ) : null}

      <SectionTitle
        title="Areas in this property"
        subtitle="Build a reliable inventory of rooms, systems, and spaces."
      />

      <AddButton
        label="Add area"
        onPress={() =>
          navigation.navigate('CreateArea', { propertyId: property.id })
        }
      />

      {areas.length === 0 ? (
        <EmptyStateCard
          icon="area"
          title="No areas yet"
          description="Add the key spaces first: kitchen, utility room, bathrooms, garage, attic, whatever will matter later."
          actionLabel="Add the first area"
          onActionPress={() =>
            navigation.navigate('CreateArea', { propertyId: property.id })
          }
        />
      ) : (
        <View style={styles.list}>
          {areas.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigation.navigate('Area', { areaId: item.id })}
              style={styles.card}
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.areaImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.areaFallback}>
                  <Text style={styles.areaFallbackText}>
                    {item.name?.slice(0, 1)?.toUpperCase() || 'A'}
                  </Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('EditArea', { areaId: item.id })
                    }
                  >
                    <Text style={styles.cardAction}>Edit</Text>
                  </TouchableOpacity>
                </View>
                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : (
                  <Text style={styles.cardDescriptionMuted}>
                    Add a description so future-you knows what belongs here.
                  </Text>
                )}
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
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.primary.light,
    marginBottom: theme.spacing.lg,
  },
  heroFallbackText: {
    color: theme.colors.primary.contrast,
    fontSize: 48,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  actionStrip: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  handoffCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary.dark,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
  },
  handoffBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginBottom: theme.spacing.sm,
  },
  handoffBadgeText: {
    color: theme.colors.primary.contrast,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  handoffTitle: {
    color: theme.colors.primary.contrast,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  handoffBody: {
    color: 'rgba(255,255,255,0.82)',
    lineHeight: theme.typography.body2.lineHeight,
    marginBottom: theme.spacing.sm,
  },
  handoffAction: {
    color: theme.colors.secondary.light,
    fontWeight: '800',
  },
  actionButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(31, 77, 107, 0.08)',
  },
  actionButtonText: {
    color: theme.colors.primary.dark,
    fontWeight: '700',
  },
  deleteButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(200, 85, 61, 0.10)',
  },
  deleteButtonText: {
    color: theme.colors.error.dark,
    fontWeight: '700',
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
  areaImage: {
    width: '100%',
    height: 140,
  },
  areaFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    backgroundColor: 'rgba(63, 127, 104, 0.14)',
  },
  areaFallbackText: {
    color: theme.colors.accent.dark,
    fontSize: 32,
    fontWeight: '800',
  },
  cardBody: {
    padding: theme.spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '700',
  },
  cardAction: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  cardDescription: {
    color: theme.colors.text.slate,
    lineHeight: theme.typography.body2.lineHeight,
  },
  cardDescriptionMuted: {
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.body2.lineHeight,
  },
});

export default PropertyScreen;
