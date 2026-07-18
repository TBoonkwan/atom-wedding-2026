import { describe, expect, it } from 'vitest';
import { buildCalendarUrls, createWeddingIcs } from './calendar';

describe('wedding calendar', () => {
  it('creates a Bangkok-time ICS event with the venue', () => {
    const ics = createWeddingIcs('demo-token');

    expect(ics).toContain('DTSTART;TZID=Asia/Bangkok:20261204T150000');
    expect(ics).toContain('DTEND;TZID=Asia/Bangkok:20261204T220000');
    expect(ics).toContain('LOCATION:Celebce Venue');
    expect(ics).toContain('UID:wedding-');
    expect(ics).not.toContain('demo-token');
  });

  it('builds Google and ICS links without exposing a different invitation', () => {
    const links = buildCalendarUrls('ABC123', 'https://wedding.example');

    expect(links.google).toContain('calendar.google.com');
    expect(links.ics).toBe('https://wedding.example/api/calendar/ABC123.ics');
  });
});
