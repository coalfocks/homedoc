import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  supabase,
  Property,
  Area,
  Note,
  Todo,
  ContractorAreaAccess,
} from '../lib/supabase';

/**
 * Generic hook for Supabase queries with loading/error state.
 * @param queryFn - async function returning { data, error }
 * @param deps - dependency array; re-fetches when these change
 */
function useSupabaseQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  deps: any[],
  initialData: T,
): { data: T; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      if (result.error) throw result.error;
      setData((result.data ?? initialData) as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, deps);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return { data, loading, error, refetch: fetchData };
}

// ── Collection hooks ──────────────────────────────────────────────

export const useProperties = (userId: string | undefined) => {
  const result = useSupabaseQuery<Property[]>(
    () => {
      if (!userId)
        return Promise.resolve({ data: [] as Property[], error: null });
      return supabase.from('properties').select('*').eq('user_id', userId);
    },
    [userId],
    [],
  );
  return {
    properties: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useAreas = (propertyId: string | undefined) => {
  const result = useSupabaseQuery<Area[]>(
    () => {
      if (!propertyId)
        return Promise.resolve({ data: [] as Area[], error: null });
      return supabase.from('areas').select('*').eq('property_id', propertyId);
    },
    [propertyId],
    [],
  );
  return {
    areas: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useNotes = (areaId: string | undefined) => {
  const result = useSupabaseQuery<Note[]>(
    () => {
      if (!areaId) return Promise.resolve({ data: [] as Note[], error: null });
      return supabase.from('notes').select('*').eq('area_id', areaId);
    },
    [areaId],
    [],
  );
  return {
    notes: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

// ── Single-item hooks ─────────────────────────────────────────────

export const useProperty = (propertyId: string | undefined) => {
  const result = useSupabaseQuery<Property | null>(
    () => {
      if (!propertyId) return Promise.resolve({ data: null, error: null });
      return supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
    },
    [propertyId],
    null,
  );
  return {
    property: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useArea = (areaId: string | undefined) => {
  const result = useSupabaseQuery<Area | null>(
    () => {
      if (!areaId) return Promise.resolve({ data: null, error: null });
      return supabase
        .from('areas')
        .select('*, properties(id, name, user_id)')
        .eq('id', areaId)
        .single();
    },
    [areaId],
    null,
  );
  return {
    area: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useNote = (noteId: string | undefined) => {
  const result = useSupabaseQuery<Note | null>(
    () => {
      if (!noteId) return Promise.resolve({ data: null, error: null });
      return supabase.from('notes').select('*').eq('id', noteId).single();
    },
    [noteId],
    null,
  );
  return {
    note: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

// ── Todo hooks ───────────────────────────────────────────────────

export const useTodos = (areaId: string | undefined) => {
  const result = useSupabaseQuery<Todo[]>(
    () => {
      if (!areaId) return Promise.resolve({ data: [] as Todo[], error: null });
      return supabase.from('todos').select('*').eq('area_id', areaId);
    },
    [areaId],
    [],
  );
  return {
    todos: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useTodo = (todoId: string | undefined) => {
  const result = useSupabaseQuery<Todo | null>(
    () => {
      if (!todoId) return Promise.resolve({ data: null, error: null });
      return supabase.from('todos').select('*').eq('id', todoId).single();
    },
    [todoId],
    null,
  );
  return {
    todo: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

// ── Cross-property hooks ──────────────────────────────────────────

export const useAllAreas = (userId: string | undefined) => {
  const result = useSupabaseQuery<Area[]>(
    () => {
      if (!userId) return Promise.resolve({ data: [] as Area[], error: null });
      return supabase
        .from('areas')
        .select('*, properties!inner(name, id)')
        .eq('properties.user_id', userId);
    },
    [userId],
    [],
  );
  return {
    areas: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useContractorAreaAccess = (
  areaId: string | undefined,
  userId: string | undefined,
) => {
  const result = useSupabaseQuery<ContractorAreaAccess[]>(
    () => {
      if (!areaId || !userId) {
        return Promise.resolve({
          data: [] as ContractorAreaAccess[],
          error: null,
        });
      }

      return supabase
        .from('contractor_area_access')
        .select('*')
        .eq('area_id', areaId)
        .eq('status', 'active');
    },
    [areaId, userId],
    [],
  );

  return {
    access: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useAssignedContractorAreas = (userId: string | undefined) => {
  const result = useSupabaseQuery<ContractorAreaAccess[]>(
    () => {
      if (!userId) {
        return Promise.resolve({
          data: [] as ContractorAreaAccess[],
          error: null,
        });
      }

      return supabase
        .from('contractor_area_access')
        .select('*, areas(*, properties(id, name, user_id))')
        .eq('contractor_user_id', userId)
        .eq('status', 'active');
    },
    [userId],
    [],
  );

  return {
    assignments: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useAllNotes = (userId: string | undefined) => {
  const result = useSupabaseQuery<Note[]>(
    () => {
      if (!userId) return Promise.resolve({ data: [] as Note[], error: null });
      return supabase
        .from('notes')
        .select(
          '*, areas!inner(id, name, property_id, properties!inner(id, name, user_id))',
        )
        .eq('areas.properties.user_id', userId);
    },
    [userId],
    [],
  );
  return {
    notes: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};

export const useTodosByProperty = (userId: string | undefined) => {
  const result = useSupabaseQuery<Todo[]>(
    () => {
      if (!userId) return Promise.resolve({ data: [] as Todo[], error: null });
      return supabase
        .from('todos')
        .select(
          '*, areas!inner(id, name, property_id, properties!inner(id, name, user_id))',
        )
        .eq('areas.properties.user_id', userId);
    },
    [userId],
    [],
  );
  return {
    todos: result.data,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
};
