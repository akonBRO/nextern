const DEFAULT_PUBLIC_APP_URL = 'https://nextern-virid.vercel.app';

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol =
    trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, '');
}

function isLocalhostUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function getAppBaseUrl() {
  const candidates = [
    process.env.NEXTERN_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    DEFAULT_PUBLIC_APP_URL,
    process.env.VERCEL_URL,
    process.env.NEXTAUTH_URL,
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const normalized = normalizeUrl(candidate);
    if (!normalized) {
      continue;
    }

    if (isLocalhostUrl(normalized)) {
      continue;
    }

    return normalized;
  }

  return DEFAULT_PUBLIC_APP_URL;
}

export function getLoginUrl() {
  return `${getAppBaseUrl()}/login`;
}
