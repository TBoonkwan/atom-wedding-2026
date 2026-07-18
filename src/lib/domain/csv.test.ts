import { describe, expect, it } from 'vitest';
import { parseGuestCsv } from './csv';

describe('parseGuestCsv', () => {
  it('parses the documented guest columns and normalizes whitespace', () => {
    const result = parseGuestCsv(
      'display_name,contact_name,phone,email,host_notes\n ครอบครัวสุขใจ , คุณเอ ,0812345678,a@example.com,VIP',
    );

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toEqual({
      displayName: 'ครอบครัวสุขใจ',
      contactName: 'คุณเอ',
      phone: '0812345678',
      email: 'a@example.com',
      hostNotes: 'VIP',
    });
  });

  it('reports a row without a display name', () => {
    const result = parseGuestCsv(
      'display_name,contact_name,phone,email,host_notes\n,คุณเอ,,,',
    );

    expect(result.rows).toEqual([]);
    expect(result.errors[0]).toContain('แถว 2');
  });

  it('reports duplicate contacts and malformed email addresses', () => {
    const result = parseGuestCsv([
      'display_name,contact_name,phone,email,host_notes',
      'ครอบครัวเอ,คุณเอ,0812345678,a@example.com,',
      'ครอบครัวเอซ้ำ,คุณเอ,0812345678,a@example.com,',
      'ครอบครัวบี,คุณบี,,not-an-email,',
    ].join('\n'));

    expect(result.errors.join(' ')).toContain('ข้อมูลติดต่อซ้ำ');
    expect(result.errors.join(' ')).toContain('email ไม่ถูกต้อง');
  });
});
