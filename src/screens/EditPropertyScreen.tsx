import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockProperties } from '../mock/data';
import { theme } from '../utils/theme';

type EditPropertyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditProperty'>;
  route: RouteProp<RootStackParamList, 'EditProperty'>;
};

const EditPropertyScreen: React.FC<EditPropertyScreenProps> = ({
  navigation,
  route,
}) => {
  const property = mockProperties.find((p) => p.id === route.params.propertyId);

  const [name, setName] = useState(property?.name || '');
  const [address, setAddress] = useState(property?.address || '');

  if (!property) {
    return (
      <View style={styles.container}>
        <Text>Property not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    // In a real app, this would update the property in the database
    console.log('Saving property:', { name, address });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Input
          label="Property Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter property name"
          inputContainerStyle={styles.inputContainer}
        />
        <Input
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Enter property address"
          multiline
          numberOfLines={2}
          inputContainerStyle={styles.inputContainer}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          buttonStyle={{
            backgroundColor: theme.colors.accent,
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
    backgroundColor: theme.colors.background,
  },
  form: {
    padding: theme.spacing.md,
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  buttonContainer: {
    padding: theme.spacing.md,
  },
  cancelButton: {
    marginTop: theme.spacing.sm,
  },
});

export default EditPropertyScreen;
