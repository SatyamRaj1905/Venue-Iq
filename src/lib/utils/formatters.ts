export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatDistance(metres: number): string {
  if (metres < 1_000) {
    return `${Math.round(metres)} m`;
  }

  return `${(metres / 1_000).toFixed(1)} km`;
}

export function formatDuration(minutes: number): string {
  return `${Math.max(1, Math.round(minutes))} min`;
}

export function formatUpdatedAt(date: Date, locale = "en"): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  }).format(date);
}
