export interface GuestImportRow {
  displayName: string;
  contactName: string;
  phone: string;
  email: string;
  hostNotes: string;
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

export function parseGuestCsv(csv: string) {
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { rows: [] as GuestImportRow[], errors: ['ไฟล์ CSV ว่างเปล่า'] };

  const headers = parseCsvLine(lines[0]);
  const requiredHeaders = ['display_name', 'contact_name', 'phone', 'email', 'host_notes'];
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  if (missingHeaders.length > 0) {
    return { rows: [] as GuestImportRow[], errors: [`ไม่พบคอลัมน์ ${missingHeaders.join(', ')}`] };
  }

  const rows: GuestImportRow[] = [];
  const errors: string[] = [];
  const seenContacts = new Set<string>();
  lines.slice(1).forEach((line, rowIndex) => {
    const values = parseCsvLine(line);
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? '']));
    if (!record.display_name) {
      errors.push(`แถว ${rowIndex + 2}: กรุณาระบุ display_name`);
      return;
    }
    if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      errors.push(`แถว ${rowIndex + 2}: email ไม่ถูกต้อง`);
      return;
    }
    const contactKeys = [
      record.phone ? `phone:${record.phone.replace(/\D/g, '')}` : '',
      record.email ? `email:${record.email.toLowerCase()}` : '',
    ].filter(Boolean);
    if (contactKeys.some((key) => seenContacts.has(key))) {
      errors.push(`แถว ${rowIndex + 2}: ข้อมูลติดต่อซ้ำในไฟล์`);
      return;
    }
    contactKeys.forEach((key) => seenContacts.add(key));
    rows.push({
      displayName: record.display_name,
      contactName: record.contact_name || record.display_name,
      phone: record.phone,
      email: record.email,
      hostNotes: record.host_notes,
    });
  });

  return { rows, errors };
}
