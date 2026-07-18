import { z } from 'zod';
import { RSVP_EDIT_CUTOFF, RSVP_SOFT_DEADLINE } from './event';

export const rsvpSchema = z
  .object({
    status: z.enum(['accepted', 'maybe', 'rejected']),
    adultCount: z.number().int().min(0).max(300),
    childCount: z.number().int().min(0).max(300),
    childSeatCount: z.number().int().min(0).max(300),
    dietaryNotes: z.string().trim().max(500),
    accessibilityNotes: z.string().trim().max(500),
    beerPreference: z.enum(['ipa', 'lager', 'wheat', 'none']),
    songRequest: z.string().trim().max(160),
    reason: z.string().trim().max(500),
  })
  .superRefine((value, context) => {
    if (value.status === 'accepted' && value.adultCount + value.childCount < 1) {
      context.addIssue({
        code: 'custom',
        message: 'กรุณาระบุจำนวนผู้ร่วมงานอย่างน้อย 1 คน',
        path: ['adultCount'],
      });
    }

    if (value.adultCount + value.childCount > 300) {
      context.addIssue({
        code: 'custom',
        message: 'จำนวนผู้ร่วมงานรวมต้องไม่เกิน 300 คน',
        path: ['adultCount'],
      });
    }

    if (value.childSeatCount > value.childCount) {
      context.addIssue({
        code: 'custom',
        message: 'จำนวนเก้าอี้เด็กต้องไม่มากกว่าจำนวนเด็ก',
        path: ['childSeatCount'],
      });
    }

    if (value.status !== 'accepted' && value.reason.length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'กรุณาบอกเหตุผลสั้น ๆ ให้เราทราบ',
        path: ['reason'],
      });
    }
  });

export function validateRsvp(input: unknown) {
  return rsvpSchema.safeParse(input);
}

export function canEditRsvp(now = new Date()) {
  return now.getTime() < RSVP_EDIT_CUTOFF.getTime();
}

export function isLateRsvp(now = new Date()) {
  return now.getTime() > RSVP_SOFT_DEADLINE.getTime();
}
