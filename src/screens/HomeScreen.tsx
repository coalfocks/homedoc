import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, FAB } from '@rneui/themed';
import { useTheme } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Icon } from '../components/Icon';
import { theme } from '../utils/theme';
import { useProperties } from '../hooks/useData';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  // TODO: Replace with actual user ID from auth
  const { properties, loading, error } = useProperties('current-user-id');

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading properties...</Text>
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

  return (
    <View style={styles.container}>
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Property', { propertyId: item.id })}
            style={styles.card}
          >
            {item.image_url && (
              <Image
                source={{ uri: item.image_url }}
                style={styles.propertyImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.address}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <FAB
        icon={<Icon name="home" color="#FFFFFF" size={24} />}
        placement="right"
        color={theme.colors.primary.main}
        onPress={() => {
          // In a real app, this would navigate to a create property screen
          console.log('Add property pressed');
        }}
        style={styles.fab}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  card: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  propertyImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  address: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  fab: {
    margin: theme.spacing.md,
  },
});

export default HomeScreen; 