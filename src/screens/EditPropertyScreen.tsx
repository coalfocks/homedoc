import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, Button, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../utils/theme';
import { useProperty } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../components/Icon';

type EditPropertyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProperty'>;
  route: RouteProp<RootStackParamList, 'EditProperty'>;
};

const ImageWithPlaceholder = ({ uri, style }: { uri: string; style: any }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={[style, styles.imageContainer]}>
      {isLoading && (
        <View style={[style, styles.placeholderContainer]}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={[style, isLoading ? styles.hidden : styles.visible]}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {hasError && (
        <View style={[style, styles.placeholderContainer]}>
          <Icon name="home" color={theme.colors.text.secondary} size={32} />
          <Text style={styles.errorText}>Failed to load image</Text>
        </View>
      )}
    </View>
  );
};

const EditPropertyScreen: React.FC<EditPropertyScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const {
    property,
    loading: propertyLoading,
    error: propertyError,
  } = useProperty(route.params.propertyId);

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

  useEffect(() => {
    if (property) {
      setName(property.name || '');
      setNickname(property.nickname || '');
      setAddressLine1(property.address_line_1 || '');
      setAddressLine2(property.address_line_2 || '');
      setCity(property.city || '');
      setState(property.state || '');
      setZipCode(property.zip_code || '');
      setImage(property.image_url || null);
    }
  }, [property]);

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

      const {
        data: { publicUrl },
      } = supabase.storage.from('images').getPublicUrl(filename);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  if (propertyLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <Text style={styles.loadingText}>Loading property...</Text>
      </View>
    );
  }

  if (propertyError) {
    return (
      <View style={styles.container}>
        <Text>Error: {propertyError}</Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View style={styles.container}>
        <Text>Property not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      let imageUrl = property?.image_url || null;

      // Upload new image if one was selected and it's different from current
      if (image && image !== property?.image_url) {
        imageUrl = await uploadImage(image);
      }

      const { error } = await supabase
        .from('properties')
        .update({
          name,
          nickname,
          address_line_1: addressLine1,
          address_line_2: addressLine2,
          city,
          state,
          zip_code: zipCode,
          image_url: imageUrl,
        })
        .eq('id', property.id);

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
        <TouchableOpacity
          style={[styles.imageUpload, styles.cursorPointer]}
          onPress={pickImage}
        >
          {image ? (
            <ImageWithPlaceholder uri={image} style={styles.imagePreview} />
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
          containerStyle={styles.inputContainer}
          inputStyle={styles.input}
          labelStyle={styles.label}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonContainer}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          disabled={
            loading || !name || !addressLine1 || !city || !state || !zipCode
          }
          containerStyle={styles.cursorPointer}
        />
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          type="outline"
          containerStyle={[styles.cancelButton, styles.cursorPointer]}
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
  cursorPointer: {
    cursor: 'pointer',
  },
  cancelButton: {
    marginTop: theme.spacing.sm,
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.primary,
  },
  imageContainer: {
    position: 'relative',
  },
  placeholderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background.paper,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
  subtext: {
    color: theme.colors.text.secondary,
    opacity: 0.8,
  },
});

export default EditPropertyScreen;
