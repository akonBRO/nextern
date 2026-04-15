import 'server-only';

type Judge0Language = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp';

type Judge0LanguageRecord = {
  id: number;
  name: string;
};

type Judge0SubmissionStatus = {
  id: number;
  description: string;
};

type Judge0SubmissionResult = {
  token?: string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
  status?: Judge0SubmissionStatus | null;
};

export type Judge0ExecutionResult = {
  token?: string;
  status: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  passed: boolean;
};

const LANGUAGE_MATCHERS: Record<Judge0Language, RegExp[]> = {
  javascript: [/javascript/i, /node\.js/i],
  typescript: [/typescript/i],
  python: [/python\s*3/i, /^python$/i],
  java: [/^java\b/i],
  cpp: [/c\+\+/i],
};

let cachedLanguages: Judge0LanguageRecord[] | null = null;
let cachedAt = 0;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJudge0BaseUrl() {
  const value = process.env.JUDGE0_API_BASE_URL?.trim();
  if (!value) {
    throw new Error('JUDGE0_API_BASE_URL is not configured.');
  }
  return value.replace(/\/+$/, '');
}

function getJudge0Headers() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (process.env.JUDGE0_API_KEY?.trim()) {
    headers['X-Auth-Token'] = process.env.JUDGE0_API_KEY.trim();
  }

  if (process.env.JUDGE0_EXTRA_HEADERS_JSON?.trim()) {
    try {
      const extra = JSON.parse(process.env.JUDGE0_EXTRA_HEADERS_JSON.trim()) as Record<
        string,
        string
      >;
      for (const [key, value] of Object.entries(extra)) {
        if (typeof value === 'string' && value.trim()) {
          headers[key] = value.trim();
        }
      }
    } catch {
      throw new Error('JUDGE0_EXTRA_HEADERS_JSON is not valid JSON.');
    }
  }

  return headers;
}

async function judge0Fetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getJudge0BaseUrl()}${path}`, {
    ...init,
    headers: {
      ...getJudge0Headers(),
      ...(init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Judge0 request failed (${response.status}): ${text.slice(0, 300)}`);
  }

  return (await response.json()) as T;
}

async function getJudge0Languages() {
  const now = Date.now();
  if (cachedLanguages && now - cachedAt < 15 * 60 * 1000) {
    return cachedLanguages;
  }

  const languages = await judge0Fetch<Judge0LanguageRecord[]>('/languages');
  cachedLanguages = languages;
  cachedAt = now;
  return languages;
}

export async function resolveJudge0LanguageId(language: Judge0Language) {
  const languages = await getJudge0Languages();
  const matchers = LANGUAGE_MATCHERS[language];
  const found = languages.find((item) => matchers.every((pattern) => pattern.test(item.name)));

  if (found) return found.id;

  const fallback = languages.find((item) => matchers.some((pattern) => pattern.test(item.name)));
  if (fallback) return fallback.id;

  throw new Error(`Judge0 does not expose a supported language ID for "${language}".`);
}

async function pollSubmission(token: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await judge0Fetch<Judge0SubmissionResult>(
      `/submissions/${token}?base64_encoded=false`
    );

    const statusId = result.status?.id ?? 0;
    if (statusId > 2) {
      return result;
    }

    await sleep(700);
  }

  throw new Error('Judge0 submission timed out while waiting for execution.');
}

function cleanOutput(value?: string | null) {
  return typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : '';
}

export async function executeJudge0(input: {
  language: Judge0Language;
  sourceCode: string;
  stdin?: string;
  expectedOutput?: string;
}): Promise<Judge0ExecutionResult> {
  const languageId = await resolveJudge0LanguageId(input.language);
  const created = await judge0Fetch<Judge0SubmissionResult>('/submissions?base64_encoded=false', {
    method: 'POST',
    body: JSON.stringify({
      language_id: languageId,
      source_code: input.sourceCode,
      stdin: input.stdin ?? '',
      expected_output: input.expectedOutput ?? '',
      cpu_time_limit: Number(process.env.JUDGE0_CPU_TIME_LIMIT_SECONDS ?? 3),
      memory_limit: Number(process.env.JUDGE0_MEMORY_LIMIT_KB ?? 262144),
    }),
  });

  if (!created.token) {
    throw new Error('Judge0 did not return a submission token.');
  }

  const result = await pollSubmission(created.token);
  const stdout = cleanOutput(result.stdout);
  const stderr = cleanOutput(result.stderr);
  const compileOutput = cleanOutput(result.compile_output);
  const message = cleanOutput(result.message);
  const description = result.status?.description ?? 'Unknown';
  const expected = cleanOutput(input.expectedOutput);
  const passed =
    expected.length > 0
      ? stdout === expected && !stderr && !compileOutput
      : !stderr && !compileOutput && !message;

  return {
    token: created.token,
    status: description,
    stdout,
    stderr,
    compileOutput,
    message,
    passed,
  };
}
