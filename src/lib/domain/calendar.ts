import { EVENT_END, EVENT_START, WEDDING } from './event';
import { hashToken } from './security';

function escapeIcs(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

export function createWeddingIcs(token: string) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NP Wedding//Invitation//TH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:wedding-${hashToken(token).slice(0, 24)}@np-wedding`,
    'DTSTAMP:20260717T000000Z',
    'DTSTART;TZID=Asia/Bangkok:20261204T150000',
    'DTEND;TZID=Asia/Bangkok:20261204T220000',
    `SUMMARY:${escapeIcs(`พิธีมงคลสมรส ${WEDDING.couple}`)}`,
    `LOCATION:${escapeIcs(`${WEDDING.venue}, ${WEDDING.address}`)}`,
    `DESCRIPTION:${escapeIcs(`ร่วมฉลองวันสำคัญของ ${WEDDING.couple} เวลา 15:00–22:00 น. แผนที่: ${WEDDING.mapUrl}`)}`,
    `URL:${WEDDING.mapUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

function googleDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.000/, '');
}

export function buildCalendarUrls(token: string, origin: string) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `พิธีมงคลสมรส ${WEDDING.couple}`,
    dates: `${googleDate(EVENT_START)}/${googleDate(EVENT_END)}`,
    ctz: 'Asia/Bangkok',
    location: `${WEDDING.venue}, ${WEDDING.address}`,
    details: `รายละเอียดและแผนที่ ${WEDDING.mapUrl}`,
  });

  return {
    google: `https://calendar.google.com/calendar/render?${params.toString()}`,
    ics: `${origin}/api/calendar/${encodeURIComponent(token)}.ics`,
  };
}
