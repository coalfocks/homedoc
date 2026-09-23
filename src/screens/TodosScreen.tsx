import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTodosByProperty } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';
import {
  EmptyStateCard,
  LoadingStateCard,
  MetricPill,
  PageHeader,
  PriorityBadge,
  Screen,
  SectionTitle,
  StatusBadge,
  StatusBanner,
} from '../components/AppChrome';
import { theme } from '../utils/theme';
import type { Todo } from '../lib/supabase';
import { formatReminder } from '../utils/reminders';
import {
  getTodoArchiveCounts,
  selectTodosForFilter,
  type TodoListFilter,
} from '../utils/todoArchive';
import { TodoArchiveAction } from '../components/TodoArchiveAction';

type TodosScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const filterTabs: { label: string; value: TodoListFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
  { label: 'Archived', value: 'archived' },
];

const TodosScreen: React.FC<TodosScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { todos, loading, error, refetch } = useTodosByProperty(user?.id);
  const [filter, setFilter] = useState<TodoListFilter>('all');

  const filtered = selectTodosForFilter(todos, filter);
  const counts = getTodoArchiveCounts(todos);

  // Group by area name
  const grouped = filtered.reduce((acc: Record<string, Todo[]>, todo) => {
    const areaName = (todo as any).areas?.name || 'Unknown Area';
    if (!acc[areaName]) acc[areaName] = [];
    acc[areaName].push(todo);
    return acc;
  }, {});

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="TASK LIST"
        title="Todos"
        subtitle="Maintenance, repairs, and improvements across every property."
      />

      <View style={styles.metricRow}>
        <MetricPill label="Total" value={counts.total.toString()} />
        <MetricPill label="Pending" value={counts.pending.toString()} />
      </View>

      <StatusBanner
        title="Todos belong to areas"
        body="Create todos from inside a specific area, or tap one below to view details."
      />

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

      <SectionTitle title="All todos" subtitle="Grouped by area." />

      {loading ? (
        <LoadingStateCard title="Loading todos..." />
      ) : error ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Couldn't load todos</Text>
          <Text style={styles.noticeBody}>{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyStateCard
          icon="todo"
          title="No todos found"
          description={
            filter === 'archived'
              ? 'Archived todos will appear here.'
              : filter === 'all'
                ? "Once you add todos inside an area, they'll show up here."
                : `No ${filter.replace('_', ' ')} todos right now.`
          }
        />
      ) : (
        <View style={styles.list}>
          {Object.entries(grouped).map(([areaName, areaTodos]) => (
            <View key={areaName}>
              <Text style={styles.groupHeader}>{areaName}</Text>
              {areaTodos.map((todo) => (
                <TouchableOpacity
                  key={todo.id}
                  onPress={() =>
                    navigation.navigate('Todo', { todoId: todo.id })
                  }
                  style={styles.card}
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
                  {todo.reminder_at ? (
                    <Text style={styles.reminderMeta}>
                      Reminder: {formatReminder(todo.reminder_at)}
                    </Text>
                  ) : null}
                  <View style={styles.cardBottom}>
                    <StatusBadge status={todo.status} />
                    <Text style={styles.cardArea}>
                      {(todo as any).areas?.properties?.name || ''}
                    </Text>
                  </View>
                  {filter === 'archived' ? (
                    <View style={styles.archiveAction}>
                      <TodoArchiveAction
                        todoId={todo.id}
                        archived
                        compact
                        onChanged={refetch}
                      />
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
  },
  metricRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
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
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.elevated,
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
  groupHeader: {
    color: theme.colors.secondary.dark,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
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
    marginBottom: theme.spacing.sm,
  },
  reminderMeta: {
    color: theme.colors.primary.dark,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  cardArea: {
    color: theme.colors.primary.main,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
  },
  archiveAction: {
    marginTop: theme.spacing.sm,
  },
});

export default TodosScreen;
