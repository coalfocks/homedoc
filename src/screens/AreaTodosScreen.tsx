import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTodos, useArea } from '../hooks/useData';
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
import { Icon } from '../components/Icon';
import { theme } from '../utils/theme';

type AreaTodosScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AreaTodos'>;
  route: RouteProp<RootStackParamList, 'AreaTodos'>;
};

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'done';

const filterTabs: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

const AreaTodosScreen: React.FC<AreaTodosScreenProps> = ({
  navigation,
  route,
}) => {
  const { areaId } = route.params;
  const { area } = useArea(areaId);
  const { todos, loading, error, refetch } = useTodos(areaId);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered =
    filter === 'all' ? todos : todos.filter((t) => t.status === filter);

  const pendingCount = todos.filter((t) => t.status !== 'done').length;

  const toggleDone = async (todoId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    const { error: updateError } = await supabase
      .from('todos')
      .update({ status: newStatus })
      .eq('id', todoId);
    if (!updateError) refetch();
  };

  const confirmDelete = (todoId: string, title: string) => {
    Alert.alert('Delete todo', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error: deleteError } = await supabase
            .from('todos')
            .delete()
            .eq('id', todoId);
          if (!deleteError) refetch();
        },
      },
    ]);
  };

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="TODOS"
        title={area ? `${area.name}` : 'Area Todos'}
        subtitle="Maintenance and improvement tasks for this area."
      />

      <View style={styles.metricRow}>
        <MetricPill label="Total" value={todos.length.toString()} />
        <MetricPill label="Pending" value={pendingCount.toString()} />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[
              styles.filterTab,
              filter === tab.value && styles.filterTabActive,
            ]}
            onPress={() => setFilter(tab.value)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === tab.value && styles.filterTabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionTitle title="Tasks" />

      {loading ? null : error ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Couldn't load todos</Text>
          <Text style={styles.noticeBody}>{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyStateCard
          icon="todo"
          title="No todos here"
          description="Add your first task — a repair, upgrade, or anything you need to get done in this area."
          actionLabel="Add todo"
          onActionPress={() =>
            navigation.navigate('CreateTodo', { areaId })
          }
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((todo) => (
            <View key={todo.id} style={styles.card}>
              <View style={styles.cardRow}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    todo.status === 'done' && styles.checkboxDone,
                  ]}
                  onPress={() => toggleDone(todo.id, todo.status)}
                >
                  {todo.status === 'done' ? (
                    <Icon
                      name="check"
                      size={16}
                      color={theme.colors.primary.contrast}
                    />
                  ) : null}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardBody}
                  onPress={() =>
                    navigation.navigate('Todo', { todoId: todo.id })
                  }
                >
                  <View style={styles.cardTop}>
                    <Text
                      style={[
                        styles.cardTitle,
                        todo.status === 'done' && styles.cardTitleDone,
                      ]}
                      numberOfLines={1}
                    >
                      {todo.title}
                    </Text>
                    <PriorityBadge priority={todo.priority} />
                  </View>
                  {todo.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {todo.description}
                    </Text>
                  ) : null}
                </TouchableOpacity>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('EditTodo', { todoId: todo.id })
                    }
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon
                      name="edit"
                      size={18}
                      color={theme.colors.text.secondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(todo.id, todo.title)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon
                      name="delete"
                      size={18}
                      color={theme.colors.error.main}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <FloatingAction
        label="Add todo"
        onPress={() => navigation.navigate('CreateTodo', { areaId })}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 140,
  },
  metricRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  filterTabText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
  filterTabTextActive: {
    color: theme.colors.primary.contrast,
  },
  noticeCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(200, 85, 61, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(200, 85, 61, 0.18)',
  },
  noticeTitle: {
    color: theme.colors.error.dark,
    fontWeight: '700',
    marginBottom: 4,
  },
  noticeBody: {
    color: theme.colors.text.slate,
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: theme.colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: theme.colors.success.main,
    borderColor: theme.colors.success.main,
  },
  cardBody: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '700',
  },
  cardTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  cardDesc: {
    color: theme.colors.text.slate,
    lineHeight: theme.typography.body2.lineHeight,
  },
  cardActions: {
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
});

export default AreaTodosScreen;
