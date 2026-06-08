import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text, FAB } from '@rneui/themed';
import { useTheme } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Icon } from '../components/Icon';
import { theme } from '../utils/theme';
import { useProperties } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Icon name="home" color={theme.colors.primary.main} size={64} />
    <Text style={styles.emptyTitle}>No Properties Yet!</Text>
    <Text style={styles.emptyText}>
      Click the + button below to add your first property. Start documenting
      your home's journey!
    </Text>
  </View>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const { properties, loading, error, refetch } = useProperties(user?.id);

  const onRefresh = () => {
    if (user?.id) {
      refetch();
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Please sign in to view properties</Text>
      </View>
    );
  }

  if (loading && properties.length === 0) {
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
        ListEmptyComponent={EmptyState}
        refreshing={loading}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Property', { propertyId: item.id })
            }
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
              <Text style={styles.address}>
                {item.address_line_1}
                {item.address_line_2 && `, ${item.address_line_2}`}
                {'\n'}
                {item.city}, {item.state} {item.zip_code}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <FAB
        icon={<Icon name="add" color="#FFFFFF" size={24} />}
        placement="right"
        color="#4CAF50"
        onPress={() => navigation.navigate('CreateProperty')}
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: 8,
    margin: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  propertyImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  address: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  fab: {
    margin: 16,
  },
});

export default HomeScreen;
