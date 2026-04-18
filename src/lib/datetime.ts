const DHAKA_TIME_ZONE = 'Asia/Dhaka';
const DHAKA_UTC_OFFSET_MINUTES = 6 * 60;
const DATETIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

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

export function dhakaDateTimeInputToISOString(value?: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();

  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = DATETIME_LOCAL_PATTERN.exec(trimmed);
  if (match) {
    const [, year, month, day, hour, minute, second = '0'] = match;
    const utcMillis =
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      ) -
      DHAKA_UTC_OFFSET_MINUTES * 60 * 1000;
    return new Date(utcMillis).toISOString();
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}
