import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Keyboard,
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
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../components/Icon';
import { SignedImage } from '../components/SignedImage';
import { uploadPrivateImage } from '../utils/privateImages';

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
      setContent(note.content || '');
      setImages(note.images || []);
    }
  }, [note]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages([...images, ...newImages]);
    }
  };

  const uploadImages = async (uris: string[]) => {
    try {
      const uploadPromises = uris.map(async (uri, index) => {
        // Only upload if it's a local URI (not already uploaded)
        if (uri.startsWith('file://') || uri.startsWith('content://')) {
          return uploadPrivateImage(uri, `notes/${note?.area_id}/${index}`);
        }
        return uri; // Return existing URL as-is
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

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

      let imageUrls = await uploadImages(images);

      const { error: updateError } = await supabase
        .from('notes')
        .update({ title, content, images: imageUrls })
        .eq('id', note.id);

      if (updateError) throw updateError;

      navigation.goBack();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <ScrollView
      style={styles.container}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={Keyboard.dismiss}
    >
      <View style={styles.content}>
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter note title"
          placeholderTextColor="#666"
          containerStyle={styles.inputContainer}
          inputStyle={styles.input}
          labelStyle={styles.label}
        />
        <Input
          label="Content"
          value={content}
          onChangeText={setContent}
          placeholder="Enter note content"
          placeholderTextColor="#666"
          multiline
          numberOfLines={6}
          containerStyle={styles.inputContainer}
          inputStyle={[styles.input, styles.textArea]}
          labelStyle={styles.label}
        />
        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Images</Text>
          <View style={styles.imageContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <SignedImage imagePath={image} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Text style={styles.removeImageIcon}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Icon name="add" color="#FFFFFF" size={32} />
              <Text style={styles.addImageText}>Add Images</Text>
            </TouchableOpacity>
          </View>
        </View>

        {saveError && <Text style={styles.errorText}>{saveError}</Text>}

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          disabled={saving || !title}
          containerStyle={styles.buttonContainer}
          buttonStyle={[
            styles.button,
            (saving || !title) && styles.disabledButton,
          ]}
          titleStyle={[
            styles.buttonText,
            (saving || !title) && styles.disabledButtonText,
          ]}
          disabledStyle={styles.disabledButton}
          disabledTitleStyle={styles.disabledButtonText}
        />
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          type="outline"
          containerStyle={styles.cancelButton}
          buttonStyle={styles.cancelButtonStyle}
          titleStyle={styles.cancelButtonText}
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
  content: {
    padding: 16,
  },
  inputContainer: {
    paddingHorizontal: 16,
  },
  input: {
    color: theme.colors.text.primary,
    fontSize: 16,
    paddingHorizontal: 16,
  },
  textArea: {
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: 16,
    marginBottom: 8,
  },
  imageSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: '47%',
    aspectRatio: 1,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.error.main,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.strong,
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  button: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: 8,
    height: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary.contrast,
  },
  disabledButton: {
    backgroundColor: theme.colors.background.paper,
    opacity: 0.7,
  },
  disabledButtonText: {
    color: theme.colors.text.disabled,
  },
  cancelButton: {
    marginTop: 12,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  cancelButtonStyle: {
    borderColor: theme.colors.primary.main,
    borderRadius: 8,
    height: 50,
  },
  cancelButtonText: {
    color: theme.colors.primary.main,
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default EditNoteScreen;
