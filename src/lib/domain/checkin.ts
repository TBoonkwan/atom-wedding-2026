import type { CheckIn } from './types';

export function mergeCheckIn(checkIns: CheckIn[], incoming: CheckIn) {
  const existingIndex = checkIns.findIndex(
    (checkIn) => checkIn.invitationId === incoming.invitationId,
  );

  if (existingIndex === -1) {
    return [...checkIns, incoming];
  }

  return checkIns.map((checkIn, index) => (index === existingIndex ? incoming : checkIn));
}
