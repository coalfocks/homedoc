import { supabase } from '../lib/supabase';
import { saveDraftRecord } from './saveDraftRecord';

jest.mock('../lib/supabase', () => ({ supabase: { from: jest.fn() } }));

it('recovers a committed insert after a lost response without creating another record', async () => {
  const records = new Map<string, unknown>();
  const record = { id: 'same-draft', title: 'Repair photo', area_id: 'room' };
  const insert = jest.fn(async ([row]) => {
    if (records.has(row.id)) return { error: { code: '23505' } };
    records.set(row.id, row);
    return { error: new Error('response lost after commit') };
  });
  const single = jest.fn().mockResolvedValue({ error: null });
  const select = jest.fn(() => ({ single }));
  const eq = jest.fn(() => ({ select }));
  const update = jest.fn(() => ({ eq }));
  (supabase.from as jest.Mock).mockReturnValue({ insert, update });
  await expect(saveDraftRecord('notes', record)).rejects.toThrow(
    'response lost',
  );
  await expect(saveDraftRecord('notes', record)).resolves.toBeUndefined();
  expect(records.size).toBe(1);
  expect(update).toHaveBeenCalledWith(record);
  expect(eq).toHaveBeenCalledWith('id', record.id);
  expect(single).toHaveBeenCalled();
});

it('does not report success when access to a previously saved draft was revoked', async () => {
  const denied = new Error('Record is no longer accessible');
  (supabase.from as jest.Mock).mockReturnValue({
    insert: jest.fn().mockResolvedValue({ error: { code: '23505' } }),
    update: () => ({
      eq: () => ({
        select: () => ({ single: async () => ({ error: denied }) }),
      }),
    }),
  });
  await expect(saveDraftRecord('properties', { id: 'revoked' })).rejects.toBe(
    denied,
  );
});

it('propagates permission failures without attempting an update', async () => {
  const denied = { code: '42501', message: 'Permission denied' };
  const update = jest.fn();
  (supabase.from as jest.Mock).mockReturnValue({
    insert: async () => ({ error: denied }),
    update,
  });
  await expect(saveDraftRecord('areas', { id: 'forbidden' })).rejects.toBe(
    denied,
  );
  expect(update).not.toHaveBeenCalled();
});
