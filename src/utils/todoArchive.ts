import { supabase, Todo } from '../lib/supabase';

export type TodoListFilter =
  | 'all'
  | 'pending'
  | 'in_progress'
  | 'done'
  | 'archived';

export const isTodoArchived = (todo: Pick<Todo, 'archived_at'>) =>
  Boolean(todo.archived_at);

export const getActiveTodos = <T extends Pick<Todo, 'archived_at'>>(
  todos: T[],
) => todos.filter((todo) => !isTodoArchived(todo));

export const selectTodosForFilter = <
  T extends Pick<Todo, 'archived_at' | 'status'>,
>(
  todos: T[],
  filter: TodoListFilter,
) => {
  if (filter === 'archived') {
    return todos.filter(isTodoArchived);
  }

  const activeTodos = getActiveTodos(todos);
  return filter === 'all'
    ? activeTodos
    : activeTodos.filter((todo) => todo.status === filter);
};

export const getTodoArchiveCounts = <
  T extends Pick<Todo, 'archived_at' | 'status'>,
>(
  todos: T[],
) => {
  const activeTodos = getActiveTodos(todos);
  return {
    total: activeTodos.length,
    pending: activeTodos.filter((todo) => todo.status !== 'done').length,
    archived: todos.length - activeTodos.length,
  };
};

export const setTodoArchived = async (
  todoId: string,
  archived: boolean,
  now: () => Date = () => new Date(),
) => {
  const archivedAt = archived ? now().toISOString() : null;
  const { error } = await supabase
    .from('todos')
    .update({ archived_at: archivedAt })
    .eq('id', todoId)
    .select('id')
    .single();

  if (error) throw error;
};
