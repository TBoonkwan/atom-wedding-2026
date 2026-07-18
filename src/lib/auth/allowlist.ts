export function isAllowedHostEmail(email: string, allowlist: string | undefined) {
  if (!allowlist) return false;
  const normalized = email.trim().toLowerCase();
  return allowlist
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}
