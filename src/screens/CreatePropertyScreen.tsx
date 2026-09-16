import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Keyboard,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../components/Icon';
import { uploadPrivateImage } from '../utils/privateImages';
import { getErrorMessage } from '../utils/errors';
import { createUuid } from '../utils/uuid';
import { imagePickerAssetsToUris } from '../utils/imagePickerAssets';
import { saveDraftRecord } from '../utils/saveDraftRecord';
import { createUploadCache } from '../utils/uploadCache';
import {
  CreationCard,
  CreationIntro,
  ErrorPanel,
  SubmitFooter,
} from '../components/CreationFlow';

type CreatePropertyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateProperty'>;
};

const CreatePropertyScreen: React.FC<CreatePropertyScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [propertyId] = useState(createUuid);
  const saving = useRef(false);
  const [uploadImage] = useState(() => createUploadCache(uploadPrivateImage));
  const [error, setError] = useState<string | null>(null);

  const isReady = Boolean(name.trim());

  const pickImage = async () => {
    if (saving.current || created) return;
    try {
      setError(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        setImage(imagePickerAssetsToUris(result.assets)[0] ?? null);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const handleCreateProperty = async () => {
    if (saving.current || created) return;
    if (!user) return;

    saving.current = true;
    try {
      setLoading(true);
      setError(null);

      await saveDraftRecord('properties', {
        id: propertyId,
        name: name.trim(),
        nickname: nickname.trim() || null,
        address_line_1: addressLine1.trim() || null,
        address_line_2: addressLine2.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zip_code: zipCode.trim() || null,
        user_id: user.id,
      });

      if (image) {
        const imagePath = await uploadImage(image, `properties/${propertyId}`);
        const { error: imageUpdateError } = await supabase
          .from('properties')
          .update({ image_url: imagePath })
          .eq('id', propertyId)
          .select('id')
          .single();

        if (imageUpdateError) throw imageUpdateError;
      }

      setCreated(true);
      setTimeout(() => {
        navigation.replace('Property', { propertyId });
      }, 550);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      saving.current = false;
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <View style={styles.content}>
          <CreationIntro
            eyebrow="Property"
            title="Add a property"
            subtitle="Save the details you want to keep together."
            stepLabel=""
            completedSteps={0}
            totalSteps={0}
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
                  <Text style={styles.uploadText}>Add Property Image</Text>
                </View>
              )}
            </TouchableOpacity>

            <Input
              label="Property Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter property name"
              placeholderTextColor="#666"
              autoCapitalize="words"
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
              labelStyle={styles.label}
            />

            <Input
              label="Nickname (optional)"
              value={nickname}
              onChangeText={setNickname}
              placeholder="Enter a friendly nickname"
              placeholderTextColor="#666"
              autoCapitalize="words"
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
              labelStyle={styles.label}
            />

            <Input
              label="Address Line 1 (optional)"
              value={addressLine1}
              onChangeText={setAddressLine1}
              placeholder="Enter address line 1"
              placeholderTextColor="#666"
              autoCapitalize="words"
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
              labelStyle={styles.label}
            />

            <Input
              label="Address Line 2"
              value={addressLine2}
              onChangeText={setAddressLine2}
              placeholder="Enter address line 2"
              placeholderTextColor="#666"
              autoCapitalize="words"
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
              labelStyle={styles.label}
            />

            <Input
              label="City (optional)"
              value={city}
              onChangeText={setCity}
              placeholder="Enter city"
              placeholderTextColor="#666"
              autoCapitalize="words"
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
              labelStyle={styles.label}
            />

            <Input
              label="State"
              value={state}
              onChangeText={setState}
              placeholder="Enter state"
              placeholderTextColor="#666"
              autoCapitalize="words"
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
              labelStyle={styles.label}
            />

            <Input
              label="Zip Code"
              value={zipCode}
              onChangeText={setZipCode}
              placeholder="Enter zip code"
              placeholderTextColor="#666"
              autoCapitalize="words"
              containerStyle={styles.inputContainer}
              inputStyle={styles.input}
              labelStyle={styles.label}
            />

            <ErrorPanel message={error} />
          </CreationCard>

          <SubmitFooter
            title="Create Property"
            hint="Create this property"
            onPress={handleCreateProperty}
            loading={loading}
            success={created}
            disabled={loading || !isReady}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    padding: theme.spacing.lg,
  },
  scrollContent: {
    paddingBottom: 220,
  },
  imageUpload: {
    width: '100%',
    height: 200,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
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
    paddingHorizontal: theme.spacing.sm,
  },
  label: {
    color: theme.colors.text.slate,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
});

export default CreatePropertyScreen;
