import { useState, useEffect } from 'react';
import { supabase, Property, Area, Note } from '../lib/supabase';

export const useProperties = (userId: string | undefined) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    if (!userId) {
      setProperties([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [userId]);

  const refetch = () => {
    fetchProperties();
  };

  return { properties, loading, error, refetch };
};

export const useAreas = (propertyId: string | undefined) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAreas = async () => {
    if (!propertyId) {
      setAreas([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('property_id', propertyId);

      if (error) throw error;
      setAreas(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, [propertyId]);

  const refetch = () => {
    fetchAreas();
  };

  return { areas, loading, error, refetch };
};

export const useNotes = (areaId: string | undefined) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async () => {
    if (!areaId) {
      setNotes([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('area_id', areaId);

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [areaId]);

  const refetch = () => {
    fetchNotes();
  };

  return { notes, loading, error, refetch };
};

export const useProperty = (propertyId: string | undefined) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProperty = async () => {
    if (!propertyId) {
      setProperty(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const refetch = () => {
    fetchProperty();
  };

  return { property, loading, error, refetch };
};

export const useArea = (areaId: string | undefined) => {
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArea = async () => {
    if (!areaId) {
      setArea(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('id', areaId)
        .single();

      if (error) throw error;
      setArea(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArea();
  }, [areaId]);

  const refetch = () => {
    fetchArea();
  };

  return { area, loading, error, refetch };
};

export const useNote = (noteId: string | undefined) => {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNote = async () => {
    if (!noteId) {
      setNote(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) throw error;
      setNote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNote();
  }, [noteId]);

  const refetch = () => {
    fetchNote();
  };

  return { note, loading, error, refetch };
};

export const useAllAreas = (userId: string | undefined) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAreas = async () => {
    if (!userId) {
      setAreas([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('areas')
        .select('*, properties!inner(name, id)')
        .eq('properties.user_id', userId);

      if (error) throw error;
      setAreas((data as any) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreas();
  }, [userId]);

  const refetch = () => {
    fetchAreas();
  };

  return { areas, loading, error, refetch };
};

export const useAllNotes = (userId: string | undefined) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async () => {
    if (!userId) {
      setNotes([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('notes')
        .select('*, areas!inner(property_id), areas(properties!inner(user_id))')
        .eq('areas.properties.user_id', userId);

      if (error) throw error;
      setNotes((data as any) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const refetch = () => {
    fetchNotes();
  };

  return { notes, loading, error, refetch };
};
