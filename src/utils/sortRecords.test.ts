import { sortRecords } from './sortRecords';

const records = [
  { id: '3', name: 'Garage 10', created_at: '2024-03-03T00:00:00Z' },
  { id: '1', name: 'Attic', created_at: '2024-03-01T00:00:00Z' },
  { id: '2', name: 'Garage 2', created_at: '2024-03-02T00:00:00Z' },
];

describe('sortRecords', () => {
  it('sorts alphabetically with numeric labels by default', () => {
    const sorted = sortRecords(
      records,
      'alphabetical',
      (record) => record.name,
    );

    expect(sorted.map((record) => record.id)).toEqual(['1', '2', '3']);
  });

  it('sorts by newest created date', () => {
    const sorted = sortRecords(records, 'newest', (record) => record.name);

    expect(sorted.map((record) => record.id)).toEqual(['3', '2', '1']);
  });

  it('sorts by oldest created date', () => {
    const sorted = sortRecords(records, 'oldest', (record) => record.name);

    expect(sorted.map((record) => record.id)).toEqual(['1', '2', '3']);
  });
});
