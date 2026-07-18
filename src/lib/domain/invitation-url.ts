export function invitationPath(token: string) {
  return `/invitation/${encodeURIComponent(token)}`;
}

export function invitationUrl(origin: string, token: string) {
  return new URL(invitationPath(token), origin).toString();
}
