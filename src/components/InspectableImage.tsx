import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageProps,
  ImageStyle,
  Linking,
  Modal,
  Platform,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '@rneui/themed';
import { theme } from '../utils/theme';
import { resolveImageUri } from '../utils/privateImages';
import { Icon } from './Icon';

type InspectableImageProps = Omit<ImageProps, 'source'> & {
  imagePath?: string | null;
  style: StyleProp<ImageStyle>;
  fileName?: string;
};

const fileNameFromPath = (imagePath?: string | null) => {
  const fallback = 'homedoc-image.jpg';
  if (!imagePath) return fallback;

  const rawName = imagePath.split('?')[0].split('/').filter(Boolean).pop();
  if (!rawName) return fallback;

  return /\.[a-z0-9]+$/i.test(rawName) ? rawName : `${rawName}.jpg`;
};

const downloadWebImage = async (uri: string, fileName: string) => {
  const response = await fetch(uri);
  if (!response.ok)
    throw new Error(`Image download failed: ${response.status}`);

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

export const InspectableImage: React.FC<InspectableImageProps> = ({
  imagePath,
  style,
  fileName,
  resizeMode = 'cover',
  ...imageProps
}) => {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(imagePath));
  const [viewerOpen, setViewerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const downloadName = useMemo(
    () => fileName || fileNameFromPath(imagePath),
    [fileName, imagePath],
  );

  useEffect(() => {
    let cancelled = false;

    setLoading(Boolean(imagePath));
    setUri(null);

    resolveImageUri(imagePath)
      .then((resolvedUri) => {
        if (!cancelled) setUri(resolvedUri);
      })
      .catch(() => {
        if (!cancelled) setUri(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [imagePath]);

  const handleSave = async () => {
    if (!uri) return;

    try {
      setSaving(true);
      if (Platform.OS === 'web') {
        await downloadWebImage(uri, downloadName);
      } else {
        await Linking.openURL(uri);
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.open(uri, '_blank', 'noopener,noreferrer');
        return;
      }

      Alert.alert('Could not open image', 'Try again in a moment.');
      console.error('Image save/open failed:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!uri) {
    return (
      <View style={[style, styles.placeholder]}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary.main} />
        ) : null}
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => setViewerOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel="Open image"
      >
        <Image
          {...imageProps}
          source={{ uri }}
          style={style}
          resizeMode={resizeMode}
        />
      </TouchableOpacity>

      <Modal
        visible={viewerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setViewerOpen(false)}
      >
        <View style={styles.modal}>
          <View style={styles.toolbar}>
            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => setViewerOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close image"
            >
              <Icon name="close" size={18} color={theme.colors.text.primary} />
              <Text style={styles.toolbarButtonText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={handleSave}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={
                Platform.OS === 'web' ? 'Save image' : 'Open image'
              }
            >
              <Icon
                name="download"
                size={18}
                color={theme.colors.text.primary}
              />
              <Text style={styles.toolbarButtonText}>
                {Platform.OS === 'web' ? 'Save' : 'Open'}
              </Text>
            </TouchableOpacity>
          </View>

          <Image
            source={{ uri }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.dark,
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(15, 20, 26, 0.94)',
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  toolbar: {
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  toolbarButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  toolbarButtonText: {
    color: theme.colors.text.primary,
    fontWeight: '800',
  },
  fullImage: {
    flex: 1,
    width: '100%',
  },
});
