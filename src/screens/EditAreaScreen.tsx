import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockProperties } from '../mock/data';
import { theme } from '../utils/theme';

type EditAreaScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditArea'>;
  route: RouteProp<RootStackParamList, 'EditArea'>;
};

const EditAreaScreen: React.FC<EditAreaScreenProps> = ({ navigation, route }) => {
  const area = mockProperties
    .flatMap((p) => p.areas)
    .find((a) => a.id === route.params.areaId);

  const [name, setName] = useState(area?.name || '');
  const [description, setDescription] = useState(area?.description || '');

  if (!area) {
    return (
      <View style={styles.container}>
        <Text>Area not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    // In a real app, this would update the area in the database
    console.log('Saving area:', { name, description });
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Input
          label="Area Name"
          value={name}
          onChangeText={setName}
          placeholder="Enter area name"
          inputContainerStyle={styles.inputContainer}
        />
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Enter area description"
          multiline
          numberOfLines={4}
          inputContainerStyle={styles.inputContainer}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Save Changes"
          onPress={handleSave}
          buttonStyle={{
            backgroundColor: theme.colors.accent.main,
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

export default EditAreaScreen; 