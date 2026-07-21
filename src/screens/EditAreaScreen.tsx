import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Keyboard,
  Image,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, Button, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../utils/theme';
import { useArea } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../components/Icon';
import { SignedImage } from '../components/SignedImage';
import { isDirectImageUri, uploadPrivateImage } from '../utils/privateImages';

type EditAreaScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditArea'>;
  route: RouteProp<RootStackParamList, 'EditArea'>;
};

const EditAreaScreen: React.FC<EditAreaScreenProps> = ({
  navigation,
  route,
}) => {
  const { area, loading, error } = useArea(route.params.areaId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (area) {
      setName(area.name);
      setDescription(area.description || '');
      setImage(area.image_url || null);
    }
  }, [area]);

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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading area...</Text>
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

  if (!area) {
    return (
      <View style={styles.container}>
        <Text>Area not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      let imageUrl = area?.image_url || null;

      // Upload new image if one was selected and it's different from current
      if (image && image !== area?.image_url && isDirectImageUri(image)) {
        imageUrl = await uploadPrivateImage(image, `areas/${area.property_id}`);
      }

      const { error: updateError } = await supabase
        .from('areas')
        .update({
          name,
          description,
          image_url: imageUrl,
        })
        .eq('id', area.id);

      if (updateError) throw updateError;

      navigation.goBack();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={Keyboard.dismiss}
    >
      <View style={styles.content}>
        <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
          {image ? (
            <SignedImage imagePath={image} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="add" color="#FFFFFF" size={32} />
              <Text style={styles.uploadText}>Add Area Image</Text>
            </View>
          )}
        </TouchableOpacity>

        <Input
          label="Area Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter area name"
          placeholderTextColor="#666"
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

        {saveError && <Text style={styles.errorText}>{saveError}</Text>}

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          disabled={saving || !name}
          containerStyle={styles.buttonContainer}
          buttonStyle={[
            styles.button,
            (saving || !name) && styles.disabledButton,
          ]}
          titleStyle={[
            styles.buttonText,
            (saving || !name) && styles.disabledButtonText,
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

export default EditAreaScreen;
