import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAllAreas, useAssignedContractorAreas } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import {
  EmptyStateCard,
  LoadingStateCard,
  MetricPill,
  PageHeader,
  Screen,
  SectionTitle,
  StatusBanner,
} from '../components/AppChrome';
import { theme } from '../utils/theme';

type AreasScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const AreasScreen: React.FC<AreasScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { areas, loading, error } = useAllAreas(user?.id);
  const {
    assignments,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useAssignedContractorAreas(user?.id);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="ROOM BY ROOM"
        title="Areas"
        subtitle="Every kitchen, crawl space, utility closet, and weird hallway that needs its own paper trail."
      />

      <View style={styles.metricRow}>
        <MetricPill label="Tracked areas" value={areas.length.toString()} />
      </View>

      <StatusBanner
        title="Add new areas from inside a property"
        body="Areas stay attached to a specific home, so creation happens from the property detail screen instead of this rollup view."
      />

      {assignments.length > 0 || assignmentsLoading || assignmentsError ? (
        <>
          <SectionTitle
            title="Contractor work"
            subtitle="Areas where a homeowner has invited you to document work."
          />
          {assignmentsLoading ? (
            <LoadingStateCard title="Loading contractor assignments..." />
          ) : assignmentsError ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Couldn’t load assignments</Text>
              <Text style={styles.noticeBody}>{assignmentsError}</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {assignments.map((assignment: any) => {
                const assignedArea = assignment.areas;
                if (!assignedArea) return null;
                return (
                  <TouchableOpacity
                    key={assignment.id}
                    onPress={() =>
                      navigation.navigate('Area', { areaId: assignedArea.id })
                    }
                    style={styles.contractorCard}
                  >
                    <View style={styles.cardBody}>
                      <View style={styles.contractorTopRow}>
                        <Text style={styles.cardTitle}>
                          {assignedArea.name}
                        </Text>
                        {assignment.verification_status === 'verified' ? (
                          <Text style={styles.verifiedPill}>Verified</Text>
                        ) : null}
                      </View>
                      <Text style={styles.cardProperty}>
                        {assignedArea.properties?.name || 'Assigned property'}
                      </Text>
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        Add work notes, photos, materials, and closeout details
                        for the homeowner.
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      ) : null}

      <SectionTitle
        title="All areas"
        subtitle="Jump straight into any room without remembering which property it belongs to."
      />

      {loading ? (
        <LoadingStateCard title="Loading areas..." />
      ) : error ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Couldn’t load areas</Text>
          <Text style={styles.noticeBody}>{error}</Text>
        </View>
      ) : areas.length === 0 ? (
        <EmptyStateCard
          icon="area"
          title="No areas yet"
          description="Open a property and add the rooms or zones you actually want to document."
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
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardProperty}>
                  {item.properties?.name || 'Property'}
                </Text>
                {item.description ? (
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
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
    paddingBottom: 100,
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
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.md,
  },
  areaImage: {
    width: 120,
    height: 120,
  },
  areaFallback: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(63, 127, 104, 0.14)',
  },
  areaFallbackText: {
    color: theme.colors.accent.dark,
    fontSize: 28,
    fontWeight: '800',
  },
  cardBody: {
    flex: 1,
    padding: theme.spacing.md,
    justifyContent: 'center',
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '700',
  },
  cardProperty: {
    marginTop: 2,
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
  contractorCard: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(31, 77, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(31, 77, 107, 0.16)',
    ...theme.shadows.sm,
  },
  contractorTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  verifiedPill: {
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(47, 133, 90, 0.12)',
    color: theme.colors.success.dark,
    fontSize: 11,
    fontWeight: '800',
  },
  cardDescription: {
    marginTop: theme.spacing.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.body2.lineHeight,
  },
});

export default AreasScreen;
