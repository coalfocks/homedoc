export type SortOrder = 'alphabetical' | 'newest' | 'oldest';

type SortableRecord = {
  created_at?: string | null;
};

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

export const sortRecords = <T extends SortableRecord>(
  records: T[],
  order: SortOrder,
  getLabel: (record: T) => string | null | undefined,
) =>
  [...records].sort((a, b) => {
    if (order === 'newest' || order === 'oldest') {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return order === 'newest' ? bTime - aTime : aTime - bTime;
    }

    const byName = collator.compare(
      getLabel(a)?.trim() || '',
      getLabel(b)?.trim() || '',
    );
    if (byName !== 0) return byName;

    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return aTime - bTime;
  });
