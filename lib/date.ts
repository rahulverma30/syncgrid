/**
 * Lightweight, native, and dependency-free date utilities.
 * Leverages native ECMAScript Intl APIs.
 */

export function formatDistanceToNow(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';

  // Native duration intervals
  const intervals: { [key: string]: number } = {
    y: 31536000,
    mo: 2592000,
    w: 604800,
    d: 86400,
    h: 3600,
    m: 60,
    s: 1,
  };

  for (const [unit, value] of Object.entries(intervals)) {
    const count = Math.floor(seconds / value);
    if (count >= 1) {
      return `${count}${unit}`;
    }
  }

  return 'just now';
}

export function formatDate(dateInput: Date | string | number): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
