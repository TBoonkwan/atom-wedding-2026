export function trustedClientKey(
  request: Request,
  environment: Record<string, string | undefined>,
) {
  if (environment.VERCEL !== '1') return 'local';
  return request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || 'vercel-unknown';
}
