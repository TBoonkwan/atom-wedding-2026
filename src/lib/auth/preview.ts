export function isPreviewAuthorized(authorization: string | null, expectedPassword: string | undefined) {
  if (!expectedPassword) return true;
  if (!authorization?.startsWith('Basic ')) return false;
  try {
    const decoded = atob(authorization.slice(6));
    const separator = decoded.indexOf(':');
    return separator >= 0 && decoded.slice(separator + 1) === expectedPassword;
  } catch {
    return false;
  }
}
