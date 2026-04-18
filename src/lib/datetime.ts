const DHAKA_TIME_ZONE = 'Asia/Dhaka';

export function formatDhakaDateTime(value?: string | Date | null, fallback = 'No deadline') {
  if (!value) return fallback;

  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: DHAKA_TIME_ZONE,
  }).format(new Date(value));
}
