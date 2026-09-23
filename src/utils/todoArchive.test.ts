import { supabase } from '../lib/supabase';
import {
  getTodoArchiveCounts,
  selectTodosForFilter,
  setTodoArchived,
} from './todoArchive';

jest.mock('../lib/supabase', () => ({ supabase: { from: jest.fn() } }));

const todos = [
  { id: 'pending', status: 'pending' as const, archived_at: null },
  { id: 'progress', status: 'in_progress' as const },
  { id: 'done', status: 'done' as const, archived_at: null },
  {
    id: 'archived',
    status: 'pending' as const,
    archived_at: '2026-09-23T12:00:00.000Z',
  },
];

describe('todo archive selection', () => {
  it('keeps archived todos out of normal views and returns them only in Archived', () => {
    expect(selectTodosForFilter(todos, 'all').map((todo) => todo.id)).toEqual([
      'pending',
      'progress',
      'done',
    ]);
    expect(
      selectTodosForFilter(todos, 'pending').map((todo) => todo.id),
    ).toEqual(['pending']);
    expect(
      selectTodosForFilter(todos, 'archived').map((todo) => todo.id),
    ).toEqual(['archived']);
  });

  it('excludes archived records from total and pending counts', () => {
    expect(getTodoArchiveCounts(todos)).toEqual({
      total: 3,
      pending: 2,
      archived: 1,
    });
  });
});

describe('todo archive persistence', () => {
  const single = jest.fn();
  const select = jest.fn(() => ({ single }));
  const eq = jest.fn(() => ({ select }));
  const update = jest.fn(() => ({ eq }));

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnValue({ update });
  });

  it('archives and restores without changing any other todo field', async () => {
    single.mockResolvedValue({ data: { id: 'todo-1' }, error: null });
    const archivedAt = new Date('2026-09-23T12:34:56.000Z');

    await setTodoArchived('todo-1', true, () => archivedAt);
    expect(update).toHaveBeenCalledWith({
      archived_at: archivedAt.toISOString(),
    });
    expect(eq).toHaveBeenCalledWith('id', 'todo-1');
    expect(select).toHaveBeenCalledWith('id');
    expect(single).toHaveBeenCalledTimes(1);

    await setTodoArchived('todo-1', false);
    expect(update).toHaveBeenLastCalledWith({ archived_at: null });
  });

  it('reports a zero-row or RLS failure instead of claiming success', async () => {
    const denied = { code: 'PGRST116', message: 'No rows returned' };
    single.mockResolvedValue({ data: null, error: denied });

    await expect(setTodoArchived('hidden', true)).rejects.toBe(denied);
  });
});
