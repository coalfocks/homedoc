import { supabase } from '../lib/supabase';

// The screen retains this draft's id across retries. INSERT avoids the
// existing-row SELECT policies that PostgreSQL also applies to UPSERT.
export const saveDraftRecord = async (
  table: 'properties' | 'areas' | 'notes',
  record: { id: string; [key: string]: unknown },
): Promise<void> => {
  const { error } = await supabase.from(table).insert([record]);
  if (!error) return;
  if (error.code !== '23505') throw error;

  // A previous request may have committed before its response was lost.
  // RLS still authorizes the update. Requiring a returned row prevents a
  // revoked/inaccessible record from looking like a successful retry.
  const { error: updateError } = await supabase
    .from(table)
    .update(record)
    .eq('id', record.id)
    .select('id')
    .single();
  if (updateError) throw updateError;
};
