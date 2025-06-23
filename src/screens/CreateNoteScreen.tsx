import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, Input, Button } from '@rneui/themed';
import { useTheme } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';
import { theme } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../components/Icon';

type CreateNoteScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateNote'>;
  route: RouteProp<RootStackParamList, 'CreateNote'>;
};

const CreateNoteScreen: React.FC<CreateNoteScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { areaId } = route.params;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map(asset => asset.uri);
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

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filename);

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

      navigation.goBack();
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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
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
                  <Text style={styles.removeImageIcon}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={pickImage}
            >
              <Icon name="add" color="#FFFFFF" size={32} />
              <Text style={styles.addImageText}>Add Images</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Button
          title="Create Note"
          onPress={handleCreateNote}
          loading={loading}
          disabled={loading || !title}
          containerStyle={styles.buttonContainer}
          buttonStyle={[styles.button, (loading || !title) && styles.disabledButton]}
          titleStyle={[styles.buttonText, (loading || !title) && styles.disabledButtonText]}
          disabledStyle={styles.disabledButton}
          disabledTitleStyle={styles.disabledButtonText}
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
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  textArea: {
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  imageSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    backgroundColor: theme.colors.background.paper,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.paper,
    borderStyle: 'dashed',
  },
  addImageText: {
    fontSize: 14,
    color: '#FFFFFF',
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
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default CreateNoteScreen; 