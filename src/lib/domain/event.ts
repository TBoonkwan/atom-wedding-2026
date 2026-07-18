export const EVENT_TIME_ZONE = 'Asia/Bangkok';
export const EVENT_START = new Date('2026-12-04T08:00:00.000Z');
export const EVENT_END = new Date('2026-12-04T15:00:00.000Z');
export const RSVP_SOFT_DEADLINE = new Date('2026-11-27T16:59:59.000Z');
export const RSVP_EDIT_CUTOFF = EVENT_START;

export const WEDDING = {
  couple: 'ณัฐพล & เพ็ญพิสุทธิ์',
  coupleEnglish: 'Nathapol & Pennisut',
  dateLabel: 'วันศุกร์ที่ 4 ธันวาคม 2569',
  venue: 'Celebce Venue',
  address:
    'เลขที่ 58 หมู่ 8 ประชาชื่น–ปากเกร็ด ซอย 3 ตำบลบางตลาด อำเภอปากเกร็ด นนทบุรี 11120',
  mapUrl: 'https://share.google/m3zGggUxfeZ9WIHUw',
} as const;

export const TIMELINE = [
  { time: '15:00', title: 'พิธีแห่ขันหมาก', icon: '囍' },
  { time: '15:40', title: 'พิธียกน้ำชา', icon: '茶' },
  { time: '17:00', title: 'พิธีรดน้ำสังข์', icon: '水' },
  { time: '18:00–20:00', title: 'พิธีมงคลสมรส', icon: '宴' },
  { time: '20:00–22:00', title: 'After Party', icon: '啤' },
] as const;
