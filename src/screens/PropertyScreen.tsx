import React, { useCallback } from 'react';
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
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../utils/theme';
import { useProperty, useAreas } from '../hooks/useData';
import { supabase } from '../lib/supabase';

type PropertyScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Property'>;
  route: RouteProp<RootStackParamList, 'Property'>;
};

const PropertyScreen: React.FC<PropertyScreenProps> = ({
  navigation,
  route,
}) => {
  const {
    property,
    loading: propertyLoading,
    error: propertyError,
  } = useProperty(route.params.propertyId);
  const {
    areas,
    loading: areasLoading,
    error: areasError,
    refetch: refetchAreas,
  } = useAreas(route.params.propertyId);

  // Refresh areas when the screen comes into focus (e.g., after creating a new area)
  useFocusEffect(
    useCallback(() => {
      refetchAreas();
    }, [route.params.propertyId])
  );

  if (propertyLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading property...</Text>
      </View>
    );
  }

  if (propertyError) {
    return (
      <View style={styles.container}>
        <Text>Error: {propertyError}</Text>
      </View>
    );
  }

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
          {property.image_url && (
            <Image
              source={{ uri: property.image_url }}
              style={styles.propertyImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.headerContent}>
            <Text style={styles.title}>{property.name}</Text>
            <Text style={styles.address}>
              {property.address_line_1}
              {property.address_line_2 && `, ${property.address_line_2}`}
              {'\n'}
              {property.city}, {property.state} {property.zip_code}
            </Text>
            <View style={styles.headerActions}>
              <Button
                icon={
                  <Icon
                    name="edit"
                    color={theme.colors.text.primary}
                    style={styles.iconButton}
                  />
                }
                type="clear"
                onPress={() =>
                  navigation.navigate('EditProperty', {
                    propertyId: property.id,
                  })
                }
                buttonStyle={styles.actionButton}
              />
              <Button
                icon={
                  <Icon
                    name="swap-horiz"
                    color={theme.colors.text.primary}
                    style={styles.iconButton}
                  />
                }
                type="clear"
                onPress={() =>
                  navigation.navigate('TransferProperty', {
                    propertyId: property.id,
                  })
                }
                buttonStyle={styles.actionButton}
              />
              <Button
                icon={
                  <Icon
                    name="delete"
                    color={theme.colors.error.main}
                    style={styles.iconButton}
                  />
                }
                type="clear"
                onPress={async () => {
                  // In a production app, you would show a confirmation dialog here
                  try {
                    const { error } = await supabase
                      .from('properties')
                      .delete()
                      .eq('id', property.id);
                    
                    if (error) throw error;
                    
                    // Navigate back to the home screen after successful deletion
                    navigation.navigate('Main');
                  } catch (error) {
                    console.error('Error deleting property:', error);
                  }
                }}
                buttonStyle={styles.actionButton}
              />
            </View>
          </View>
        </View>

        {areasLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading areas...</Text>
          </View>
        ) : areasError ? (
          <View style={styles.errorContainer}>
            <Text>Error loading areas: {areasError}</Text>
          </View>
        ) : areas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No areas added yet. Tap the + button to add an area.
            </Text>
          </View>
        ) : (
          <FlatList
            data={areas}
            keyExtractor={(item) => item.id}
            refreshing={areasLoading}
            onRefresh={refetchAreas}
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
                  <View style={styles.cardHeader}>
                    <Text style={styles.areaTitle}>{item.name}</Text>
                    <View style={[styles.cardActions, styles.headerContent]}>
                      <Button
                        icon={
                          <Icon
                            name="edit"
                            color={theme.colors.text.primary}
                            size={16}
                            style={styles.iconButton}
                          />
                        }
                        type="clear"
                        onPress={() =>
                          navigation.navigate('EditArea', { areaId: item.id })
                        }
                        buttonStyle={[styles.actionButton, styles.iconButton]}
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
                        onPress={async () => {
                          // In a production app, you would show a confirmation dialog here
                          try {
                            const { error } = await supabase
                              .from('areas')
                              .delete()
                              .eq('id', item.id);
                            
                            if (error) throw error;
                            refetchAreas();
                          } catch (error) {
                            console.error('Error deleting area:', error);
                          }
                        }}
                        buttonStyle={[styles.actionButton, styles.iconButton]}
                      />
                    </View>
                  </View>
                  <Text style={styles.description}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>
      <FAB
        icon={
          <Icon name="add" size={24} color={theme.colors.background.paper} />
        }
        placement="right"
        color={theme.colors.accent.main}
        onPress={() => navigation.navigate('CreateArea', { propertyId: property.id })}
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
    color: theme.colors.text.slate,
    marginTop: theme.spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    cursor: 'pointer',
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
    color: theme.colors.text.slate,
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
  iconButton: {
    cursor: 'pointer',
  },
  loadingContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  errorContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body1.fontSize,
    textAlign: 'center',
  },
});

export default PropertyScreen;
