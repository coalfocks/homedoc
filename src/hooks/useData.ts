import { useState, useEffect, useCallback } from 'react';
import { supabase, Property, Area, Note } from '../lib/supabase';

/**
 * Generic hook for Supabase queries with loading/error state.
 * @param queryFn - async function returning { data, error }
 * @param deps - dependency array; re-fetches when these change
 */
function useSupabaseQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>,
  deps: any[],
): { data: T; loading: boolean; error: string | null; refetch: () => void } {
  const [data, setData] = useState<T>(null as unknown as T);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await queryFn();
      if (result.error) throw result.error;
      setData((result.data ?? null) as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ── Collection hooks ──────────────────────────────────────────────

export const useProperties = (userId: string | undefined) => {
  const result = useSupabaseQuery<Property[]>(
    () => {
      if (!userId) return Promise.resolve({ data: [] as Property[], error: null });
      return supabase.from('properties').select('*').eq('user_id', userId);
    },
    [userId],
  );
  return { properties: result.data, loading: result.loading, error: result.error, refetch: result.refetch };
};

export const useAreas = (propertyId: string | undefined) => {
  const result = useSupabaseQuery<Area[]>(
    () => {
      if (!propertyId) return Promise.resolve({ data: [] as Area[], error: null });
      return supabase.from('areas').select('*').eq('property_id', propertyId);
    },
    [propertyId],
  );
  return { areas: result.data, loading: result.loading, error: result.error, refetch: result.refetch };
};

export const useNotes = (areaId: string | undefined) => {
  const result = useSupabaseQuery<Note[]>(
    () => {
      if (!areaId) return Promise.resolve({ data: [] as Note[], error: null });
      return supabase.from('notes').select('*').eq('area_id', areaId);
    },
    [areaId],
  );
  return { notes: result.data, loading: result.loading, error: result.error, refetch: result.refetch };
};

// ── Single-item hooks ─────────────────────────────────────────────

export const useProperty = (propertyId: string | undefined) => {
  const result = useSupabaseQuery<Property | null>(
    () => {
      if (!propertyId) return Promise.resolve({ data: null, error: null });
      return supabase.from('properties').select('*').eq('id', propertyId).single();
    },
    [propertyId],
  );
  return { property: result.data, loading: result.loading, error: result.error, refetch: result.refetch };
};

export const useArea = (areaId: string | undefined) => {
  const result = useSupabaseQuery<Area | null>(
    () => {
      if (!areaId) return Promise.resolve({ data: null, error: null });
      return supabase.from('areas').select('*').eq('id', areaId).single();
    },
    [areaId],
  );
  return { area: result.data, loading: result.loading, error: result.error, refetch: result.refetch };
};

export const useNote = (noteId: string | undefined) => {
  const result = useSupabaseQuery<Note | null>(
    () => {
      if (!noteId) return Promise.resolve({ data: null, error: null });
      return supabase.from('notes').select('*').eq('id', noteId).single();
    },
    [noteId],
  );
  return { note: result.data, loading: result.loading, error: result.error, refetch: result.refetch };
};

// ── Cross-property hooks ──────────────────────────────────────────

export const useAllAreas = (userId: string | undefined) => {
  const result = useSupabaseQuery<Area[]>(
    () => {
      if (!userId) return Promise.resolve({ data: [] as Area[], error: null });
      return supabase.from('areas').select('*, properties!inner(name, id)').eq('properties.user_id', userId);
    },
    [userId],
  );
  return { areas: result.data, loading: result.loading, error: result.error, refetch: result.refetch };
};

export const useAllNotes = (userId: string | undefined) => {
  const result = useSupabaseQuery<Note[]>(
    () => {
      if (!userId) return Promise.resolve({ data: [] as Note[], error: null });
      return supabase
        .from('notes')
        .select('*, areas!inner(property_id), areas(properties!inner(user_id))')
        .eq('areas.properties.user_id', userId);
    },
    [userId],
  );
  return { notes: result.data, loading: result.loading, error: result.error, refetch: result.refetch };
};
