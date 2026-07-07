import React from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useArea, useNotes, useTodos } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import {
  EmptyStateCard,
  FloatingAction,
  MetricPill,
  PageHeader,
  PriorityBadge,
  Screen,
  SectionTitle,
} from '../components/AppChrome';
import { theme } from '../utils/theme';

type AreaScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Area'>;
  route: RouteProp<RootStackParamList, 'Area'>;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const AreaScreen: React.FC<AreaScreenProps> = ({ navigation, route }) => {
  const { area, loading, error } = useArea(route.params.areaId);
  const { notes, refetch: refetchNotes } = useNotes(route.params.areaId);
  const { todos } = useTodos(route.params.areaId);

  if (loading) {
    return (
      <Screen>
        <PageHeader
          eyebrow="AREA DETAIL"
          title="Loading area"
          subtitle="Pulling note history and attached images."
        />
      </Screen>
    );
  }

  if (error || !area) {
    return (
      <Screen>
        <EmptyStateCard
          icon="area"
          title="Area not available"
          description={error || 'This area could not be found.'}
        />
      </Screen>
    );
  }

  const confirmDeleteArea = () => {
    Alert.alert(
      'Delete area',
      `Delete "${area.name}" and every note inside it? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error: deleteError } = await supabase
              .from('areas')
              .delete()
              .eq('id', area.id);

            if (!deleteError) {
              navigation.navigate('Main');
            }
          },
        },
      ],
    );
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="AREA DETAIL"
        title={area.name}
        subtitle={
          area.description ||
          'Document this space with notes, photos, and maintenance records.'
        }
        actionLabel="Edit"
        onActionPress={() =>
          navigation.navigate('EditArea', { areaId: area.id })
        }
      />

      {area.image_url ? (
        <Image
          source={{ uri: area.image_url }}
          style={styles.heroImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.heroFallback}>
          <Text style={styles.heroFallbackText}>
            {area.name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.metricRow}>
        <MetricPill label="Notes" value={notes.length.toString()} />
        <MetricPill
          label="Todos"
          value={`${todos.filter((t) => t.status !== 'done').length}/${todos.length}`}
        />
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={confirmDeleteArea}>
        <Text style={styles.deleteButtonText}>Delete area</Text>
      </TouchableOpacity>

      {/* ── Todos section ── */}
      <SectionTitle
        title="Todos in this area"
        subtitle="Tasks, repairs, and improvements tracked here."
      />

      {todos.filter((t) => t.status !== 'done').length === 0 ? (
        <EmptyStateCard
          icon="todo"
          title="No pending todos"
          description="Everything's done. Add a new task when something needs attention."
          actionLabel="Add todo"
          onActionPress={() =>
            navigation.navigate('CreateTodo', { areaId: area.id })
          }
        />
      ) : (
        <View style={styles.list}>
          {todos
            .filter((t) => t.status !== 'done')
            .slice(0, 3)
            .map((todo) => (
              <TouchableOpacity
                key={todo.id}
                onPress={() =>
                  navigation.navigate('Todo', { todoId: todo.id })
                }
                style={styles.todoCard}
              >
                <View style={styles.todoCardTop}>
                  <Text style={styles.todoCardTitle} numberOfLines={1}>
                    {todo.title}
                  </Text>
                  <PriorityBadge priority={todo.priority} />
                </View>
                {todo.description ? (
                  <Text style={styles.todoCardDesc} numberOfLines={2}>
                    {todo.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          {todos.filter((t) => t.status !== 'done').length > 3 ? (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('AreaTodos', { areaId: area.id })
              }
            >
              <Text style={styles.viewAllLink}>View all todos →</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      <SectionTitle
        title="Notes in this area"
        subtitle="Keep receipts, measurements, to-dos, and maintenance history in one place."
      />

      {notes.length === 0 ? (
        <EmptyStateCard
          icon="note"
          title="No notes yet"
          description="Start with the next real-world thing you’ll want to look up later: paint color, filter size, warranty, or a repair note."
          actionLabel="Create first note"
          onActionPress={() =>
            navigation.navigate('CreateNote', { areaId: area.id })
          }
        />
      ) : (
        <View style={styles.list}>
          {notes.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigation.navigate('Note', { noteId: item.id })}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('EditNote', { noteId: item.id })
                  }
                >
                  <Text style={styles.cardAction}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardContent} numberOfLines={3}>
                {item.content}
              </Text>
              <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FloatingAction
        label="Add note"
        onPress={() => navigation.navigate('CreateNote', { areaId: area.id })}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 140,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.lg,
  },
  heroFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(63, 127, 104, 0.14)',
    marginBottom: theme.spacing.lg,
  },
  heroFallbackText: {
    color: theme.colors.accent.dark,
    fontSize: 48,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(200, 85, 61, 0.10)',
  },
  deleteButtonText: {
    color: theme.colors.error.dark,
    fontWeight: '700',
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '700',
  },
  cardAction: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  cardContent: {
    color: theme.colors.text.slate,
    lineHeight: theme.typography.body1.lineHeight,
  },
  cardDate: {
    marginTop: theme.spacing.sm,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.caption.fontSize,
  },
  todoCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.sm,
  },
  todoCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  todoCardTitle: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.body1.fontSize,
    fontWeight: '700',
  },
  todoCardDesc: {
    color: theme.colors.text.slate,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
  },
  viewAllLink: {
    color: theme.colors.primary.main,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default AreaScreen;
