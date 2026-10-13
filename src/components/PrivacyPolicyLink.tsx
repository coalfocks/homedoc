import React, { useState } from 'react';
import {
  Modal,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import PrivacyScreen from '../screens/PrivacyScreen';
import { theme } from '../utils/theme';

type PrivacyPolicyLinkProps = {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export const PrivacyPolicyLink = ({
  style,
  textStyle,
}: PrivacyPolicyLinkProps) => {
  const [visible, setVisible] = useState(false);
  const close = () => setVisible(false);

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Read privacy policy"
        onPress={() => setVisible(true)}
        style={[{ minHeight: 44, justifyContent: 'center' }, style]}
      >
        <Text
          style={[
            { color: theme.colors.primary.main, fontWeight: '700' },
            textStyle,
          ]}
        >
          Privacy policy
        </Text>
      </TouchableOpacity>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={close}
      >
        <PrivacyScreen onClose={close} />
      </Modal>
    </>
  );
};
