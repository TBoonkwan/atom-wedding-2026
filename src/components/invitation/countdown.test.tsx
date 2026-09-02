import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Countdown } from './countdown';

afterEach(() => vi.useRealTimers());

it('uses deterministic countdown markup for the server render', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-01T00:00:00.000Z'));
  const firstRender = renderToString(<Countdown />);

  vi.setSystemTime(new Date('2026-09-01T00:00:01.000Z'));
  const secondRender = renderToString(<Countdown />);

  expect(secondRender).toBe(firstRender);
  expect(firstRender).toContain('--');
});
