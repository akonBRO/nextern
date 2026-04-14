import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';
import {
  buildAIFallbackMeta,
  buildAIProviderMeta,
  sanitizeAIProviderError,
  type AIResult,
} from '@/lib/ai-meta';

const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const LOCAL_SKILL_GAP_MODEL = 'local-skill-gap';
const LOCAL_TRAINING_MODEL = 'local-training-path';
const LOCAL_CAREER_MODEL = 'local-career-advice';
const LOCAL_QUESTION_MODEL = 'local-interview-questions';
const LOCAL_RECOMMENDATION_MODEL = 'local-smart-job-recommendations';
const GEMINI_RETRY_DELAYS_MS = [800, 1600];

function getGeminiModel(
  generationConfig?: Record<string, unknown>,
  apiKey = process.env.GEMINI_API_KEY,
  apiKeyName = 'GEMINI_API_KEY'
) {
  if (!apiKey) {
    throw new Error(`${apiKeyName} is not configured.`);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048, ...generationConfig },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function geminiErrorMessage(error: unknown) {
  return error instanceof Error ? error.message.trim().toLowerCase() : '';
}

function isRetryableGeminiError(error: unknown) {
  const message = geminiErrorMessage(error);

  return (
    message.includes('503') ||
    message.includes('service unavailable') ||
    message.includes('high demand') ||
    message.includes('429') ||
    message.includes('rate limit') ||
    message.includes('etimedout') ||
    message.includes('econnreset') ||
    message.includes('network')
  );
}

async function generateGeminiContent(
  prompt: string,
  generationConfig?: Record<string, unknown>,
  apiKey?: string,
  apiKeyName?: string
) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= GEMINI_RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await getGeminiModel(generationConfig, apiKey, apiKeyName).generateContent(prompt);
    } catch (error) {
      lastError = error;
      const retryDelay = GEMINI_RETRY_DELAYS_MS[attempt];

      if (retryDelay === undefined || !isRetryableGeminiError(error)) {
        throw error;
      }

      if (process.env.NODE_ENV === 'development') {
        console.warn(`[GEMINI RETRY] Attempt ${attempt + 1} failed. Retrying in ${retryDelay}ms.`);
      }

      await sleep(retryDelay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Gemini request failed.');
}

export async function askGemini(prompt: string): Promise<string> {
  const result = await generateGeminiContent(prompt);
  const text = result.response.text().trim();
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }
  return text;
}

function extractJsonPayload(raw: string): string {
  const clean = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .replace(/^\uFEFF/, '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
  if (!clean) {
    throw new Error('Gemini returned an empty response.');
  }

  const directCandidate = clean.replace(/,\s*([}\]])/g, '$1');
  try {
    JSON.parse(directCandidate);
    return directCandidate;
  } catch {
    // Fall through to substring extraction.
  }

  const balancedCandidates: string[] = [];
  for (let start = 0; start < directCandidate.length; start += 1) {
    const opening = directCandidate[start];
    if (opening !== '{' && opening !== '[') {
      continue;
    }

    const stack: string[] = [opening];
    let inString = false;
    let escaped = false;

    for (let end = start + 1; end < directCandidate.length; end += 1) {
      const char = directCandidate[end];

      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }

        if (char === '\\') {
          escaped = true;
          continue;
        }

        if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{' || char === '[') {
        stack.push(char);
        continue;
      }

      if (char === '}' || char === ']') {
        const last = stack.at(-1);
        const matches = (char === '}' && last === '{') || (char === ']' && last === '[');

        if (!matches) {
          break;
        }

        stack.pop();
        if (stack.length === 0) {
          balancedCandidates.push(directCandidate.slice(start, end + 1).trim());
          break;
        }
      }
    }
  }

  for (const candidate of balancedCandidates) {
    const sanitized = candidate.replace(/,\s*([}\]])/g, '$1');
    try {
      JSON.parse(sanitized);
      return sanitized;
    } catch {
      // Try the next balanced JSON candidate.
    }
  }

  const candidates = [
    { start: directCandidate.indexOf('{'), end: directCandidate.lastIndexOf('}') },
    { start: directCandidate.indexOf('['), end: directCandidate.lastIndexOf(']') },
  ]
    .filter((item) => item.start >= 0 && item.end > item.start)
    .sort((a, b) => a.start - b.start);

  for (const candidate of candidates) {
    const slice = directCandidate.slice(candidate.start, candidate.end + 1).trim();
    const sanitized = slice.replace(/,\s*([}\]])/g, '$1');
    try {
      JSON.parse(sanitized);
      return sanitized;
    } catch {
      // Try the next candidate.
    }
  }

  throw new Error('Gemini returned invalid JSON.');
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function askGeminiJSON<T>(prompt: string): Promise<T> {
  return askGeminiJSONWithConfig<T>(prompt);
}

async function askGeminiJSONWithConfig<T>(
  prompt: string,
  generationConfig?: Record<string, unknown>,
  apiKey?: string,
  apiKeyName?: string
): Promise<T> {
  const result = await generateGeminiContent(
    prompt,
    {
      responseMimeType: 'application/json',
      ...generationConfig,
    },
    apiKey,
    apiKeyName
  );
  const raw = result.response.text().trim();
  if (!raw) {
    throw new Error('Gemini returned an empty response.');
  }

  try {
    return JSON.parse(extractJsonPayload(raw)) as T;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[GEMINI INVALID JSON PREVIEW]', raw.slice(0, 1000));
    }
    throw error;
  }
}

export interface SkillGapResult {
  fitScore: number;
  hardGaps: string[];
  softGaps: string[];
  metRequirements: string[];
  suggestedPath: string[];
  summary: string;
}

const SKILL_GAP_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    fitScore: { type: SchemaType.INTEGER },
    hardGaps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    softGaps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    metRequirements: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    suggestedPath: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    summary: { type: SchemaType.STRING },
  },
  required: ['fitScore', 'hardGaps', 'softGaps', 'metRequirements', 'suggestedPath', 'summary'],
};

