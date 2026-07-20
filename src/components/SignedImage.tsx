import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageProps,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
} from 'react-native';
import { theme } from '../utils/theme';
import { resolveImageUri } from '../utils/privateImages';

type SignedImageProps = Omit<ImageProps, 'source'> & {
  imagePath?: string | null;
  style: StyleProp<ImageStyle>;
};

export const SignedImage: React.FC<SignedImageProps> = ({
  imagePath,
  style,
  ...imageProps
}) => {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(imagePath));

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

  if (!uri) {
    return (
      <View style={[style, styles.placeholder]}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary.main} />
        ) : null}
      </View>
    );
  }

  return <Image {...imageProps} source={{ uri }} style={style} />;
};

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.dark,
  },
});
