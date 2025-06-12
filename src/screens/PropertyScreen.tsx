import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Text, Button, Icon, FAB } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockProperties } from '../mock/data';
import { theme } from '../utils/theme';

type PropertyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Property'>;
  route: RouteProp<RootStackParamList, 'Property'>;
};

const PropertyScreen: React.FC<PropertyScreenProps> = ({
  navigation,
  route,
}) => {
  const property = mockProperties.find((p) => p.id === route.params.propertyId);

  if (!property) {
    return (
      <View style={styles.container}>
        <Text>Property not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          {property.image && (
            <Image
              source={{ uri: property.image }}
              style={styles.propertyImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.headerContent}>
            <Text style={styles.title}>{property.name}</Text>
            <Text style={styles.address}>{property.address}</Text>
            <View style={styles.headerActions}>
              <Button
                icon={<Icon name="edit" color={theme.colors.text.primary} />}
                type="clear"
                onPress={() =>
                  navigation.navigate('EditProperty', {
                    propertyId: property.id,
                  })
                }
              />
              <Button
                icon={
                  <Icon name="swap-horiz" color={theme.colors.text.primary} />
                }
                type="clear"
                onPress={() =>
                  navigation.navigate('TransferProperty', {
                    propertyId: property.id,
                  })
                }
              />
              <Button
                icon={<Icon name="delete" color={theme.colors.error.main} />}
                type="clear"
                onPress={() => {
                  // In a real app, this would show a confirmation dialog
                  console.log('Delete property pressed');
                }}
              />
            </View>
          </View>
        </View>
        <FlatList
          data={property.areas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Area', { areaId: item.id })}
              style={styles.card}
            >
              {item.image && (
                <Image
                  source={{ uri: item.image }}
                  style={styles.areaImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.areaTitle}>{item.name}</Text>
                  <View style={styles.cardActions}>
                    <Button
                      icon={
                        <Icon
                          name="edit"
                          color={theme.colors.text.primary}
                          size={16}
                        />
                      }
                      type="clear"
                      onPress={() => {
                        // In a real app, this would navigate to an edit area screen
                        console.log('Edit area pressed');
                      }}
                    />
                    <Button
                      icon={
                        <Icon
                          name="delete"
                          color={theme.colors.error.main}
                          size={16}
                        />
                      }
                      type="clear"
                      onPress={() => {
                        // In a real app, this would show a confirmation dialog
                        console.log('Delete area pressed');
                      }}
                    />
                  </View>
                </View>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.noteCount}>
                  {item.notes.length}{' '}
                  {item.notes.length === 1 ? 'Note' : 'Notes'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </ScrollView>
      <FAB
        icon={
          <Icon name="add" size={24} color={theme.colors.background.paper} />
        }
        placement="right"
        color={theme.colors.accent.main}
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
    backgroundColor: theme.colors.background.default,
  },
  header: {
    backgroundColor: theme.colors.primary.main,
  },
  propertyImage: {
    width: '100%',
    height: 250,
  },
  headerContent: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  address: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  areaImage: {
    width: '100%',
    height: 150,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  cardActions: {
    flexDirection: 'row',
  },
  areaTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  description: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  noteCount: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.caption.fontSize,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default PropertyScreen;