function buildFallbackSkillGap(params: {
  studentSkills: string[];
  studentCGPA: number;
  completedCourses: string[];
  jobRequiredSkills: string[];
  jobMinCGPA: number;
  jobRequiredCourses: string[];
  jobExperienceExpectations: string;
  jobTitle: string;
  companyName: string;
}): SkillGapResult {
  const studentSkills = normalizeStringArray(params.studentSkills);
  const requiredSkills = normalizeStringArray(params.jobRequiredSkills);
  const completedCourses = normalizeStringArray(params.completedCourses);
  const requiredCourses = normalizeStringArray(params.jobRequiredCourses);

  const studentSkillSet = new Set(studentSkills.map(normalizeToken));
  const completedCourseSet = new Set(completedCourses.map(normalizeToken));

  const matchedSkills = requiredSkills.filter((skill) =>
    studentSkillSet.has(normalizeToken(skill))
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !studentSkillSet.has(normalizeToken(skill))
  );
  const matchedCourses = requiredCourses.filter((course) =>
    completedCourseSet.has(normalizeToken(course))
  );
  const missingCourses = requiredCourses.filter(
    (course) => !completedCourseSet.has(normalizeToken(course))
  );

  const hardGaps = normalizeStringArray([
    ...missingSkills,
    ...missingCourses.map((course) => `Course: ${course}`),
  ]);

  const softGaps = normalizeStringArray([
    params.jobMinCGPA > 0 && params.studentCGPA < params.jobMinCGPA
      ? `CGPA is below the preferred minimum (${params.studentCGPA.toFixed(2)} vs ${params.jobMinCGPA.toFixed(2)})`
      : '',
    params.jobExperienceExpectations
      ? `Review the experience expectation: ${params.jobExperienceExpectations}`
      : '',
  ]);

  const metRequirements = normalizeStringArray([
    ...matchedSkills,
    ...matchedCourses.map((course) => `Course: ${course}`),
    params.jobMinCGPA <= 0 || params.studentCGPA >= params.jobMinCGPA
      ? 'Meets the CGPA requirement'
      : '',
  ]);

  const skillScore = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 1;
  const courseScore =
    requiredCourses.length > 0 ? matchedCourses.length / requiredCourses.length : 1;
  const cgpaScore = params.jobMinCGPA > 0 ? clamp(params.studentCGPA / params.jobMinCGPA, 0, 1) : 1;

  const fitScore = clamp(Math.round(skillScore * 60 + courseScore * 20 + cgpaScore * 20), 20, 97);

  const suggestedPath = normalizeStringArray([
    ...missingSkills
      .slice(0, 3)
      .map((skill) => `Build a beginner-to-project roadmap for ${skill}.`),
    ...missingCourses
      .slice(0, 2)
      .map(
        (course) =>
          `Review the main topics from ${course} and add one related project to your portfolio.`
      ),
    hardGaps.length === 0
      ? 'Tailor your resume and cover letter to the exact wording in the job requirements.'
      : 'After closing the top gaps, refresh your resume with proof of work and re-run the analysis.',
  ]).slice(0, 5);

  const summary =
    fitScore >= 75
      ? `You already match many of the core requirements for ${params.jobTitle} at ${params.companyName}. Focus on proving your strengths clearly in your application.`
      : fitScore >= 50
        ? `You have a fair starting match for ${params.jobTitle}, but a few important gaps are reducing your fit. Closing the missing items should improve your chances quickly.`
        : `Your current profile is still missing several key requirements for ${params.jobTitle}. Use the hard gaps as your short-term learning plan before treating this as a strong-fit role.`;

  return {
    fitScore,
    hardGaps,
    softGaps,
    metRequirements,
    suggestedPath,
    summary,
  };
}

function normalizeSkillGapCandidate(
  value: unknown
): Partial<SkillGapResult> & Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Gemini did not return skill gap data.');
  }

  const candidate = value as Record<string, unknown>;
  const nested = ['analysis', 'result', 'data', 'skillGap']
    .map((key) => candidate[key])
    .find((item) => item && typeof item === 'object' && !Array.isArray(item));

  return (nested ?? candidate) as Partial<SkillGapResult> & Record<string, unknown>;
}

function buildDerivedSkillGapSummary(result: Omit<SkillGapResult, 'summary'>) {
  const opener =
    result.fitScore >= 75
      ? 'Your profile looks competitive for this role.'
      : result.fitScore >= 50
        ? 'Your profile is partially aligned with this role.'
        : 'Your profile still has several gaps for this role.';

  const detail =
    result.hardGaps.length > 0
      ? `Focus first on closing these gaps: ${result.hardGaps.slice(0, 2).join(', ')}.`
      : result.softGaps.length > 0
        ? `Address this next improvement area: ${result.softGaps[0].replace(/[.!?]+$/, '')}.`
        : result.metRequirements.length > 0
          ? `You already meet ${Math.min(result.metRequirements.length, 3)} key requirement${Math.min(result.metRequirements.length, 3) === 1 ? '' : 's'}.`
          : 'Keep tailoring your profile to the listed requirements.';

  return `${opener} ${detail}`.trim();
}

function normalizeSkillGapResult(result: unknown): SkillGapResult {
  const candidate = normalizeSkillGapCandidate(result);
  const fitScoreValue = Number(candidate.fitScore);

  if (!Number.isFinite(fitScoreValue)) {
    throw new Error('Gemini response did not include a valid fit score.');
  }

  const normalized = {
    fitScore: clamp(Math.round(fitScoreValue), 0, 100),
    hardGaps: normalizeStringArray(candidate.hardGaps),
    softGaps: normalizeStringArray(candidate.softGaps),
    metRequirements: normalizeStringArray(candidate.metRequirements),
    suggestedPath: normalizeStringArray(candidate.suggestedPath).slice(0, 5),
  } satisfies Omit<SkillGapResult, 'summary'>;

  const summary = normalizeText(
    candidate.summary ??
      candidate.fitSummary ??
      candidate.overview ??
      candidate.explanation ??
      candidate.reasoning
  );

  return {
    ...normalized,
    summary: summary || buildDerivedSkillGapSummary(normalized),
  };
}

