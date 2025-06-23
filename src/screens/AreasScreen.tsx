import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Text, FAB, Card } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../utils/theme';
import { Icon } from '../components/Icon';
import { useTheme } from '@rneui/themed';
import { useAllAreas } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';

type AreasScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const AreasScreen: React.FC<AreasScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { areas: allAreas, loading, error, refetch } = useAllAreas(user?.id);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background.default },
      ]}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading areas...</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text>Error: {error}</Text>
        </View>
      ) : (
        <FlatList
          data={allAreas}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Area', { areaId: item.id })}
              style={styles.card}
            >
              {item.image_url && (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.areaImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.cardContent}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.propertyName}>{item.properties?.name}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      <FAB
        icon={
          <Icon name="add" size={24} color={theme.colors.background.paper} />
        }
        placement="right"
        color={theme.colors.primary.main}
        onPress={() => {
          // In a real app, this would navigate to a create area screen
          console.log('Add area pressed');
        }}
        style={styles.fab}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  propertyName: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  areaImage: {
    width: '100%',
    height: 150,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AreasScreen;
