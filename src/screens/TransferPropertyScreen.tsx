import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Keyboard } from 'react-native';
import { Text, Button, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useProperty, useAreas } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import { theme } from '../utils/theme';

type TransferPropertyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TransferProperty'>;
  route: RouteProp<RootStackParamList, 'TransferProperty'>;
};

type TransferResponse = {
  propertyName?: string;
  recipientEmail?: string;
  role?: string;
};

const TransferPropertyScreen: React.FC<TransferPropertyScreenProps> = ({
  navigation,
  route,
}) => {
  const {
    property,
    loading: propertyLoading,
    error: propertyError,
  } = useProperty(route.params.propertyId);
  const { areas, loading: areasLoading } = useAreas(route.params.propertyId);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (propertyLoading || areasLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading property details...</Text>
      </View>
    );
  }

  if (propertyError || !property) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Property not found</Text>
      </View>
    );
  }

  const handleTransfer = async () => {
    const recipientEmail = email.trim().toLowerCase();

    if (!recipientEmail) {
      setError('Please enter recipient email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    Alert.alert(
      'Share property?',
      `This will add ${recipientEmail} to the household for "${property.name}" so you can both manage shared properties, areas, notes, photos, and todos.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          onPress: () => performTransfer(recipientEmail),
        },
      ],
    );
  };

  const performTransfer = async (recipientEmail: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: transferError } = await supabase.functions.invoke(
        'share-property',
        {
          body: {
            propertyId: property.id,
            recipientEmail,
            role: 'admin',
          },
        },
      );

      if (transferError) throw transferError;
      const transfer = data as TransferResponse | null;

      Alert.alert(
        'Property shared',
        `${transfer?.recipientEmail || recipientEmail} can now access the shared household for ${transfer?.propertyName || property.name}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ],
      );
    } catch (error) {
      const message = await getTransferErrorMessage(error);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={Keyboard.dismiss}
    >
      <View style={styles.form}>
        <Text style={styles.warning}>
          Share this property with a spouse, partner, or trusted co-owner. They
          can manage shared household properties, areas, notes, photos, and
          todos with you.
        </Text>

        <Input
          label="Recipient Email"
          value={email}
          onChangeText={(nextEmail) => {
            setEmail(nextEmail);
            if (error) setError(null);
          }}
          placeholder="Enter recipient's email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          inputContainerStyle={styles.inputContainer}
          labelStyle={styles.labelStyle}
          inputStyle={styles.inputStyle}
          placeholderTextColor={theme.colors.text.secondary}
        />

        {error ? <Text style={styles.formError}>{error}</Text> : null}

        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle}>Property Details</Text>
          <Text style={styles.propertyName}>{property.name}</Text>
          {property.nickname && (
            <Text style={styles.propertyNickname}>"{property.nickname}"</Text>
          )}
          <Text style={styles.propertyAddress}>
            {property.address_line_1}
            {property.address_line_2 && `\n${property.address_line_2}`}
            {'\n'}
            {property.city}, {property.state} {property.zip_code}
          </Text>
          <Text style={styles.propertyStats}>
            {areas?.length || 0} {areas?.length === 1 ? 'Area' : 'Areas'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Share Property"
          onPress={handleTransfer}
          loading={isLoading}
          disabled={isLoading || !email.trim()}
          buttonStyle={styles.transferButton}
          titleStyle={styles.buttonTitle}
        />
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          type="outline"
          containerStyle={styles.cancelButton}
          buttonStyle={styles.cancelButtonStyle}
          titleStyle={styles.cancelButtonTitle}
        />
      </View>
    </ScrollView>
  );
};

async function getTransferErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'context' in error &&
    error.context instanceof Response
  ) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === 'string') return body.error;
    } catch {
      // Fall through to the generic message below.
    }
  }

  if (error instanceof Error) return error.message;
  return 'Failed to share property. Please try again.';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  form: {
    padding: theme.spacing.md,
  },
  warning: {
    color: theme.colors.error.main,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
    fontSize: 14,
  },
  loadingText: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: theme.colors.error.main,
    textAlign: 'center',
    marginTop: 20,
  },
  formError: {
    color: theme.colors.error.dark,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
  },
  labelStyle: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  inputStyle: {
    color: theme.colors.text.primary,
  },
  propertyInfo: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.md,
  },
  propertyTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  propertyName: {
    fontSize: theme.typography.body1.fontSize,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  propertyNickname: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.xs,
  },
  propertyAddress: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    lineHeight: 20,
  },
  propertyStats: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.neutral[400],
    marginTop: theme.spacing.xs,
  },
  buttonContainer: {
    padding: theme.spacing.md,
  },
  transferButton: {
    backgroundColor: theme.colors.error.main,
    borderRadius: theme.borderRadius.md,
    height: 50,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: theme.spacing.sm,
  },
  cancelButtonStyle: {
    borderRadius: theme.borderRadius.md,
    height: 50,
    borderColor: theme.colors.neutral[400],
  },
  cancelButtonTitle: {
    color: theme.colors.text.secondary,
  },
});

export default TransferPropertyScreen;
