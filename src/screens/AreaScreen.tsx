import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Text, Button, Icon, FAB } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { mockProperties } from '../mock/data';
import { theme } from '../utils/theme';

type AreaScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Area'>;
  route: RouteProp<RootStackParamList, 'Area'>;
};

const AreaScreen: React.FC<AreaScreenProps> = ({ navigation, route }) => {
  const area = mockProperties
    .flatMap((p) => p.areas)
    .find((a) => a.id === route.params.areaId);

  if (!area) {
    return (
      <View style={styles.container}>
        <Text>Area not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          {area.image && (
            <Image
              source={{ uri: area.image }}
              style={styles.areaImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.headerContent}>
            <Text style={styles.title}>{area.name}</Text>
            <Text style={styles.description}>{area.description}</Text>
            <View style={styles.headerActions}>
              <Button
                icon={<Icon name="edit" color={theme.colors.text.primary} />}
                type="clear"
                onPress={() => {
                  // In a real app, this would navigate to an edit area screen
                  console.log('Edit area pressed');
                }}
              />
              <Button
                icon={<Icon name="delete" color={theme.colors.error.main} />}
                type="clear"
                onPress={() => {
                  // In a real app, this would show a confirmation dialog
                  console.log('Delete area pressed');
                }}
              />
            </View>
          </View>
        </View>
        <FlatList
          data={area.notes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Note', { noteId: item.id })}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.noteTitle}>{item.title}</Text>
                <View style={styles.cardActions}>
                  <Button
                    icon={<Icon name="edit" color={theme.colors.text.primary} size={16} />}
                    type="clear"
                    onPress={() => {
                      // In a real app, this would navigate to an edit note screen
                      console.log('Edit note pressed');
                    }}
                  />
                  <Button
                    icon={<Icon name="delete" color={theme.colors.error.main} size={16} />}
                    type="clear"
                    onPress={() => {
                      // In a real app, this would show a confirmation dialog
                      console.log('Delete note pressed');
                    }}
                  />
                </View>
              </View>
              <Text style={styles.content} numberOfLines={2}>
                {item.content}
              </Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      </ScrollView>
      <FAB
        icon={<Icon name="add" size={24} color={theme.colors.background.paper} />}
        placement="right"
        color={theme.colors.accent.main}
        onPress={() => {
          // In a real app, this would navigate to a create note screen
          console.log('Add note pressed');
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
  areaImage: {
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
  description: {
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
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    ...theme.shadows.md,
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
  noteTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  content: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  date: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.caption.fontSize,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});

export default AreaScreen; 