import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Text, Input, Button } from '@rneui/themed';
import { useTheme } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../components/Icon';

type CreatePropertyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateProperty'>;
};

const CreatePropertyScreen: React.FC<CreatePropertyScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
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
  const [error, setError] = useState<string | null>(null);

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

  const uploadImage = async (uri: string) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${user?.id}/${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filename, blob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filename);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleCreateProperty = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      const { data, error } = await supabase
        .from('properties')
        .insert([
          {
            name,
            nickname,
            address_line_1: addressLine1,
            address_line_2: addressLine2,
            city,
            state,
            zip_code: zipCode,
            image_url: imageUrl,
            user_id: user.id,
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="add" color="#FFFFFF" size={32} />
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
          label="Address Line 1"
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
          label="City"
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

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Button
          title="Create Property"
          onPress={handleCreateProperty}
          loading={loading}
          disabled={loading || !name || !addressLine1 || !city || !state || !zipCode}
          containerStyle={styles.buttonContainer}
          buttonStyle={[styles.button, (loading || !name || !addressLine1 || !city || !state || !zipCode) && styles.disabledButton]}
          titleStyle={[styles.buttonText, (loading || !name || !addressLine1 || !city || !state || !zipCode) && styles.disabledButtonText]}
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
    backgroundColor: theme.colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 16,
  },
  inputContainer: {
    paddingHorizontal: 16,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 16,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
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

export default CreatePropertyScreen; 