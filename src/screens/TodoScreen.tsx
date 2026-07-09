import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTodo } from '../hooks/useData';
import { supabase } from '../lib/supabase';
import {
  EmptyStateCard,
  PageHeader,
  PriorityBadge,
  Screen,
  SectionTitle,
  StatusBadge,
} from '../components/AppChrome';
import { PlanPanel } from '../components/PlanPanel';
import { theme } from '../utils/theme';

type TodoScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Todo'>;
  route: RouteProp<RootStackParamList, 'Todo'>;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const statusOptions: {
  label: string;
  value: 'pending' | 'in_progress' | 'done';
}[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

const TodoScreen: React.FC<TodoScreenProps> = ({ navigation, route }) => {
  const { todo, loading, error, refetch } = useTodo(route.params.todoId);

  if (loading) {
    return (
      <Screen>
        <PageHeader
          eyebrow="TODO DETAIL"
          title="Loading todo"
          subtitle="Pulling the full record."
        />
      </Screen>
    );
  }

  if (error || !todo) {
    return (
      <Screen>
        <EmptyStateCard
          icon="todo"
          title="Todo not available"
          description={error || 'This todo could not be found.'}
        />
      </Screen>
    );
  }

  const quickStatusChange = async (
    newStatus: 'pending' | 'in_progress' | 'done',
  ) => {
    if (newStatus === todo.status) return;
    const { error: updateError } = await supabase
      .from('todos')
      .update({ status: newStatus })
      .eq('id', todo.id);
    if (!updateError) refetch();
  };

  const areaName = (todo as any).areas?.name || 'Area';

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <PageHeader
        eyebrow="TODO DETAIL"
        title={todo.title}
        subtitle={`Created ${formatDate(todo.created_at)} • Updated ${formatDate(todo.updated_at)}`}
        actionLabel="Edit"
        onActionPress={() =>
          navigation.navigate('EditTodo', { todoId: todo.id })
        }
      />

      <View style={styles.badgeRow}>
        <PriorityBadge priority={todo.priority} />
        <StatusBadge status={todo.status} />
      </View>

      {/* Quick status toggle */}
      <View style={styles.statusRow}>
        {statusOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.statusPill,
              todo.status === opt.value && styles.statusPillActive,
            ]}
            onPress={() => quickStatusChange(opt.value)}
          >
            <Text
              style={[
                styles.statusPillText,
                todo.status === opt.value && styles.statusPillTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {todo.description ? (
        <>
          <SectionTitle title="Description" />
          <View style={styles.bodyCard}>
            <Text style={styles.bodyText}>{todo.description}</Text>
          </View>
        </>
      ) : (
        <EmptyStateCard
          icon="todo"
          title="No description"
          description="Add details by editing this todo."
        />
      )}

      <SectionTitle title="Location" />
      <View style={styles.locationCard}>
        <Text style={styles.locationLabel}>Area</Text>
        <Text style={styles.locationValue}>{areaName}</Text>
      </View>

      <SectionTitle title="Planning" />
      <PlanPanel
        todoId={todo.id}
        plan={todo.plan}
        planStatus={todo.plan_status}
        planChat={todo.plan_chat}
        onPlanGenerated={refetch}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
    flexWrap: 'wrap',
  },
  statusPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  statusPillActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  statusPillText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontSize: 13,
  },
  statusPillTextActive: {
    color: theme.colors.primary.contrast,
  },
  bodyCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.md,
    marginBottom: theme.spacing.xl,
  },
  bodyText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.body1.fontSize,
    lineHeight: theme.typography.body1.lineHeight,
  },
  locationCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...theme.shadows.md,
  },
  locationLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  locationValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '700',
  },
});

export default TodoScreen;
