import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockProperties } from '../mock/data';
import { theme } from '../utils/theme';

type TransferPropertyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TransferProperty'>;
  route: RouteProp<RootStackParamList, 'TransferProperty'>;
};

const TransferPropertyScreen: React.FC<TransferPropertyScreenProps> = ({ navigation, route }) => {
  const property = mockProperties.find((p) => p.id === route.params.propertyId);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!property) {
    return (
      <View style={styles.container}>
        <Text>Property not found</Text>
      </View>
    );
  }

  const handleTransfer = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter recipient email');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, this would:
      // 1. Validate the email exists in the system
      // 2. Send a transfer request to the recipient
      // 3. Update the property ownership in the database
      console.log('Transferring property:', {
        propertyId: property.id,
        recipientEmail: email,
      });
      
      Alert.alert(
        'Transfer Initiated',
        'A transfer request has been sent to the recipient. The property will be transferred once they accept.',
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
        />

        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle}>Property Details</Text>
          <Text style={styles.propertyName}>{property.name}</Text>
          <Text style={styles.propertyAddress}>{property.address}</Text>
          <Text style={styles.propertyStats}>
            {property.areas.length} {property.areas.length === 1 ? 'Area' : 'Areas'} •{' '}
            {property.areas.reduce((acc, area) => acc + area.notes.length, 0)} Notes
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Initiate Transfer"
          onPress={handleTransfer}
          loading={isLoading}
          buttonStyle={{
            backgroundColor: theme.colors.error.main,
          }}
        />
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          type="outline"
          containerStyle={styles.cancelButton}
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
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
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
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  propertyAddress: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  propertyStats: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.neutral[600],
  },
  buttonContainer: {
    padding: theme.spacing.md,
  },
  cancelButton: {
    marginTop: theme.spacing.sm,
  },
});

export default TransferPropertyScreen; 