export async function analyzeSkillGap(params: {
  studentSkills: string[];
  studentCGPA: number;
  completedCourses: string[];
  jobRequiredSkills: string[];
  jobMinCGPA: number;
  jobRequiredCourses: string[];
  jobExperienceExpectations: string;
  jobTitle: string;
  companyName: string;
}): Promise<AIResult<SkillGapResult>> {
  const prompt = `
You are an expert career advisor for Bangladesh university students.
Analyze this student's profile against the internship requirements and return ONLY valid JSON.

STUDENT PROFILE:
- Skills: ${params.studentSkills.join(', ') || 'None listed'}
- CGPA: ${params.studentCGPA}/4.00
- Completed Courses: ${params.completedCourses.join(', ') || 'None listed'}

JOB REQUIREMENTS - ${params.jobTitle} at ${params.companyName}:
- Required Skills: ${params.jobRequiredSkills.join(', ') || 'None specified'}
- Minimum CGPA: ${params.jobMinCGPA}/4.00
- Required Courses: ${params.jobRequiredCourses.join(', ') || 'None specified'}
- Experience Expectations: ${params.jobExperienceExpectations || 'None specified'}

Return this exact JSON structure - no markdown, no extra text:
{
  "fitScore": <integer 0-100>,
  "hardGaps": [<skills/courses student completely lacks>],
  "softGaps": [<requirements partially met>],
  "metRequirements": [<requirements fully satisfied>],
  "suggestedPath": [<3-5 specific free/low-cost learning actions, most urgent first>],
  "summary": "<1-2 sentences explaining the fit score>"
}
`;

  try {
    const result = await askGeminiJSONWithConfig<SkillGapResult>(prompt, {
      responseSchema: SKILL_GAP_RESPONSE_SCHEMA,
    });
    return {
      data: normalizeSkillGapResult(result),
      meta: buildAIProviderMeta('gemini', GEMINI_MODEL),
    };
  } catch (error) {
    console.warn('[GEMINI SKILL GAP FALLBACK]', error);
    return {
      data: buildFallbackSkillGap(params),
      meta: buildAIFallbackMeta(
        'gemini',
        sanitizeAIProviderError('gemini', error),
        LOCAL_SKILL_GAP_MODEL
      ),
    };
  }
}

export interface SmartJobRecommendationCandidate {
  jobId: string;
  title: string;
  companyName: string;
  type: string;
  locationType: string;
  city?: string;
  requiredSkills: string[];
  requiredCourses: string[];
  preferredCertifications: string[];
  targetUniversities: string[];
  targetDepartments: string[];
  targetYears: number[];
  minimumCGPA?: number;
  stipendBDT?: number;
  isStipendNegotiable?: boolean;
  applicationCount: number;
  viewCount: number;
  createdAt?: string;
  localFitScore: number | null;
  behaviorScore: number;
}

export interface SmartRecommendationBehavior {
  viewedJobTitles: string[];
  savedJobTitles: string[];
  appliedJobTitles: string[];
  preferredSkills: string[];
  preferredTypes: string[];
  preferredLocations: string[];
  engagementLevel: 'new' | 'active';
}

export interface SmartJobRecommendation {
  jobId: string;
  rankScore: number;
  whyRecommended: string;
  matchedSignals: string[];
}

export interface SmartJobRecommendationResult {
  recommendations: SmartJobRecommendation[];
  summary: string;
}

export interface SmartJobRecommendationParams {
  studentProfile: {
    university?: string;
    department?: string;
    yearOfStudy?: number;
    cgpa?: number;
    city?: string;
    skills: string[];
    completedCourses: string[];
    certifications: string[];
    projectTechStacks: string[];
    hasVerifiedWorkRecord?: boolean;
  };
  behavior: SmartRecommendationBehavior;
  candidateJobs: SmartJobRecommendationCandidate[];
  limit?: number;
}

const SMART_RECOMMENDATION_ITEM_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    jobId: { type: SchemaType.STRING },
    rankScore: { type: SchemaType.INTEGER },
    whyRecommended: { type: SchemaType.STRING },
    matchedSignals: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
  },
  required: ['jobId', 'rankScore', 'whyRecommended', 'matchedSignals'],
};

const SMART_RECOMMENDATION_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    recommendations: {
      type: SchemaType.ARRAY,
      items: SMART_RECOMMENDATION_ITEM_SCHEMA,
    },
    summary: { type: SchemaType.STRING },
  },
  required: ['recommendations', 'summary'],
};

function intersectsNormalized(left: string[], right: string[]) {
  const rightSet = new Set(right.map(normalizeToken));
  return left.some((item) => rightSet.has(normalizeToken(item)));
}

function getMatchedNormalized(left: string[], right: string[]) {
  const rightSet = new Set(right.map(normalizeToken));
  return left.filter((item) => rightSet.has(normalizeToken(item)));
}

