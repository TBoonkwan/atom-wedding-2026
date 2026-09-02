import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const styles = readFileSync(
  resolve(process.cwd(), 'src/components/invitation/canva-wedding.module.css'),
  'utf8',
);

it('keeps the smallest mobile layout readable and touch friendly', () => {
  const mobileStyles = styles.slice(styles.indexOf('@media (max-width: 600px)'));

  expect(mobileStyles).toMatch(/\.timeline\s*\{[^}]*grid-template-columns:\s*1fr/s);
  expect(mobileStyles).toMatch(/\.timeline li\s*\{[^}]*font-size:\s*\.8rem/s);
  expect(mobileStyles).toMatch(/\.dateLink\s*\{[^}]*min-height:\s*44px/s);
  expect(mobileStyles).toMatch(/\.namesBlock h1\s*\{[^}]*white-space:\s*nowrap/s);
});
