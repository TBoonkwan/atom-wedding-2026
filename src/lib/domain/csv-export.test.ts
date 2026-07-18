import { describe, expect, it } from 'vitest';
import { csvCell } from './csv-export';

describe('csvCell', () => {
  it('quotes values and neutralizes spreadsheet formulas', () => {
    expect(csvCell('คุณ "เอ"')).toBe('"คุณ ""เอ"""');
    expect(csvCell('=HYPERLINK("https://bad.example")')).toBe(
      '"\'=HYPERLINK(""https://bad.example"")"',
    );
    expect(csvCell('+441234')).toBe('"\'+441234"');
  });
});
