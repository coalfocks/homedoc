import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useProperty, useAreas } from '../hooks/useData';
import { theme } from '../utils/theme';

type TransferPropertyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TransferProperty'>;
  route: RouteProp<RootStackParamList, 'TransferProperty'>;
};

const TransferPropertyScreen: React.FC<TransferPropertyScreenProps> = ({ navigation, route }) => {
  const { property, loading: propertyLoading, error: propertyError } = useProperty(route.params.propertyId);
  const { areas, loading: areasLoading } = useAreas(route.params.propertyId);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    if (!email) {
      Alert.alert('Error', 'Please enter recipient email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual transfer logic
      // 1. Check if user exists with this email
      // 2. Create transfer request in database
      // 3. Send notification to recipient
      // For now, just show a coming soon message
      
      Alert.alert(
        'Coming Soon',
        'Property transfer functionality will be available soon. For now, you can share property details manually.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate transfer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Count notes from areas
  const totalNotes = areas?.reduce((acc, area) => acc + 1, 0) || 0; // Note: would need to fetch notes per area for accurate count

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.warning}>
          Warning: Transferring this property will give the recipient full access to all areas and notes.
          This action cannot be undone.
        </Text>
        
        <Input
          label="Recipient Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Enter recipient's email"
          keyboardType="email-address"
          autoCapitalize="none"
          inputContainerStyle={styles.inputContainer}
          labelStyle={styles.labelStyle}
          inputStyle={styles.inputStyle}
          placeholderTextColor={theme.colors.text.secondary}
        />

        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle}>Property Details</Text>
          <Text style={styles.propertyName}>{property.name}</Text>
          {property.nickname && (
            <Text style={styles.propertyNickname}>"{property.nickname}"</Text>
          )}
          <Text style={styles.propertyAddress}>
            {property.address_line_1}
            {property.address_line_2 && `\n${property.address_line_2}`}
            {'\n'}{property.city}, {property.state} {property.zip_code}
          </Text>
          <Text style={styles.propertyStats}>
            {areas?.length || 0} {areas?.length === 1 ? 'Area' : 'Areas'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Initiate Transfer"
          onPress={handleTransfer}
          loading={isLoading}
          disabled={isLoading}
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
