export function createIsoTimestamp(date = new Date()): string {
  return date.toISOString();
}

export function relativeTimeLabel(date: Date, now = new Date()): string {
  const elapsedSeconds = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1_000));

  if (elapsedSeconds < 10) {
    return "just now";
  }

  if (elapsedSeconds < 60) {
    return `${elapsedSeconds} seconds ago`;
  }

  const minutes = Math.round(elapsedSeconds / 60);
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
}
