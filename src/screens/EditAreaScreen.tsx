import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Input } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../utils/theme';
import { useArea } from '../hooks/useData';
import { supabase } from '../lib/supabase';

type EditAreaScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditArea'>;
  route: RouteProp<RootStackParamList, 'EditArea'>;
};

const EditAreaScreen: React.FC<EditAreaScreenProps> = ({
  navigation,
  route,
}) => {
  const { area, loading, error } = useArea(route.params.areaId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (area) {
      setName(area.name);
      setDescription(area.description || '');
    }
  }, [area]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading area...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  if (!area) {
    return (
      <View style={styles.container}>
        <Text>Area not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveError(null);

      const { error: updateError } = await supabase
        .from('areas')
        .update({ name, description })
        .eq('id', area.id);

      if (updateError) throw updateError;

      navigation.goBack();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
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
          loading={saving}
          disabled={saving || !name}
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
        {saveError && <Text style={styles.errorText}>{saveError}</Text>}
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
  errorText: {
    color: theme.colors.error.main,
    marginTop: theme.spacing.sm,
  },
});

export default EditAreaScreen;