function tokenizeRecommendationText(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

function buildFallbackWhyForCandidate(
  job: SmartJobRecommendationCandidate,
  params: SmartJobRecommendationParams
) {
  const studentSkills = normalizeStringArray([
    ...params.studentProfile.skills,
    ...params.studentProfile.projectTechStacks,
  ]);
  const matchedSkills = getMatchedNormalized(job.requiredSkills, studentSkills);

  if (matchedSkills[0]) return `Matches your ${matchedSkills[0]} skill`;
  if (intersectsNormalized(job.requiredSkills, params.behavior.preferredSkills)) {
    return 'Similar to roles you explored';
  }
  if (
    params.studentProfile.department &&
    job.targetDepartments
      .map(normalizeToken)
      .includes(normalizeToken(params.studentProfile.department))
  ) {
    return `Fits your ${params.studentProfile.department} profile`;
  }
  if (
    params.studentProfile.yearOfStudy &&
    job.targetYears.includes(params.studentProfile.yearOfStudy)
  ) {
    return 'Suits your academic year';
  }
  if (
    params.studentProfile.city &&
    job.city &&
    normalizeToken(params.studentProfile.city) === normalizeToken(job.city)
  ) {
    return `Near ${params.studentProfile.city}`;
  }
  if (job.locationType === 'remote') return 'Remote friendly role';
  if (job.minimumCGPA && (params.studentProfile.cgpa ?? 0) >= job.minimumCGPA) {
    return 'Meets your CGPA profile';
  }

  return 'Strong profile match';
}

function buildFallbackSmartJobRecommendations(
  params: SmartJobRecommendationParams
): SmartJobRecommendationResult {
  const limit = clamp(params.limit ?? 12, 1, 20);
  const profileSkills = normalizeStringArray([
    ...params.studentProfile.skills,
    ...params.studentProfile.projectTechStacks,
  ]);
  const completedCourses = normalizeStringArray(params.studentProfile.completedCourses);
  const certifications = normalizeStringArray(params.studentProfile.certifications);
  const preferredSkills = normalizeStringArray(params.behavior.preferredSkills);
  const preferredTypes = normalizeStringArray(params.behavior.preferredTypes);
  const preferredLocations = normalizeStringArray(params.behavior.preferredLocations);
  const profileSkillSet = new Set(profileSkills.map(normalizeToken));
  const courseSet = new Set(completedCourses.map(normalizeToken));
  const certSet = new Set(certifications.map(normalizeToken));
  const preferredTitleTokens = tokenizeRecommendationText(
    [
      ...params.behavior.viewedJobTitles,
      ...params.behavior.savedJobTitles,
      ...params.behavior.appliedJobTitles,
    ].join(' ')
  );

  const recommendations = params.candidateJobs
    .map((job) => {
      const requiredSkills = normalizeStringArray(job.requiredSkills);
      const requiredCourses = normalizeStringArray(job.requiredCourses);
      const preferredCertifications = normalizeStringArray(job.preferredCertifications);
      const matchedSkills = requiredSkills.filter((skill) =>
        profileSkillSet.has(normalizeToken(skill))
      );
      const matchedCourses = requiredCourses.filter((course) =>
        courseSet.has(normalizeToken(course))
      );
      const matchedCerts = preferredCertifications.filter((certification) =>
        certSet.has(normalizeToken(certification))
      );

      const skillScore =
        requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 42 : 18;
      const courseScore =
        requiredCourses.length > 0 ? (matchedCourses.length / requiredCourses.length) * 12 : 8;
      const certScore =
        preferredCertifications.length > 0
          ? (matchedCerts.length / preferredCertifications.length) * 8
          : 4;
      const cgpaScore =
        job.minimumCGPA && job.minimumCGPA > 0
          ? clamp(((params.studentProfile.cgpa ?? 0) / job.minimumCGPA) * 8, 0, 8)
          : 5;
      const departmentScore =
        params.studentProfile.department &&
        job.targetDepartments
          .map(normalizeToken)
          .includes(normalizeToken(params.studentProfile.department))
          ? 8
          : job.targetDepartments.length === 0
            ? 3
            : 0;
      const yearScore =
        params.studentProfile.yearOfStudy &&
        job.targetYears.includes(params.studentProfile.yearOfStudy)
          ? 6
          : job.targetYears.length === 0
            ? 3
            : 0;
      const locationScore =
        job.locationType === 'remote'
          ? 6
          : params.studentProfile.city &&
              job.city &&
              normalizeToken(params.studentProfile.city) === normalizeToken(job.city)
            ? 6
            : 1;
      const behaviorSkillScore = intersectsNormalized(requiredSkills, preferredSkills) ? 10 : 0;
      const behaviorTypeScore = preferredTypes
        .map(normalizeToken)
        .includes(normalizeToken(job.type))
        ? 6
        : 0;
      const behaviorLocationScore =
        job.city && preferredLocations.map(normalizeToken).includes(normalizeToken(job.city))
          ? 4
          : 0;
      const titleTokens = new Set(tokenizeRecommendationText(job.title));
      const titleBehaviorScore = preferredTitleTokens.some((token) => titleTokens.has(token))
        ? 5
        : 0;
      const popularityScore = clamp(job.applicationCount / 20 + job.viewCount / 50, 0, 3);
      const aiSeedScore = typeof job.localFitScore === 'number' ? job.localFitScore * 0.08 : 0;
      const behaviorSeedScore = clamp(job.behaviorScore, 0, 100) * 0.08;
      const verifiedMultiplier = params.studentProfile.hasVerifiedWorkRecord ? 8 : 0;

      const rankScore = clamp(
        Math.round(
          skillScore +
            courseScore +
            certScore +
            cgpaScore +
            departmentScore +
            yearScore +
            locationScore +
            behaviorSkillScore +
            behaviorTypeScore +
            behaviorLocationScore +
            titleBehaviorScore +
            popularityScore +
            aiSeedScore +
            behaviorSeedScore +
            verifiedMultiplier
        ),
        0,
        100
      );

      const signals = normalizeStringArray([
        matchedSkills[0] ? `Skill match: ${matchedSkills[0]}` : '',
        departmentScore >= 8 && params.studentProfile.department
          ? `Department match: ${params.studentProfile.department}`
          : '',
        yearScore >= 6 ? 'Academic year match' : '',
        behaviorSkillScore > 0 ? 'Similar to roles you explored' : '',
        locationScore >= 6 ? 'Location preference match' : '',
        matchedCourses[0] ? `Course match: ${matchedCourses[0]}` : '',
      ]).slice(0, 4);

      return {
        jobId: job.jobId,
        rankScore,
        whyRecommended: buildFallbackWhyForCandidate(job, params),
        matchedSignals: signals.length > 0 ? signals : ['Matches your profile data'],
      } satisfies SmartJobRecommendation;
    })
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, limit);

  const summary =
    params.behavior.engagementLevel === 'active'
      ? 'Ranked using your profile plus recent views, saves, and applications.'
      : 'Ranked from your academic profile because there is not much job activity yet.';

  return { recommendations, summary };
}

function extractRecommendationArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!isPlainObject(value)) {
    throw new Error('Gemini did not return job recommendations.');
  }

  const candidate = value as Record<string, unknown>;
  const keys = ['recommendations', 'jobs', 'results', 'rankedJobs', 'items'];
  for (const key of keys) {
    if (Array.isArray(candidate[key])) return candidate[key] as unknown[];
  }

  throw new Error('Gemini did not return a recommendations array.');
}

