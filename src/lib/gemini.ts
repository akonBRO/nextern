import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  buildAIFallbackMeta,
  buildAIProviderMeta,
  sanitizeAIProviderError,
  type AIResult,
} from '@/lib/ai-meta';

const GEMINI_MODEL = 'gemini-2.5-flash';
const LOCAL_SKILL_GAP_MODEL = 'local-skill-gap';
const LOCAL_TRAINING_MODEL = 'local-training-path';
const LOCAL_CAREER_MODEL = 'local-career-advice';
const LOCAL_QUESTION_MODEL = 'local-interview-questions';

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
  });
}

export async function askGemini(prompt: string): Promise<string> {
  const result = await getGeminiModel().generateContent(prompt);
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

async function askGeminiJSON<T>(prompt: string): Promise<T> {
  const raw = await askGemini(prompt);
  return JSON.parse(extractJsonPayload(raw)) as T;
}

export interface SkillGapResult {
  fitScore: number;
  hardGaps: string[];
  softGaps: string[];
  metRequirements: string[];
  suggestedPath: string[];
  summary: string;
}

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

function normalizeSkillGapResult(result: Partial<SkillGapResult>): SkillGapResult {
  const summary = typeof result.summary === 'string' ? result.summary.trim() : '';
  if (!summary) {
    throw new Error('Gemini response did not include a valid summary.');
  }

  return {
    fitScore: clamp(Number(result.fitScore ?? 0), 0, 100),
    hardGaps: normalizeStringArray(result.hardGaps),
    softGaps: normalizeStringArray(result.softGaps),
    metRequirements: normalizeStringArray(result.metRequirements),
    suggestedPath: normalizeStringArray(result.suggestedPath).slice(0, 5),
    summary,
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
    const result = await askGeminiJSON<SkillGapResult>(prompt);
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

export interface TrainingStep {
  order: number;
  action: string;
  resource: string;
  url: string;
  estimatedDays: number;
  isFree: boolean;
  type: 'course' | 'project' | 'practice' | 'certification';
}

function normalizeTrainingPath(value: unknown): TrainingStep[] {
  if (!Array.isArray(value)) {
    throw new Error('Gemini did not return a training path array.');
  }

  const normalized = value
    .map((item, index) => {
      const candidate = item as Partial<TrainingStep>;
      const type =
        candidate.type === 'course' ||
        candidate.type === 'project' ||
        candidate.type === 'practice' ||
        candidate.type === 'certification'
          ? candidate.type
          : 'practice';

      return {
        order: Number(candidate.order ?? index + 1),
        action: typeof candidate.action === 'string' ? candidate.action.trim() : '',
        resource: typeof candidate.resource === 'string' ? candidate.resource.trim() : '',
        url: typeof candidate.url === 'string' ? candidate.url.trim() : '',
        estimatedDays: clamp(Number(candidate.estimatedDays ?? 7), 1, 90),
        isFree: Boolean(candidate.isFree),
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

  return normalized;
}

function buildFallbackTrainingPath(params: {
  skill: string;
  studentLevel: 'beginner' | 'intermediate';
  targetRole: string;
  existingSkills: string[];
}): TrainingStep[] {
  const skill = params.skill.trim();
  const introResource =
    params.studentLevel === 'beginner'
      ? 'Official docs + beginner tutorial'
      : 'Official docs + quick refresher';

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

export async function generateTrainingPath(params: {
  skill: string;
  studentLevel: 'beginner' | 'intermediate';
  targetRole: string;
  existingSkills: string[];
}): Promise<AIResult<TrainingStep[]>> {
  const prompt = `
Generate a practical learning roadmap for a Bangladesh university student to learn "${params.skill}" 
for a "${params.targetRole}" role. Student level: ${params.studentLevel}.
Existing skills: ${params.existingSkills.join(', ') || 'None'}.

Return ONLY a JSON array (no markdown):
[
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

Rules:
- 4-6 steps maximum
- Prioritize free resources (Coursera audit, freeCodeCamp, YouTube, official docs)
- Include at least one hands-on project step
- Steps must be ordered from beginner to advanced
`;

  try {
    const result = await askGeminiJSON<TrainingStep[]>(prompt);
    return {
      data: normalizeTrainingPath(result),
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
