export function localObservationMinute(timestamp: string): string {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function observationTimeForSave(localValue: string, original?: string | null): string {
  // Editing another field must not truncate the source's seconds or milliseconds.
  if (original && localValue === localObservationMinute(original)) return original;
  return new Date(localValue).toISOString();
}
