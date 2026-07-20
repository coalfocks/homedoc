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
import { uploadPrivateImage } from '../utils/privateImages';
import { getErrorMessage } from '../utils/errors';
import { createUuid } from '../utils/uuid';
import {
  CreationCard,
  CreationIntro,
  CreationPrompt,
  ErrorPanel,
  SubmitFooter,
} from '../components/CreationFlow';

type CreateAreaScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateArea'>;
  route: RouteProp<RootStackParamList, 'CreateArea'>;
};

const CreateAreaScreen: React.FC<CreateAreaScreenProps> = ({
  navigation,
  route,
}) => {
  const { propertyId } = route.params;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedSteps =
    (name.trim() ? 1 : 0) + (description.trim() ? 1 : 0) + (image ? 1 : 0);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleCreateArea = async () => {
    try {
      setLoading(true);
      setError(null);
      const areaId = createUuid();

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadPrivateImage(image, `areas/${propertyId}`);
      }

      const { error } = await supabase.from('areas').insert([
        {
          id: areaId,
          name,
          description,
          property_id: propertyId,
          image_url: imageUrl,
        },
      ]);

      if (error) throw error;

      setCreated(true);
      setTimeout(() => navigation.replace('Area', { areaId }), 550);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
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
          eyebrow="New area"
          title="Make the next room easy to find"
          subtitle="Areas become the buckets for notes, repairs, products, and maintenance work."
          stepLabel={
            name.trim()
              ? 'Area name is ready.'
              : 'Give the area a clear, familiar name.'
          }
          completedSteps={completedSteps}
          totalSteps={3}
        />

        <CreationPrompt
          icon="area"
          title="Rooms, systems, or outdoor spaces all work"
          body="Use the same labels you would say out loud: Kitchen, furnace closet, west fence, master bath."
        />

        <CreationCard>
          <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.imagePreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon
                  name="camera"
                  color={theme.colors.primary.contrast}
                  size={32}
                />
                <Text style={styles.uploadText}>Add Area Image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Input
            label="Area Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter area name (e.g., Kitchen, Master Bedroom)"
            placeholderTextColor="#666"
            autoCapitalize="words"
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            labelStyle={styles.label}
          />

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter area description"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            containerStyle={styles.inputContainer}
            inputStyle={[styles.input, styles.textArea]}
            labelStyle={styles.label}
          />

          <ErrorPanel message={error} />
        </CreationCard>

        <SubmitFooter
          title="Create Area"
          hint="Create this area"
          onPress={handleCreateArea}
          loading={loading}
          success={created}
          disabled={loading || !name.trim()}
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
  imageUpload: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.background.paper,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 16,
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
});

export default CreateAreaScreen;