function normalizeSmartJobRecommendationResult(
  value: unknown,
  params: SmartJobRecommendationParams
): SmartJobRecommendationResult {
  const fallback = buildFallbackSmartJobRecommendations(params);
  const fallbackById = new Map(fallback.recommendations.map((item) => [item.jobId, item]));
  const candidateIds = new Set(params.candidateJobs.map((job) => job.jobId));
  const recommended = extractRecommendationArray(value);
  const seen = new Set<string>();
  const normalized: SmartJobRecommendation[] = [];

  recommended.forEach((item, index) => {
    if (!isPlainObject(item)) return;

    const candidate = item as Record<string, unknown>;
    const jobId = normalizeText(candidate.jobId ?? candidate.id ?? candidate._id);
    if (!jobId || !candidateIds.has(jobId) || seen.has(jobId)) return;

    const fallbackItem = fallbackById.get(jobId);
    const rankScoreValue = Number(
      candidate.rankScore ?? candidate.score ?? candidate.fitScore ?? fallbackItem?.rankScore ?? 0
    );
    const matchedSignals = normalizeStringArray(
      candidate.matchedSignals ?? candidate.signals ?? candidate.reasons
    ).slice(0, 4);
    const whyRecommended = normalizeText(
      candidate.whyRecommended ?? candidate.why ?? candidate.reason ?? candidate.tag
    );

    seen.add(jobId);
    normalized.push({
      jobId,
      rankScore: Number.isFinite(rankScoreValue)
        ? clamp(Math.round(rankScoreValue), 0, 100)
        : (fallbackItem?.rankScore ?? clamp(100 - index * 3, 0, 100)),
      whyRecommended:
        whyRecommended.replace(/\s+/g, ' ').slice(0, 120) ||
        fallbackItem?.whyRecommended ||
        'Strong profile match',
      matchedSignals:
        matchedSignals.length > 0
          ? matchedSignals
          : (fallbackItem?.matchedSignals ?? ['Matches your profile data']),
    });
  });

  for (const fallbackItem of fallback.recommendations) {
    if (normalized.length >= (params.limit ?? 12)) break;
    if (seen.has(fallbackItem.jobId)) continue;
    normalized.push(fallbackItem);
    seen.add(fallbackItem.jobId);
  }

  if (normalized.length === 0) {
    throw new Error('Gemini did not return usable job recommendations.');
  }

  const summaryCandidate = isPlainObject(value)
    ? normalizeText(
        (value as Record<string, unknown>).summary ??
          (value as Record<string, unknown>).overview ??
          (value as Record<string, unknown>).reasoning
      )
    : '';

  return {
    recommendations: normalized
      .sort((a, b) => b.rankScore - a.rankScore)
      .slice(0, clamp(params.limit ?? 12, 1, 20)),
    summary: summaryCandidate || fallback.summary,
  };
}

export async function generateSmartJobRecommendations(
  params: SmartJobRecommendationParams
): Promise<AIResult<SmartJobRecommendationResult>> {
  const limit = clamp(params.limit ?? 12, 1, 20);
  const candidateJobs = params.candidateJobs.slice(0, 40);
  const prompt = `
You are a career recommendation engine for Bangladesh university students.
Rank the best jobs for this student and return ONLY valid JSON.

Core behavior:
- On first use, rank by profile data: department/major, skills, CGPA, year, university, location.
- If the student has activity, adjust the ranking using behavior. Applications and saves matter most, then repeated views.
- If the student has a Verified Work Record (hasVerifiedWorkRecord: true), gently boost their overall match score for top recommended jobs.
- Explain every recommendation with one short "whyRecommended" tag such as "Matches your React skill" or "Suits your academic year".
- Do not invent job IDs. Use only candidate jobId values from the list.

STUDENT PROFILE:
${JSON.stringify(params.studentProfile, null, 2)}

STUDENT BEHAVIOR SIGNALS:
${JSON.stringify(params.behavior, null, 2)}

CANDIDATE JOBS:
${JSON.stringify(
  candidateJobs.map((job) => ({
    jobId: job.jobId,
    title: job.title,
    companyName: job.companyName,
    type: job.type,
    locationType: job.locationType,
    city: job.city ?? '',
    requiredSkills: job.requiredSkills,
    requiredCourses: job.requiredCourses,
    preferredCertifications: job.preferredCertifications,
    targetUniversities: job.targetUniversities,
    targetDepartments: job.targetDepartments,
    targetYears: job.targetYears,
    minimumCGPA: job.minimumCGPA ?? 0,
    stipendBDT: job.stipendBDT ?? null,
    applicationCount: job.applicationCount,
    localFitScore: job.localFitScore,
    behaviorScore: job.behaviorScore,
    createdAt: job.createdAt,
  })),
  null,
  2
)}

Return this exact JSON object:
{
  "recommendations": [
    {
      "jobId": "<candidate jobId>",
      "rankScore": <integer 0-100>,
      "whyRecommended": "<short user-facing reason tag>",
      "matchedSignals": ["<1-4 short concrete reasons>"]
    }
  ],
  "summary": "<one sentence explaining what influenced the ranking>"
}

Rules:
- Return at most ${limit} recommendations.
- Prefer open, realistic matches over glamorous but weak matches.
- Use behavior only to find similar opportunities; do not recommend a job only because it is popular.
- Keep whyRecommended under 9 words when possible.
`;

  try {
    const result = await askGeminiJSONWithConfig<SmartJobRecommendationResult>(
      prompt,
      {
        responseSchema: SMART_RECOMMENDATION_RESPONSE_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
      process.env.GEMINI_RECOMMENDATION_API_KEY,
      'GEMINI_RECOMMENDATION_API_KEY'
    );

    return {
      data: normalizeSmartJobRecommendationResult(result, { ...params, candidateJobs, limit }),
      meta: buildAIProviderMeta('gemini', GEMINI_MODEL),
    };
  } catch (error) {
    console.warn('[GEMINI JOB RECOMMENDATION FALLBACK]', error);
    return {
      data: buildFallbackSmartJobRecommendations({ ...params, candidateJobs, limit }),
      meta: buildAIFallbackMeta(
        'gemini',
        sanitizeAIProviderError('gemini', error),
        LOCAL_RECOMMENDATION_MODEL
      ),
    };
  }
}

export interface TrainingStep {
  order: number;
  action: string;
  resource: string;
  url: string;
  estimatedDays: number;
  isFree: boolean;
  type: 'course' | 'project' | 'practice' | 'certification';
}

type TrainingTargetKind = 'skill' | 'course';

const TRAINING_STEP_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    order: { type: SchemaType.INTEGER },
    action: { type: SchemaType.STRING },
    resource: { type: SchemaType.STRING },
    url: { type: SchemaType.STRING },
    estimatedDays: { type: SchemaType.INTEGER },
    isFree: { type: SchemaType.BOOLEAN },
    type: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['course', 'project', 'practice', 'certification'],
    },
  },
  required: ['order', 'action', 'resource', 'url', 'estimatedDays', 'isFree', 'type'],
};

const TRAINING_PATH_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    steps: {
      type: SchemaType.ARRAY,
      minItems: 4,
      maxItems: 6,
      items: TRAINING_STEP_RESPONSE_SCHEMA,
    },
  },
  required: ['steps'],
};

