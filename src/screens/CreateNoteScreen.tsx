import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import { useContractorAreaAccess } from '../hooks/useData';
import { theme } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '../components/Icon';
import { SignedImage } from '../components/SignedImage';
import { uploadPrivateImage } from '../utils/privateImages';
import { getErrorMessage } from '../utils/errors';
import { imagePickerAssetsToUris } from '../utils/imagePickerAssets';
import { parseReminderInput } from '../utils/reminders';
import { createUuid } from '../utils/uuid';
import { saveDraftRecord } from '../utils/saveDraftRecord';
import { createUploadCache } from '../utils/uploadCache';
import {
  CreationCard,
  CreationIntro,
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
  const { user } = useAuth();
  const { areaId } = route.params;
  const { access } = useContractorAreaAccess(areaId, user?.id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);
  const [noteId] = useState(createUuid);
  const saving = useRef(false);
  const [uploadImage] = useState(() => createUploadCache(uploadPrivateImage));
  const [error, setError] = useState<string | null>(null);

  const contractorAccess = access.find(
    (item) => item.contractor_user_id === user?.id,
  );

  const pickImage = async () => {
    if (saving.current || created) return;
    try {
      setError(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        base64: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newImages = imagePickerAssetsToUris(result.assets);
        setImages([...images, ...newImages]);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    }
  };

  const uploadImages = async (uris: string[]) => {
    try {
      const uploadPromises = uris.map(async (uri, index) => {
        return uploadImage(uri, `notes/${areaId}/${index}`);
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  };

  const handleCreateNote = async () => {
    if (saving.current || created) return;
    saving.current = true;
    try {
      setLoading(true);
      setError(null);
      const reminder = parseReminderInput({
        date: reminderDate,
        time: reminderTime,
      });
      if (reminder.error) {
        setError(reminder.error);
        return;
      }

      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(images);
      }

      await saveDraftRecord('notes', {
        id: noteId,
        title,
        content,
        images: imageUrls,
        area_id: areaId,
        reminder_at: reminder.reminderAt,
        ...(contractorAccess
          ? {
              note_source: 'contractor',
              contractor_user_id: user?.id,
              contractor_area_access_id: contractorAccess.id,
              contractor_name:
                contractorAccess.contractor_name ||
                contractorAccess.contractor_email,
              contractor_company: contractorAccess.company_name || null,
            }
          : {}),
      });

      setCreated(true);
      setTimeout(() => navigation.replace('Note', { noteId }), 550);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      saving.current = false;
      setLoading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <CreationIntro
          eyebrow={contractorAccess ? 'Work note' : 'Note'}
          title="Add a note"
          subtitle={
            contractorAccess
              ? 'Record what changed, what was used, and what to remember next.'
              : 'Keep the details, photos, and reminders you will want later.'
          }
          stepLabel=""
          completedSteps={0}
          totalSteps={0}
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

          <View style={styles.reminderSection}>
            <Text style={styles.sectionTitle}>Reminder</Text>
            <View style={styles.reminderRow}>
              <Input
                value={reminderDate}
                onChangeText={setReminderDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                containerStyle={[styles.inputContainer, styles.reminderInput]}
                inputStyle={styles.input}
              />
              <Input
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholder="HH:MM"
                placeholderTextColor="#666"
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                containerStyle={[styles.inputContainer, styles.reminderTime]}
                inputStyle={styles.input}
              />
            </View>
            <Text style={styles.helperText}>
              Optional. Leave time blank to remind at 9:00 AM.
            </Text>
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Images</Text>
            <View style={styles.imageContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <SignedImage
                    imagePath={image}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImage}
                    onPress={() => handleRemoveImage(index)}
                    activeOpacity={0.85}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Remove image"
                  >
                    <Icon name="close" color="#FFFFFF" size={14} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={pickImage}
                activeOpacity={0.82}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Add images"
              >
                <View style={styles.addImageIconBadge}>
                  <Icon
                    name="image"
                    color={theme.colors.accent.dark}
                    size={28}
                  />
                </View>
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
    padding: 16,
    paddingBottom: 220,
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  input: {
    color: theme.colors.text.primary,
    fontSize: 16,
    paddingHorizontal: theme.spacing.sm,
  },
  textArea: {
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  reminderSection: {
    marginTop: 8,
  },
  reminderRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  reminderInput: {
    flex: 1,
  },
  reminderTime: {
    width: 116,
  },
  helperText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    paddingHorizontal: 16,
    marginTop: -8,
  },
  label: {
    color: theme.colors.text.slate,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  imageSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text.slate,
    marginBottom: theme.spacing.sm,
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
    borderRadius: 10,
    backgroundColor: theme.colors.background.dark,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeImage: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(31, 42, 55, 0.82)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  addImageButton: {
    width: '47%',
    aspectRatio: 1,
    minHeight: 144,
    paddingHorizontal: 10,
    paddingVertical: 14,
    backgroundColor: 'rgba(63, 127, 104, 0.1)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(63, 127, 104, 0.42)',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  addImageIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.paper,
    marginBottom: 10,
    ...theme.shadows.sm,
  },
  addImageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: theme.colors.accent.dark,
    textAlign: 'center',
    paddingBottom: 2,
  },
});

export default CreateNoteScreen;
