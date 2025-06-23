import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../utils/theme';
import { useNote } from '../hooks/useData';

type NoteScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Note'>;
  route: RouteProp<RootStackParamList, 'Note'>;
};

const NoteScreen: React.FC<NoteScreenProps> = ({ navigation, route }) => {
  const { note, loading, error } = useNote(route.params.noteId);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading note...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  if (!note) {
    return (
      <View style={styles.container}>
        <Text>Note not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{note.title}</Text>
        <Text style={styles.date}>
          Created: {new Date(note.created_at).toLocaleDateString()}
        </Text>
        <Text style={styles.date}>
          Updated: {new Date(note.updated_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.text}>{note.content}</Text>
        {note.images.length > 0 && (
          <View style={styles.imageContainer}>
            {note.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </View>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Edit Note"
          onPress={() => navigation.navigate('EditNote', { noteId: note.id })}
          buttonStyle={{
            backgroundColor: theme.colors.accent.main,
          }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary.main,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  date: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.caption.fontSize,
    marginBottom: theme.spacing.xs,
  },
  content: {
    padding: theme.spacing.md,
  },
  text: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  imageContainer: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  buttonContainer: {
    padding: theme.spacing.md,
  },
});

export default NoteScreen;
