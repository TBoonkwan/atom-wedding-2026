import { getHostSession } from '@/lib/auth/server';
import { getRepository } from '@/lib/data/get-repository';
import { jsonError } from '@/lib/http/responses';
import { csvCell } from '@/lib/domain/csv-export';

export async function GET() {
  try {
    if (!(await getHostSession())) return jsonError(new Error('ไม่ได้รับอนุญาต'), 401);
    const invitations = await getRepository().listInvitations();
    const header = [
      'display_name', 'contact_name', 'status', 'adults', 'children', 'child_seats',
      'checked_in', 'tables', 'beer', 'dietary_notes', 'accessibility_notes',
      'song_request', 'reason', 'phone', 'email', 'host_notes', 'late_response',
    ];
    const rows = invitations.map((item) => [
      item.displayName, item.contactName, item.status, item.adultCount, item.childCount,
      item.childSeatCount, item.checkedInCount, item.tableNumbers.join('|'),
      item.beerPreference, item.dietaryNotes, item.accessibilityNotes, item.songRequest,
      item.reason, item.phone, item.email, item.hostNotes, String(item.lateResponse),
    ]);
    const body = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    return new Response(`\uFEFF${body}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="np-wedding-guests.csv"',
      },
    });
  } catch (error) {
    return jsonError(error, 500);
  }
}