function normalizeTrainingTarget(rawTarget: string) {
  const trimmed = rawTarget.trim();
  const withoutCoursePrefix = trimmed.replace(/^course\s*:\s*/i, '').trim();
  const baseLabel = withoutCoursePrefix || trimmed;
  const compactLabel = baseLabel.replace(/\s+/g, '');
  const looksLikeCourseCode = /^[A-Za-z]{2,6}\d{3}[A-Za-z]?$/.test(compactLabel);
  const isCourse = /^course\s*:/i.test(trimmed) || looksLikeCourseCode;
  const kind: TrainingTargetKind = isCourse ? 'course' : 'skill';

  return {
    raw: trimmed,
    label: baseLabel,
    kind,
  };
}

function looksLikeTrainingStep(value: unknown) {
  if (!isPlainObject(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Boolean(
    normalizeText(candidate.action ?? candidate.title ?? candidate.task ?? candidate.description) ||
    normalizeText(
      candidate.resource ??
        candidate.platform ??
        candidate.source ??
        candidate.course ??
        candidate.material
    )
  );
}

const TRAINING_PATH_ARRAY_KEYS = [
  'steps',
  'roadmap',
  'trainingPath',
  'learningPlan',
  'plan',
  'items',
] as const;

const TRAINING_PATH_WRAPPER_KEYS = [
  'data',
  'result',
  'response',
  'output',
  'training',
  'payload',
] as const;

function extractTrainingPathArray(value: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isPlainObject(value) || depth > 3) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (looksLikeTrainingStep(candidate)) {
    return [candidate];
  }

  for (const key of TRAINING_PATH_ARRAY_KEYS) {
    const nestedArray = candidate[key];
    if (Array.isArray(nestedArray)) {
      return nestedArray;
    }
  }

  for (const key of [...TRAINING_PATH_WRAPPER_KEYS, ...TRAINING_PATH_ARRAY_KEYS]) {
    const nestedValue = candidate[key];
    const extracted = extractTrainingPathArray(nestedValue, depth + 1);
    if (extracted) {
      return extracted;
    }
  }

  const stepEntries = Object.entries(candidate)
    .filter(
      ([key, nestedValue]) => /^step[\s_-]*\d+$/i.test(key) && looksLikeTrainingStep(nestedValue)
    )
    .sort((a, b) => {
      const aOrder = Number(a[0].match(/\d+/)?.[0] ?? 0);
      const bOrder = Number(b[0].match(/\d+/)?.[0] ?? 0);
      return aOrder - bOrder;
    });

  if (stepEntries.length > 0) {
    return stepEntries.map(([, nestedValue]) => nestedValue);
  }

  const objectValues = Object.values(candidate).filter(looksLikeTrainingStep);
  if (objectValues.length >= 2) {
    return objectValues;
  }

  for (const nestedValue of Object.values(candidate)) {
    if (!isPlainObject(nestedValue)) {
      continue;
    }

    const extracted = extractTrainingPathArray(nestedValue, depth + 1);
    if (extracted) {
      return extracted;
    }
  }

  return null;
}

function normalizeTrainingPath(value: unknown, minimumSteps = 4): TrainingStep[] {
  const candidateValue = extractTrainingPathArray(value);

  if (!candidateValue) {
    if (process.env.NODE_ENV === 'development') {
      const preview = (() => {
        try {
          return JSON.stringify(value, null, 2).slice(0, 1000);
        } catch {
          return String(value).slice(0, 1000);
        }
      })();
      console.warn('[GEMINI TRAINING PATH SHAPE PREVIEW]', preview);
    }
    throw new Error('Gemini did not return a training path array.');
  }

  const normalized = candidateValue
    .map((item, index) => {
      const candidate = item as Partial<TrainingStep> & Record<string, unknown>;
      const typeValue = normalizeText(candidate.type ?? candidate.kind ?? candidate.category);
      const type =
        typeValue === 'course' ||
        typeValue === 'project' ||
        typeValue === 'practice' ||
        typeValue === 'certification'
          ? typeValue
          : 'practice';
      const freeHint = normalizeText(candidate.price ?? candidate.cost ?? candidate.pricing);
      const isFree =
        typeof candidate.isFree === 'boolean'
          ? candidate.isFree
          : freeHint.includes('free') || freeHint === '$0' || freeHint === '0';

      return {
        order: Number(candidate.order ?? candidate.step ?? candidate.position ?? index + 1),
        action: normalizeText(
          candidate.action ?? candidate.title ?? candidate.task ?? candidate.description
        ),
        resource: normalizeText(
          candidate.resource ??
            candidate.platform ??
            candidate.source ??
            candidate.course ??
            candidate.material
        ),
        url: normalizeText(candidate.url ?? candidate.link ?? candidate.href),
        estimatedDays: clamp(
          Number(
            candidate.estimatedDays ??
              candidate.durationDays ??
              candidate.days ??
              candidate.duration ??
              7
          ),
          1,
          90
        ),
        isFree,
        type,
      } satisfies TrainingStep;
    })
    .filter((step) => step.action && step.resource)
    .slice(0, 6)
    .sort((a, b) => a.order - b.order)
    .map((step, index) => ({ ...step, order: index + 1 }));

  if (normalized.length === 0) {
    throw new Error('Gemini returned an empty training path.');
  }

  if (normalized.length < minimumSteps) {
    throw new Error(`Gemini returned too few training path steps (${normalized.length}).`);
  }

  return normalized;
}

function buildFallbackTrainingPath(params: {
  skill: string;
  studentLevel: 'beginner' | 'intermediate';
  targetRole: string;
  existingSkills: string[];
}): TrainingStep[] {
  const target = normalizeTrainingTarget(params.skill);
  const skill = target.label;
  const introResource =
    params.studentLevel === 'beginner'
      ? 'Official docs + beginner tutorial'
      : 'Official docs + quick refresher';

  if (target.kind === 'course') {
    return [
      {
        order: 1,
        action: `Review the core topics usually covered in ${skill} and identify the parts most relevant to ${params.targetRole}.`,
        resource: 'Course outline + lecture notes',
        url: '',
        estimatedDays: params.studentLevel === 'beginner' ? 4 : 3,
        isFree: true,
        type: 'course',
      },
      {
        order: 2,
        action: `Work through practice problems or lab tasks for ${skill} until you can solve them without heavy hints.`,
        resource: 'Past assignments + guided practice set',
        url: '',
        estimatedDays: 5,
        isFree: true,
        type: 'practice',
      },
      {
        order: 3,
        action: `Build one small project that demonstrates the main ideas from ${skill} in a practical way.`,
        resource: 'Portfolio mini project',
        url: '',
        estimatedDays: 7,
        isFree: true,
        type: 'project',
      },
      {
        order: 4,
        action: `Summarize what you learned from ${skill} in resume-ready bullet points and interview examples.`,
        resource: 'Resume + interview prep notes',
        url: '',
        estimatedDays: 2,
        isFree: true,
        type: 'practice',
      },
    ];
  }

  return [
    {
      order: 1,
      action: `Review the fundamentals of ${skill} for ${params.targetRole}.`,
      resource: introResource,
      url: '',
      estimatedDays: params.studentLevel === 'beginner' ? 5 : 3,
      isFree: true,
      type: 'course',
    },
    {
      order: 2,
      action: `Practice ${skill} through 3 small hands-on exercises.`,
      resource: 'Guided practice set',
      url: '',
      estimatedDays: 4,
      isFree: true,
      type: 'practice',
    },
    {
      order: 3,
      action: `Build one mini project that uses ${skill} in a realistic workflow.`,
      resource: 'Portfolio mini project',
      url: '',
      estimatedDays: 7,
      isFree: true,
      type: 'project',
    },
    {
      order: 4,
      action: `Add the project outcome and what you learned about ${skill} to your resume.`,
      resource: 'Resume + portfolio update',
      url: '',
      estimatedDays: 2,
      isFree: true,
      type: 'practice',
    },
  ];
}

function buildFallbackCareerAdvice(params: {
  question: string;
  studentProfile: {
    university: string;
    department: string;
    yearOfStudy: number;
    cgpa: number;
    skills: string[];
    targetIndustry?: string;
  };
}) {
  const topSkills = normalizeStringArray(params.studentProfile.skills).slice(0, 3);
  const skillText =
    topSkills.length > 0
      ? `Use ${topSkills.join(', ')} as proof points`
      : 'Add 1-2 concrete skills or project examples';
  const cgpaText =
    params.studentProfile.cgpa > 0
      ? `Keep your CGPA (${params.studentProfile.cgpa.toFixed(2)}) visible if it strengthens your profile`
      : 'Highlight coursework or projects if your CGPA is not available';

  return `Start with one focused action today: tailor your resume and application to the exact role you want. ${skillText} in your resume, portfolio, and interview answers, and ${cgpaText}. After that, practice one interview answer and apply to a role that closely matches your current level.`;
}

function isInvalidJsonError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes('invalid json');
}

