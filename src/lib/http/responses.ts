export function jsonError(error: unknown, status = 400) {
  const fallback = 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  const message = error instanceof Error && /[\u0E00-\u0E7F]/.test(error.message)
    ? error.message
    : fallback;
  return Response.json({ error: message }, { status });
}
