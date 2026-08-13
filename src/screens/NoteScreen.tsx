import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNote } from '../hooks/useData';
import {
  EmptyStateCard,
  PageHeader,
  Screen,
  SectionTitle,
} from '../components/AppChrome';
import { InspectableImage } from '../components/InspectableImage';
import { theme } from '../utils/theme';
import { formatReminder } from '../utils/reminders';

type NoteScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Note'>;
  route: RouteProp<RootStackParamList, 'Note'>;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const NoteScreen: React.FC<NoteScreenProps> = ({ navigation, route }) => {
  const { note, loading, error } = useNote(route.params.noteId);

  if (loading) {
    return (
      <Screen>
        <PageHeader
          eyebrow="NOTE DETAIL"
          title="Loading note"
          subtitle="Pulling the full record and images."
        />
      </Screen>
    );
  }

  if (error || !note) {
    return (
      <Screen>
        <EmptyStateCard
          icon="note"
          title="Note not available"
          description={error || 'This note could not be found.'}
        />
      </Screen>
    );
  }

  const reminderLabel = formatReminder(note.reminder_at);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="NOTE FILE"
        title={note.title}
        subtitle={`Created ${formatDate(note.created_at)} • Updated ${formatDate(note.updated_at)}`}
        actionLabel="Edit"
        onActionPress={() =>
          navigation.navigate('EditNote', { noteId: note.id })
        }
      />

      <View style={styles.bodyCard}>
        <Text style={styles.bodyText}>{note.content}</Text>
      </View>

      {reminderLabel ? (
        <>
          <SectionTitle title="Reminder" />
          <View style={styles.reminderCard}>
            <Text style={styles.reminderLabel}>Reminder set for</Text>
            <Text style={styles.reminderValue}>{reminderLabel}</Text>
          </View>
        </>
      ) : null}

      {note.images.length > 0 ? (
        <>
          <SectionTitle
            title="Attached images"
            subtitle="Reference shots tied directly to this note."
          />
          <View style={styles.imageGrid}>
            {note.images.map((image, index) => (
              <InspectableImage
                key={`${image}-${index}`}
                imagePath={image}
                style={styles.image}
                resizeMode="cover"
                fileName={`homedoc-note-${note.id}-${index + 1}.jpg`}
              />
            ))}
          </View>
        </>
      ) : (
        <EmptyStateCard
          icon="note"
          title="No images attached"
          description="This note is text-only for now. Add photos from edit mode if the visual context matters."
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
  },
  bodyCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: theme.spacing.xl,
  },
  bodyText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.body1.fontSize,
    lineHeight: theme.typography.body1.lineHeight,
  },
  reminderCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(40, 80, 106, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(40, 80, 106, 0.14)',
    marginBottom: theme.spacing.xl,
  },
  reminderLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  reminderValue: {
    color: theme.colors.primary.dark,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '800',
  },
  imageGrid: {
    gap: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: 210,
    borderRadius: theme.borderRadius.md,
  },
});

export default NoteScreen;
