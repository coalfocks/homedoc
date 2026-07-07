import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
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
import { theme } from '../utils/theme';

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

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="NOTE DETAIL"
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

      {note.images.length > 0 ? (
        <>
          <SectionTitle
            title="Attached images"
            subtitle="Reference shots tied directly to this note."
          />
          <View style={styles.imageGrid}>
            {note.images.map((image, index) => (
              <Image
                key={`${image}-${index}`}
                source={{ uri: image }}
                style={styles.image}
                resizeMode="cover"
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
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.md,
    marginBottom: theme.spacing.xl,
  },
  bodyText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.body1.fontSize,
    lineHeight: theme.typography.body1.lineHeight,
  },
  imageGrid: {
    gap: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: 210,
    borderRadius: theme.borderRadius.xl,
  },
});

export default NoteScreen;