async function requestTrainingPathCandidate(
  prompt: string,
  generationConfig?: Record<string, unknown>
) {
  try {
    return await askGeminiJSONWithConfig<unknown>(prompt, {
      responseSchema: TRAINING_PATH_RESPONSE_SCHEMA,
      ...generationConfig,
    });
  } catch (error) {
    if (!isInvalidJsonError(error)) {
      throw error;
    }

    return askGeminiJSONWithConfig<unknown>(
      `${prompt}

Important:
- The full response must be a single valid JSON object.
- Do not include markdown fences, notes, or explanatory text.
- Double-quote every string and every object key.
- Ensure the final output is complete, closed, and parseable JSON.
`,
      {
        responseSchema: TRAINING_PATH_RESPONSE_SCHEMA,
        temperature: 0.1,
        ...generationConfig,
      }
    );
  }
}

export async function generateTrainingPath(params: {
  skill: string;
  studentLevel: 'beginner' | 'intermediate';
  targetRole: string;
  existingSkills: string[];
}): Promise<AIResult<TrainingStep[]>> {
  const target = normalizeTrainingTarget(params.skill);
  const targetTypeInstruction =
    target.kind === 'course'
      ? `The learning target "${target.label}" is a university course code or course requirement, not a standalone software tool. Infer the likely core topics and build a course-review roadmap with topic review, practice problems, and one applied project.`
      : `The learning target "${target.label}" is a skill, tool, or technology. Build a practical roadmap for learning and demonstrating it.`;
  const prompt = `
Generate a practical learning roadmap for a Bangladesh university student to close this gap: "${target.label}" 
for a "${params.targetRole}" role. Student level: ${params.studentLevel}.
Existing skills: ${params.existingSkills.join(', ') || 'None'}.
${targetTypeInstruction}

Return ONLY a JSON object (no markdown):
{
  "steps": [
    {
      "order": 1,
      "action": "<specific learning action>",
      "resource": "<platform and course name>",
      "url": "<direct URL or empty string>",
      "estimatedDays": <integer>,
      "isFree": <boolean>,
      "type": "<course|project|practice|certification>"
    }
  ]
}

Rules:
- 4-6 steps maximum
- Return exactly 4 or 5 steps, never fewer than 4
- Prioritize free resources (Coursera audit, freeCodeCamp, YouTube, official docs)
- Include at least one hands-on project step
- Steps must be ordered from beginner to advanced
- If the target is a course, make the steps about understanding the course topics and proving them through practice
  `;

  try {
    const result = await requestTrainingPathCandidate(prompt);

    let normalized = normalizeTrainingPath(result, 1);

    if (normalized.length < 4) {
      const retryPrompt = `${prompt}

Important:
- Return exactly 4 or 5 items inside "steps".
- Do not collapse the roadmap into a single summary step.
- Each step must be distinct and actionable.
- Expand this draft into a complete roadmap instead of repeating it as one item.

Draft to expand:
${JSON.stringify({ steps: normalized }, null, 2)}
`;

      const retriedResult = await requestTrainingPathCandidate(retryPrompt, {
        temperature: 0.1,
      });
      normalized = normalizeTrainingPath(retriedResult);
    }

    return {
      data: normalized,
      meta: buildAIProviderMeta('gemini', GEMINI_MODEL),
    };
  } catch (error) {
    console.warn('[GEMINI TRAINING PATH FALLBACK]', error);
    return {
      data: buildFallbackTrainingPath(params),
      meta: buildAIFallbackMeta(
        'gemini',
        sanitizeAIProviderError('gemini', error),
        LOCAL_TRAINING_MODEL
      ),
    };
  }
}

