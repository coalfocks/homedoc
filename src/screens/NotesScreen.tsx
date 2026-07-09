import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAllNotes } from '../hooks/useData';
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

type NotesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const NotesScreen: React.FC<NotesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { notes, loading, error } = useAllNotes(user?.id);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="THE PAPER TRAIL"
        title="Notes"
        subtitle="Maintenance records, measurements, reminders, and the tiny details you’ll absolutely forget six months from now."
      />

      <View style={styles.metricRow}>
        <MetricPill label="Saved notes" value={notes.length.toString()} />
      </View>

      <StatusBanner
        title="Create notes from inside an area"
        body="Notes belong to a specific room or zone, so this screen is a library view, not the place new notes start."
      />

      <SectionTitle
        title="Recent notes"
        subtitle="Open any entry to review the full detail and attached images."
      />

      {loading ? (
        <LoadingStateCard title="Loading notes..." />
      ) : error ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Couldn’t load notes</Text>
          <Text style={styles.noticeBody}>{error}</Text>
        </View>
      ) : notes.length === 0 ? (
        <EmptyStateCard
          icon="note"
          title="No notes yet"
          description="Once you add notes inside an area, they’ll show up here as a clean timeline."
        />
      ) : (
        <View style={styles.list}>
          {notes.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigation.navigate('Note', { noteId: item.id })}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardLocation}>
                    {item.areas?.properties?.name || 'Property'}
                    {' • '}
                    {item.areas?.name || 'Area'}
                  </Text>
                </View>
                <Text style={styles.cardDate}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
              <Text style={styles.cardContent} numberOfLines={3}>
                {item.content}
              </Text>
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
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.md,
  },
  cardTop: {
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
  cardLocation: {
    marginTop: 4,
    color: theme.colors.primary.main,
    fontSize: theme.typography.body2.fontSize,
    fontWeight: '600',
  },
  cardDate: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.caption.fontSize,
  },
  cardContent: {
    color: theme.colors.text.slate,
    lineHeight: theme.typography.body1.lineHeight,
  },
});

export default NotesScreen;
