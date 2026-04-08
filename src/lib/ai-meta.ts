export type AIRequestedProvider = 'gemini' | 'groq';
export type AIExecutionMode = 'ai' | 'fallback' | 'unknown';
export type AIExecutionProvider = AIRequestedProvider | 'local';

export interface AIExecutionMeta {
  mode: AIExecutionMode;
  provider: AIExecutionProvider;
  requestedProvider: AIRequestedProvider;
  model: string | null;
  fallbackReason: string | null;
}

export interface AIResult<T> {
  data: T;
  meta: AIExecutionMeta;
}

function providerName(provider: AIRequestedProvider) {
  switch (provider) {
    case 'gemini':
    case 'groq':
      return 'Nextern AI';
  }
}

export function buildAIProviderMeta(
  requestedProvider: AIRequestedProvider,
  model: string
): AIExecutionMeta {
  return {
    mode: 'ai',
    provider: requestedProvider,
    requestedProvider,
    model,
    fallbackReason: null,
  };
}

export function buildAIFallbackMeta(
  requestedProvider: AIRequestedProvider,
  fallbackReason: string,
  model = 'local-backup'
): AIExecutionMeta {
  return {
    mode: 'fallback',
    provider: 'local',
    requestedProvider,
    model,
    fallbackReason,
  };
}

export function buildUnknownAIMeta(requestedProvider: AIRequestedProvider): AIExecutionMeta {
  return {
    mode: 'unknown',
    provider: 'local',
    requestedProvider,
    model: null,
    fallbackReason: null,
  };
}

export function sanitizeAIProviderError(provider: AIRequestedProvider, error: unknown) {
  const name = providerName(provider);
  const message = error instanceof Error ? error.message.trim().toLowerCase() : '';

  if (message.includes('api_key') || message.includes('not configured')) {
    return `${name} is not configured for this environment.`;
  }

  if (
    message.includes('503') ||
    message.includes('service unavailable') ||
    message.includes('high demand')
  ) {
    return `${name} is experiencing high demand right now.`;
  }

  if (message.includes('429') || message.includes('rate limit')) {
    return `${name} is rate-limited right now.`;
  }

  if (message.includes('empty response')) {
    return `${name} returned an empty response.`;
  }

  if (
    message.includes('invalid json') ||
    message.includes('invalid response') ||
    message.includes('did not return')
  ) {
    return `${name} returned an invalid response.`;
  }

  return `${name} is temporarily unavailable.`;
}

export function describeAIExecutionMeta(meta: AIExecutionMeta) {
  const requestedName = providerName(meta.requestedProvider);

  if (meta.mode === 'ai') {
    return {
      badgeLabel: 'Nextern AI Generated',
      badgeTone: 'info' as const,
      detail: `${requestedName} completed this request successfully.`,
    };
  }

  if (meta.mode === 'fallback') {
    const detail = meta.fallbackReason
      ? `${meta.fallbackReason} Local backup logic was used instead.`
      : `${requestedName} did not complete this request, so local backup logic was used instead.`;

    return {
      badgeLabel: 'Fallback-generated',
      badgeTone: 'warning' as const,
      detail,
    };
  }

  return {
    badgeLabel: 'Source unavailable',
    badgeTone: 'neutral' as const,
    detail: 'This saved result was created before provider tracking was enabled.',
  };
}