export async function generateCareerAdvice(params: {
  question: string;
  studentProfile: {
    university: string;
    department: string;
    yearOfStudy: number;
    cgpa: number;
    skills: string[];
    targetIndustry?: string;
  };
}): Promise<AIResult<string>> {
  const prompt = `
You are a career advisor specializing in helping Bangladesh university students land internships.
Be concise, practical, and specific to the Bangladesh job market.

Student context:
- University: ${params.studentProfile.university}
- Department: ${params.studentProfile.department}, Year ${params.studentProfile.yearOfStudy}
- CGPA: ${params.studentProfile.cgpa}/4.00
- Skills: ${params.studentProfile.skills.join(', ') || 'Not listed'}
- Target industry: ${params.studentProfile.targetIndustry || 'Not specified'}

Question: ${params.question}

Provide a direct, actionable answer in 2-4 sentences. Focus on what the student can do today.
`;
  try {
    return {
      data: await askGemini(prompt),
      meta: buildAIProviderMeta('gemini', GEMINI_MODEL),
    };
  } catch (error) {
    console.warn('[GEMINI CAREER ADVICE FALLBACK]', error);
    return {
      data: buildFallbackCareerAdvice(params),
      meta: buildAIFallbackMeta(
        'gemini',
        sanitizeAIProviderError('gemini', error),
        LOCAL_CAREER_MODEL
      ),
    };
  }
}

export async function improveResumeSection(params: {
  section: 'summary' | 'experience' | 'project' | 'skills';
  originalText: string;
  targetRole: string;
}): Promise<string> {
  const prompt = `
Improve this resume ${params.section} section for a Bangladesh university student applying for "${params.targetRole}".
Make it more impactful, professional, and ATS-friendly.
Keep it concise. Return only the improved text, no explanation.

Original:
${params.originalText}
`;
  return askGemini(prompt);
}

export interface InterviewQuestion {
  question: string;
  category: 'technical' | 'behavioral' | 'situational';
  difficulty: 'easy' | 'medium' | 'hard';
}

function normalizeInterviewQuestions(value: unknown): InterviewQuestion[] {
  if (!Array.isArray(value)) {
    throw new Error('Gemini did not return interview questions.');
  }

  const normalized = value
    .map((item) => {
      const candidate = item as Partial<InterviewQuestion>;
      const question = normalizeText(candidate.question);
      const category =
        candidate.category === 'behavioral' ||
        candidate.category === 'situational' ||
        candidate.category === 'technical'
          ? candidate.category
          : 'behavioral';
      const difficulty =
        candidate.difficulty === 'easy' ||
        candidate.difficulty === 'medium' ||
        candidate.difficulty === 'hard'
          ? candidate.difficulty
          : 'medium';

      return {
        question,
        category,
        difficulty,
      } satisfies InterviewQuestion;
    })
    .filter((item) => item.question)
    .slice(0, 8);

  if (normalized.length === 0) {
    throw new Error('Gemini did not return usable interview questions.');
  }

  return normalized;
}

function buildFallbackInterviewQuestions(params: {
  jobTitle: string;
  industry: string;
  requiredSkills: string[];
  studentSkills: string[];
}): InterviewQuestion[] {
  const studentSkills = normalizeStringArray(params.studentSkills);
  const requiredSkills = normalizeStringArray(params.requiredSkills);
  const studentSkillSet = new Set(studentSkills.map(normalizeToken));
  const topSkill = studentSkills[0];
  const missingSkill = requiredSkills.find((skill) => !studentSkillSet.has(normalizeToken(skill)));

  return [
    {
      question: `Tell me about yourself and why you want the ${params.jobTitle} role.`,
      category: 'behavioral',
      difficulty: 'easy',
    },
    {
      question: `Which of your current skills best prepare you for work in ${params.industry}?`,
      category: 'technical',
      difficulty: 'easy',
    },
    {
      question: missingSkill
        ? `You may need to work with ${missingSkill} in this role. How would you get productive with it quickly?`
        : `Tell me about a technical skill you are most confident using and how you learned it.`,
      category: 'technical',
      difficulty: 'medium',
    },
    {
      question: `Describe a project or course task where you solved a difficult problem.`,
      category: 'situational',
      difficulty: 'medium',
    },
    {
      question: topSkill
        ? `Share one example where you used ${topSkill} to create a measurable outcome.`
        : 'Share one example where your work created a useful outcome for a team or class.',
      category: 'technical',
      difficulty: 'medium',
    },
    {
      question: 'How do you handle feedback when an interviewer or mentor points out a weakness?',
      category: 'behavioral',
      difficulty: 'easy',
    },
    {
      question: `Imagine you join this ${params.jobTitle} internship next month. What would you focus on in your first 30 days?`,
      category: 'situational',
      difficulty: 'hard',
    },
  ];
}

export async function generateInterviewQuestions(params: {
  jobTitle: string;
  industry: string;
  requiredSkills: string[];
  studentSkills: string[];
}): Promise<AIResult<InterviewQuestion[]>> {
  const prompt = `
Generate interview questions for a "${params.jobTitle}" internship in the ${params.industry} industry 
(Bangladesh market context).

Required skills for the role: ${params.requiredSkills.join(', ')}
Candidate's existing skills: ${params.studentSkills.join(', ')}

Return ONLY a JSON array (no markdown):
[
  {
    "question": "<interview question>",
    "category": "<technical|behavioral|situational>",
    "difficulty": "<easy|medium|hard>"
  }
]

Rules:
- 6-8 questions total
- Mix: 3 technical, 2 behavioral, 2 situational
- Technical questions should target gaps between required and candidate skills
- Questions must be realistic for a fresh graduate in Bangladesh
`;
  try {
    const result = await askGeminiJSON<InterviewQuestion[]>(prompt);
    return {
      data: normalizeInterviewQuestions(result),
      meta: buildAIProviderMeta('gemini', GEMINI_MODEL),
    };
  } catch (error) {
    console.warn('[GEMINI INTERVIEW QUESTION FALLBACK]', error);
    return {
      data: buildFallbackInterviewQuestions(params),
      meta: buildAIFallbackMeta(
        'gemini',
        sanitizeAIProviderError('gemini', error),
        LOCAL_QUESTION_MODEL
      ),
    };
  }
}

export async function explainOpportunityScore(params: {
  currentScore: number;
  profileCompleteness: number;
  totalApplications: number;
  closedGaps: number;
  totalBadges: number;
  hasResume: boolean;
}): Promise<string> {
  const prompt = `
A Bangladesh university student has an Opportunity Score of ${params.currentScore}/100.
Profile completeness: ${params.profileCompleteness}%, Applications: ${params.totalApplications}, 
Skill gaps closed: ${params.closedGaps}, Badges earned: ${params.totalBadges}, Has resume: ${params.hasResume}.

Write a motivating 2-3 sentence explanation of their current standing and the single most impactful 
action they should take to improve their score. Be specific and encouraging.
`;
  return askGemini(prompt);
}
