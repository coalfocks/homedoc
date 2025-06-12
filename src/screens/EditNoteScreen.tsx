import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Text, Button, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../utils/theme';
import { useNote } from '../hooks/useData';
import { supabase } from '../lib/supabase';

type EditNoteScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditNote'>;
  route: RouteProp<RootStackParamList, 'EditNote'>;
};

const EditNoteScreen: React.FC<EditNoteScreenProps> = ({
  navigation,
  route,
}) => {
  const { note, loading, error } = useNote(route.params.noteId);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setImages(note.images || []);
    }
  }, [note]);

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

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      const { error: updateError } = await supabase
        .from('notes')
        .update({ title, content, images })
        .eq('id', note.id);

      if (updateError) throw updateError;

      navigation.goBack();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
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
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleAddImage}
            >
              <Text style={styles.addImageText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          disabled={saving || !title}
          buttonStyle={{
            backgroundColor: theme.colors.accent,
          }}
        />
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          type="outline"
          containerStyle={styles.cancelButton}
        />
        {saveError && <Text style={styles.errorText}>{saveError}</Text>}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    color: theme.colors.text,
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
    backgroundColor: theme.colors.error,
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
    backgroundColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.gray,
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 32,
    color: theme.colors.gray,
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
  errorText: {
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
});

export default EditNoteScreen;
