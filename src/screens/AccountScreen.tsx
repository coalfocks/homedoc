import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Input, Button } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockUser } from '../mock/data';
import { theme } from '../utils/theme';

export type AccountScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const AccountScreen: React.FC<AccountScreenProps> = ({ navigation }) => {
  const [name, setName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);

  const handleSave = () => {
    // In a real app, this would update the user profile in the database
    console.log('Saving user info', { name, email });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Account</Text>
      <Input
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
        inputContainerStyle={styles.inputContainer}
      />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        inputContainerStyle={styles.inputContainer}
      />
      <Button title="Save" onPress={handleSave} containerStyle={styles.button} />
      <Button
        title="Manage Plan"
        type="outline"
        onPress={() => navigation.navigate('PlanManagement')}
        containerStyle={styles.button}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  button: {
    marginTop: theme.spacing.sm,
  },
});

export default AccountScreen;
