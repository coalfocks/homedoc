import React, { useState } from 'react';
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
import {
  CreationCard,
  CreationIntro,
  CreationPrompt,
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
  const [error, setError] = useState<string | null>(null);

  const hasAddress =
    addressLine1.trim() || city.trim() || state.trim() || zipCode.trim();
  const requiredFields = [name.trim()];
  const completedSteps =
    requiredFields.filter(Boolean).length +
    (image ? 1 : 0) +
    (nickname ? 1 : 0) +
    (hasAddress ? 1 : 0);
  const totalSteps = 4;
  const isReady = requiredFields.every(Boolean);

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

  const handleCreateProperty = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const propertyId = createUuid();

      const { error } = await supabase.from('properties').insert([
        {
          id: propertyId,
          name: name.trim(),
          nickname: nickname.trim() || null,
          address_line_1: addressLine1.trim() || null,
          address_line_2: addressLine2.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          zip_code: zipCode.trim() || null,
          image_url: null,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      if (image) {
        const imagePath = await uploadPrivateImage(
          image,
          `properties/${propertyId}`,
        );
        const { error: imageUpdateError } = await supabase
          .from('properties')
          .update({ image_url: imagePath })
          .eq('id', propertyId);

        if (imageUpdateError) throw imageUpdateError;
      }

      setCreated(true);
      setTimeout(() => {
        navigation.replace('Property', { propertyId });
      }, 550);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
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
            eyebrow="New property"
            title="Set up the home base"
            subtitle="Add the core details once so every area, note, and task has a clean place to land."
            stepLabel={
              isReady
                ? 'You can save this property now.'
                : 'A property name is the only required field.'
            }
            completedSteps={completedSteps}
            totalSteps={totalSteps}
          />

          <CreationPrompt
            icon="home"
            title="Start with the parts you know"
            body="A name is enough for beta. Add the address, photo, and nickname now if they are handy, or fill them in later."
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
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 220,
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
  label: {
    color: theme.colors.text.primary,
    fontSize: 16,
    marginBottom: 8,
  },
});

export default CreatePropertyScreen;
