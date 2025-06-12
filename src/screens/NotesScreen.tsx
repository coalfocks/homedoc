import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, FAB } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { theme } from '../utils/theme';
import { useAllNotes } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import { Icon } from '../components/Icon';

type NotesScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const NotesScreen: React.FC<NotesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { notes: allNotes, loading, error, refetch } = useAllNotes(user?.id);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading notes...</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text>Error: {error}</Text>
        </View>
      ) : (
        <FlatList
          data={allNotes}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Note', { noteId: item.id })}
              style={styles.card}
            >
              <View style={styles.cardContent}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.location}>
                  {item.areas?.properties?.name} • {item.areas?.name}
                </Text>
                <Text style={styles.content} numberOfLines={2}>
                  {item.content}
                </Text>
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
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
  card: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    overflow: 'hidden',
    ...theme.shadows.md,
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
  location: {
    fontSize: theme.typography.body2.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  content: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  date: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text.secondary,
    opacity: 0.8,
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

export default NotesScreen;
