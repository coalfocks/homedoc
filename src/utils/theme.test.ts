import { theme } from './theme';

describe('theme', () => {
  it('has expected primary main color', () => {
    expect(theme.colors.primary.main).toBe('#8A75FF');
  });
});
