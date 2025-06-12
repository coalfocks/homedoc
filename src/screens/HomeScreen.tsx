import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text, FAB } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockProperties } from '../mock/data';
import { theme } from '../utils/theme';
import { Icon } from '../components/Icon';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockProperties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('Property', { propertyId: item.id })
            }
            style={styles.card}
          >
            {item.image && (
              <Image
                source={{ uri: item.image }}
                style={styles.propertyImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.cardContent}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.address}>{item.address}</Text>
              <Text style={styles.stats}>
                {item.areas.length} {item.areas.length === 1 ? 'Area' : 'Areas'}{' '}
                • {item.areas.reduce((acc, area) => acc + area.notes.length, 0)}{' '}
                Notes
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <FAB
        icon={
          <Icon name="home" color={theme.colors.accent.contrast} size={24} />
        }
        placement="right"
        color={theme.colors.accent.main}
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
  stats: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.neutral[600],
  },
  fab: {
    margin: theme.spacing.md,
  },
});

export default HomeScreen;
