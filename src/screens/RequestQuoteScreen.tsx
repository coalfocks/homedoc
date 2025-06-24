import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Text, Input, Button } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockProperties } from '../mock/data';
import { requestQuotes } from '../utils/quoteService';
import { theme } from '../utils/theme';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RequestQuote'>;
  route: RouteProp<RootStackParamList, 'RequestQuote'>;
}

const RequestQuoteScreen: React.FC<Props> = ({ navigation, route }) => {
  const todo = mockProperties
    .flatMap((p) => p.areas)
    .flatMap((a) => a.todos)
    .find((t) => t.id === route.params.todoId);

  const property = mockProperties.find((p) =>
    p.areas.some((a) => a.todos.some((t) => t.id === route.params.todoId)),
  );

  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.context ?? '');
  const [zip, setZip] = useState(property?.zip_code ?? '');
  const [images, setImages] = useState<string[]>([]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...uris]);
    }
  };

  const submit = async () => {
    try {
      const data = await requestQuotes({ title, description, zip, images });
      if (data.diyEstimate) {
        Alert.alert('DIY Estimate', data.diyEstimate);
      }
      const msg = [
        `Texted: ${data.smsResults.length}`,
        `Called: ${data.callResults.length}`,
        `Emailed: ${data.emailResults.length}`,
      ].join('\n');
      Alert.alert('Requests Sent', msg);
      navigation.goBack();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Input
        label="Job Title"
        value={title}
        onChangeText={setTitle}
        inputContainerStyle={styles.inputContainer}
      />
      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        inputContainerStyle={styles.inputContainer}
        multiline
      />
      <Input
        label="Zip Code"
        value={zip}
        onChangeText={setZip}
        keyboardType="number-pad"
        inputContainerStyle={styles.inputContainer}
      />
      <View style={styles.imageContainer}>
        {images.map((uri, idx) => (
          <Image key={idx} source={{ uri }} style={styles.image} />
        ))}
        <TouchableOpacity style={styles.addImage} onPress={pickImage}>
          <Text style={styles.addImageText}>+</Text>
        </TouchableOpacity>
      </View>
      <Button title="Request Quotes" onPress={submit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
    padding: theme.spacing.md,
  },
  inputContainer: {
    paddingHorizontal: theme.spacing.sm,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
  },
  addImage: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 32,
    color: theme.colors.primary.main,
  },
});

export default RequestQuoteScreen;
