import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, Button, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockProperties } from '../mock/data';
import { theme } from '../utils/theme';

type EditNoteScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditNote'>;
  route: RouteProp<RootStackParamList, 'EditNote'>;
};

const EditNoteScreen: React.FC<EditNoteScreenProps> = ({ navigation, route }) => {
  const note = mockProperties
    .flatMap((p) => p.areas)
    .flatMap((a) => a.notes)
    .find((n) => n.id === route.params.noteId);

  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [images, setImages] = useState<string[]>(note?.images || []);

  if (!note) {
    return (
      <View style={styles.container}>
        <Text>Note not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    // In a real app, this would update the note in the database
    console.log('Saving note:', { title, content, images });
    navigation.goBack();
  };

  const handleAddImage = () => {
    // In a real app, this would open the image picker
    console.log('Add image pressed');
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter note title"
          inputContainerStyle={styles.inputContainer}
        />
        <Input
          label="Content"
          value={content}
          onChangeText={setContent}
          placeholder="Enter note content"
          multiline
          numberOfLines={4}
          inputContainerStyle={styles.inputContainer}
        />
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Images</Text>
          <View style={styles.imageContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
              <Text style={styles.addImageText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          buttonStyle={{
            backgroundColor: theme.colors.accent.main,
          }}
        />
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          type="outline"
          containerStyle={styles.cancelButton}
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
  form: {
    padding: theme.spacing.md,
  },
  imageSection: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
  },
  removeImage: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: theme.colors.error.main,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.neutral[500],
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 32,
    color: theme.colors.neutral[500],
  },
  buttonContainer: {
    padding: theme.spacing.md,
  },
  cancelButton: {
    marginTop: theme.spacing.sm,
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
});

export default EditNoteScreen; 