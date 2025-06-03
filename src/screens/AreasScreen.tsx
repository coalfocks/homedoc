import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Text, FAB, Card } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockProperties } from '../mock/data';
import { theme } from '../utils/theme';
import { Icon } from '../components/Icon';
import { useTheme } from '@rneui/themed';

type AreasScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const AreasScreen: React.FC<AreasScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();

  const allAreas = mockProperties.flatMap(property => 
    property.areas.map(area => ({
      ...area,
      propertyName: property.name,
      propertyId: property.id,
    }))
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
      <ScrollView style={styles.scrollView}>
        <Card containerStyle={[styles.card, { backgroundColor: theme.colors.background.paper }]}>
          <Card.Title style={{ color: theme.colors.text.primary }}>Areas</Card.Title>
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            No areas added yet. Tap the + button to add an area.
          </Text>
        </Card>
      </ScrollView>
      <FAB
        icon={<Icon name="add" size={24} color={theme.colors.background.paper} />}
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
  scrollView: {
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
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default AreasScreen; 