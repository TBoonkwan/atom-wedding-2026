export type DraftTheme = 'neon-editorial' | 'pop-postcard' | 'afterdark-ticket';

export type DraftOption = {
  id: DraftTheme;
  number: string;
  title: string;
  strapline: string;
  description: string;
  href: `/drafts/${DraftTheme}`;
  palette: readonly string[];
};

export const WEDDING_DRAFT_FACTS = {
  names: 'NATHAPOL & PENNISUT',
  date: '04.12.2026',
  time: 'FRIDAY · 15:00',
  venue: 'CELEBCE VENUE',
  programme: 'Tea ceremony · Dinner · After party',
} as const;

export const DRAFTS: readonly DraftOption[] = [
  {
    id: 'neon-editorial',
    number: '01',
    title: 'Neon Editorial Party',
    strapline: 'Fashion campaign meets Bangkok after-party',
    description: 'Electric, oversized, energetic.',
    href: '/drafts/neon-editorial',
    palette: ['#120b0b', '#ff4b4b', '#ff2f88', '#d9ff43'],
  },
  {
    id: 'pop-postcard',
    number: '02',
    title: 'Pop Postcard Collage',
    strapline: 'A joyful love note with a graphic-design pulse',
    description: 'Warm, playful, art-directed.',
    href: '/drafts/pop-postcard',
    palette: ['#fff8e8', '#e53a31', '#f3a7b3', '#1545c7', '#087f78'],
  },
  {
    id: 'afterdark-ticket',
    number: '03',
    title: 'Afterdark Ticket Club',
    strapline: 'One ceremony. One admission. One big night.',
    description: 'Cinematic, premium, club-ready.',
    href: '/drafts/afterdark-ticket',
    palette: ['#050710', '#4b0b1b', '#f33b3f', '#dce0e8'],
  },
] as const;

export function getDraft(theme: DraftTheme) {
  return DRAFTS.find((draft) => draft.id === theme)!;
}
