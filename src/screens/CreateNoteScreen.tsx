import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Keyboard,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';
import { theme } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../components/Icon';
import {
  CreationCard,
  CreationIntro,
  CreationPrompt,
  ErrorPanel,
  SubmitFooter,
} from '../components/CreationFlow';

type CreateNoteScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateNote'>;
  route: RouteProp<RootStackParamList, 'CreateNote'>;
};

const CreateNoteScreen: React.FC<CreateNoteScreenProps> = ({
  navigation,
  route,
}) => {
  const { areaId } = route.params;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedSteps =
    (title.trim() ? 1 : 0) + (content.trim() ? 1 : 0) + (images.length ? 1 : 0);

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
        const response = await fetch(uri);
        const blob = await response.blob();
        const filename = `notes/${areaId}/${Date.now()}_${index}.jpg`;

        const { data, error } = await supabase.storage
          .from('images')
          .upload(filename, blob);

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from('images').getPublicUrl(filename);

        return publicUrl;
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handleCreateNote = async () => {
    try {
      setLoading(true);
      setError(null);

      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(images);
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            title,
            content,
            images: imageUrls,
            area_id: areaId,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCreated(true);
      setTimeout(() => navigation.goBack(), 550);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <CreationIntro
          eyebrow="New note"
          title="Capture the detail before it disappears"
          subtitle="Notes are best for paint colors, measurements, repair context, and weird little home facts."
          stepLabel={
            title.trim() ? 'Note title is ready.' : 'A short title is required.'
          }
          completedSteps={completedSteps}
          totalSteps={3}
        />

        <CreationPrompt
          icon="note"
          title="Make it useful for future you"
          body="A couple of specifics beat a perfect paragraph: what, where, when, and any product names."
        />

        <CreationCard>
          <Input
            label="Note Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter note title"
            placeholderTextColor="#666"
            autoCapitalize="words"
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
                  <Image source={{ uri: image }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImage}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Text style={styles.removeImageIcon}>x</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
              >
                <Icon
                  name="image"
                  color={theme.colors.primary.main}
                  size={32}
                />
                <Text style={styles.addImageText}>Add Images</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ErrorPanel message={error} />
        </CreationCard>

        <SubmitFooter
          title="Create Note"
          hint="Create this note"
          onPress={handleCreateNote}
          loading={loading}
          success={created}
          disabled={loading || !title.trim()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  inputContainer: {
    paddingHorizontal: 0,
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
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    backgroundColor: 'rgba(31, 77, 107, 0.06)',
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
});

export default CreateNoteScreen;
