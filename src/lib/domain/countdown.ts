export function getCountdownParts(now: Date, target: Date) {
  const difference = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(difference / 1_000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    complete: difference === 0,
  };
}
