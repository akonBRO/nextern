// src/lib/ger-pdf.ts
// Graduation Evaluation Report (GER) PDF generator using pdfkit
// 8 weighted professional categories, scored out of 100

import PDFDocument from 'pdfkit';

// ── Palette ────────────────────────────────────────────────────────────────
const DARK = '#0F172A';
const INDIGO = '#1E293B';
const WHITE = '#FFFFFF';
const MUTED = '#64748B';
const LIGHT = '#94A3B8';
const DIVIDER = '#E2E8F0';
const SLATE = '#F1F5F9';

// Category accent colours — one per category
const CAT_COLORS = [
  '#2563EB', // Academic Performance   — blue
  '#0D9488', // Skill Growth           — teal
  '#7C3AED', // Platform Engagement    — violet
  '#059669', // Mentorship Activity    — emerald
  '#D97706', // Freelance Work         — amber
  '#DB2777', // Peer Recognition       — pink
  '#0EA5E9', // Employer Endorsements  — sky
  '#6366F1', // Opportunity Score      — indigo
];

// ── Layout constants ───────────────────────────────────────────────────────
const PW = 595.28; // A4 width
const PH = 841.89; // A4 height
const ML = 44; // margin left
const MR = 44; // margin right
const INNER = PW - ML - MR;

// ── Types ──────────────────────────────────────────────────────────────────
export type GERCategory = {
  key: string;
  label: string;
  weight: number; // out of 100 total weight
  rawScore: number; // 0–100 within this category
  weightedScore: number;
  detail: string; // one-line explanation
  items: string[]; // bullet evidence items
};

export type GERData = {
  name: string;
  email: string;
  studentId?: string;
  university?: string;
  department?: string;
  cgpa?: number;
  image?: string;
  graduatedAt: string; // ISO date string
  totalScore: number; // 0–100 final GER score
  grade: string; // A+, A, B+, B, C, F
  categories: GERCategory[];
  generatedAt: string; // ISO date string
};

// ── Helpers ────────────────────────────────────────────────────────────────
function hex(h: string): [number, number, number] {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function gradeColor(g: string): string {
  if (g === 'A+' || g === 'A') return '#059669';
  if (g === 'B+' || g === 'B') return '#2563EB';
  if (g === 'C') return '#D97706';
  return '#EF4444';
}

function scoreGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  return 'F';
}

// ── Draw a horizontal progress bar ─────────────────────────────────────────
function progressBar(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  pct: number,
  color: string
) {
  // Track
  doc.rect(x, y, w, h).fillColor(hex(DIVIDER)).fill();
  // Fill
  const filled = Math.max(0, Math.min(1, pct / 100)) * w;
  if (filled > 0) {
    doc.rect(x, y, filled, h).fillColor(hex(color)).fill();
  }
}

// ── Draw a single category row ─────────────────────────────────────────────
function categoryRow(
  doc: PDFKit.PDFDocument,
  cat: GERCategory,
  color: string,
  x: number,
  y: number,
  w: number
): number {
  const CARD_PAD = 14;
  const CARD_H_BASE = 64;

  // Background card
  doc.rect(x, y, w, CARD_H_BASE).fillColor(hex(SLATE)).fill();
  // Left accent bar
  doc.rect(x, y, 4, CARD_H_BASE).fillColor(hex(color)).fill();

  // Category label
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(hex(DARK))
    .text(cat.label.toUpperCase(), x + CARD_PAD + 4, y + 10, { width: 160, characterSpacing: 0.5 });

  // Weight badge
  const badgeX = x + CARD_PAD + 4 + 168;
  doc
    .rect(badgeX, y + 9, 42, 13)
    .fillColor(hex(color))
    .fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor(hex(WHITE))
    .text(`${cat.weight}% wt`, badgeX + 2, y + 12, { width: 38, align: 'center' });

  // Score
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(hex(color))
    .text(`${cat.weightedScore.toFixed(1)}`, x + w - 52, y + 8, { width: 48, align: 'right' });
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(hex(LIGHT))
    .text('pts', x + w - 52, y + 24, { width: 48, align: 'right' });

  // Detail text
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(hex(MUTED))
    .text(cat.detail, x + CARD_PAD + 4, y + 28, { width: w - CARD_PAD * 2 - 60 });

  // Progress bar
  const barY = y + CARD_H_BASE - 10;
  progressBar(doc, x + CARD_PAD + 4, barY, w - CARD_PAD * 2 - 8, 5, cat.rawScore, color);

  // Score label on bar
  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor(hex(color))
    .text(`${cat.rawScore}/100`, x + w - 44, barY - 2, { width: 40, align: 'right' });

  return CARD_H_BASE + 6; // height consumed + gap
}

// ── Main generator ─────────────────────────────────────────────────────────
export async function generateGERPDF(data: GERData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  await new Promise<void>((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);

    // ── PAGE 1 ──────────────────────────────────────────────────────────

    // ── Hero header ──────────────────────────────────────────────────────
    doc.rect(0, 0, PW, 200).fillColor(hex(DARK)).fill();

    // Decorative arcs
    doc
      .circle(PW - 60, -30, 120)
      .fillColor('rgba(37,99,235,0.08)')
      .fill();
    doc
      .circle(PW - 20, 180, 80)
      .fillColor('rgba(13,148,136,0.08)')
      .fill();
    doc.circle(40, 220, 100).fillColor('rgba(124,58,237,0.06)').fill();

    // Top teal stripe
    doc.rect(0, 0, PW, 5).fillColor(hex('#0D9488')).fill();

    // Nextern wordmark area
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(hex('#0D9488'))
      .text('NEXTERN', ML, 20, { characterSpacing: 3 });
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(hex(LIGHT))
      .text('Career Readiness Platform', ML, 34);

    // GER title
    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(hex(WHITE))
      .text('Graduation Evaluation', ML, 60);
    doc.font('Helvetica-Bold').fontSize(28).fillColor(hex('#93C5FD')).text('Report', ML, 92);

    // Subtitle
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(hex(LIGHT))
      .text('Official Academic Achievement Document', ML, 130);

    // Issue date
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(hex(MUTED))
      .text(`Issued: ${fmtDate(data.generatedAt)}`, ML, 150);

    // ── Score medallion (right side of header) ────────────────────────
    const medX = PW - 118;
    const medY = 28;
    const medR = 56;

    // Outer glow ring
    doc
      .circle(medX, medY + medR, medR + 8)
      .fillColor('rgba(255,255,255,0.04)')
      .fill();
    // Dark circle background
    doc
      .circle(medX, medY + medR, medR)
      .fillColor(hex(INDIGO))
      .fill();
    // Colored ring
    doc
      .circle(medX, medY + medR, medR)
      .strokeColor(hex(gradeColor(data.grade)))
      .lineWidth(3)
      .stroke();

    // Score number
    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(hex(WHITE))
      .text(`${data.totalScore}`, medX - medR, medY + medR - 20, {
        width: medR * 2,
        align: 'center',
      });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(hex(LIGHT))
      .text('/ 100', medX - medR, medY + medR + 14, { width: medR * 2, align: 'center' });

    // Grade badge
    const gc = gradeColor(data.grade);
    doc
      .rect(medX - 18, medY + medR + 28, 36, 18)
      .fillColor(hex(gc))
      .fill();
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(hex(WHITE))
      .text(data.grade, medX - 18, medY + medR + 31, { width: 36, align: 'center' });

    // ── Student info band ─────────────────────────────────────────────
    doc.rect(0, 200, PW, 68).fillColor(hex(INDIGO)).fill();
    doc.rect(0, 268, PW, 2).fillColor(hex('#334155')).fill();

    doc.font('Helvetica-Bold').fontSize(16).fillColor(hex(WHITE)).text(data.name, ML, 214);

    const sub1 = [data.department, data.university].filter(Boolean).join('  ·  ');
    if (sub1) {
      doc.font('Helvetica').fontSize(9).fillColor(hex('#93C5FD')).text(sub1, ML, 234);
    }

    const sub2Parts = [
      data.cgpa != null ? `CGPA ${data.cgpa.toFixed(2)} / 4.00` : '',
      data.studentId ? `ID: ${data.studentId}` : '',
      `Graduated: ${fmtDate(data.graduatedAt)}`,
    ].filter(Boolean);
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(hex(MUTED))
      .text(sub2Parts.join('    |    '), ML, 250);

    // ── Score summary bar ────────────────────────────────────────────
    let cy = 290;
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(hex(MUTED))
      .text('OVERALL READINESS SCORE', ML, cy, { characterSpacing: 1 });

    cy += 14;
    // Full progress track
    const FULL_W = INNER;
    doc.rect(ML, cy, FULL_W, 14).fillColor(hex(DIVIDER)).fill();

    // Gradient-like segments from the 8 categories
    let segX = ML;
    data.categories.forEach((cat, i) => {
      const segW = (cat.weight / 100) * FULL_W;
      const fill = (cat.rawScore / 100) * segW;
      if (fill > 0) {
        doc.rect(segX, cy, fill, 14).fillColor(hex(CAT_COLORS[i])).fill();
      }
      segX += segW;
    });

    // Score label over bar
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(hex(DARK))
      .text(`${data.totalScore} pts  —  ${data.grade}`, ML, cy + 18);

    cy += 42;

    // ── 8 categories grid ────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(hex(MUTED))
      .text('CATEGORY BREAKDOWN', ML, cy, { characterSpacing: 1 });
    cy += 14;

    // Two columns
    const COL_W = (INNER - 10) / 2;
    const COL2_X = ML + COL_W + 10;
    let leftY = cy;
    let rightY = cy;

    data.categories.forEach((cat, i) => {
      const isLeft = i % 2 === 0;
      const x = isLeft ? ML : COL2_X;
      const y = isLeft ? leftY : rightY;
      const h = categoryRow(doc, cat, CAT_COLORS[i], x, y, COL_W);
      if (isLeft) leftY += h;
      else rightY += h;
    });

    cy = Math.max(leftY, rightY) + 10;

    // ── Evidence bullets per category ──────────────────────────────
    if (cy < PH - 160) {
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(hex(MUTED))
        .text('SUPPORTING EVIDENCE', ML, cy, { characterSpacing: 1 });
      cy += 14;

      data.categories.forEach((cat, i) => {
        if (cat.items.length === 0) return;
        if (cy > PH - 80) return; // overflow guard

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(hex(CAT_COLORS[i]))
          .text(cat.label, ML, cy);
        cy += 11;

        cat.items.forEach((item) => {
          if (cy > PH - 70) return;
          doc
            .circle(ML + 5, cy + 3.5, 2)
            .fillColor(hex(CAT_COLORS[i]))
            .fill();
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor(hex(MUTED))
            .text(item, ML + 13, cy, { width: INNER - 13 });
          cy = doc.y + 3;
        });

        cy += 4;
      });
    }

    // ── Footer ────────────────────────────────────────────────────────
    const FY = PH - 44;
    doc.rect(0, FY, PW, 44).fillColor(hex(DARK)).fill();
    doc.rect(0, FY, PW, 3).fillColor(hex('#2563EB')).fill();

    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(hex(MUTED))
      .text(
        'This document is digitally generated by Nextern and certified by the platform.',
        ML,
        FY + 10,
        { width: INNER, align: 'center' }
      );
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(hex('#334155'))
      .text(
        `nextern-virid.vercel.app  ·  Generated on ${fmtDate(data.generatedAt)}  ·  Confidential`,
        ML,
        FY + 24,
        { width: INNER, align: 'center' }
      );

    doc.end();
  });

  return Buffer.concat(chunks);
}

// ── Score computation helpers ──────────────────────────────────────────────

export function computeGERScore(raw: RawGERInput): GERData {
  const cats: GERCategory[] = buildCategories(raw);
  const total = cats.reduce((sum, c) => sum + c.weightedScore, 0);
  const totalScore = Math.round(Math.min(100, total));

  return {
    name: raw.name,
    email: raw.email,
    studentId: raw.studentId,
    university: raw.university,
    department: raw.department,
    cgpa: raw.cgpa,
    graduatedAt: raw.graduatedAt,
    totalScore,
    grade: scoreGrade(totalScore),
    categories: cats,
    generatedAt: new Date().toISOString(),
  };
}

export type RawGERInput = {
  name: string;
  email: string;
  studentId?: string;
  university?: string;
  department?: string;
  cgpa?: number;
  graduatedAt: string;

  // Category inputs
  opportunityScore: number; // 0–100 from M3 engine
  skills: string[]; // list of student skills
  closedSkillGaps: string[]; // skills where gap was closed
  applicationCount: number; // total job applications
  eventCount: number; // webinar/workshop registrations
  hiredCount: number; // applications that reached 'hired'
  mentorSessionCount: number; // completed mentor sessions
  freelanceOrderCount: number; // completed freelance orders
  badges: { badgeName: string; badgeSlug: string }[];
  employerEndorsementCount: number; // employer reviews received
  avgEmployerRating: number; // 0–5 employer star rating
  cgpaScore: number; // alias for cgpa
  completedCourses: string[];
  certifications: string[];
  projects: string[];
};

function buildCategories(r: RawGERInput): GERCategory[] {
  // ── 1. Academic Performance (18%) ─────────────────────────────────
  const cgpaRaw = Math.min(100, ((r.cgpaScore ?? r.cgpa ?? 0) / 4.0) * 100);
  const courseBonus = Math.min(10, r.completedCourses.length * 2);
  const certBonus = Math.min(10, r.certifications.length * 5);
  const projBonus = Math.min(10, r.projects.length * 3);
  const acad = Math.min(100, cgpaRaw * 0.7 + courseBonus + certBonus + projBonus);

  const acadItems: string[] = [];
  if (r.cgpa) acadItems.push(`CGPA: ${r.cgpa.toFixed(2)} / 4.00`);
  if (r.completedCourses.length) acadItems.push(`${r.completedCourses.length} courses completed`);
  if (r.certifications.length)
    acadItems.push(`${r.certifications.length} professional certification(s)`);
  if (r.projects.length) acadItems.push(`${r.projects.length} project(s) documented`);

  // ── 2. Skill Growth (15%) ─────────────────────────────────────────
  const skillScore = Math.min(60, r.skills.length * 6);
  const gapScore = Math.min(40, r.closedSkillGaps.length * 10);
  const skill = Math.min(100, skillScore + gapScore);

  const skillItems: string[] = [];
  if (r.skills.length) skillItems.push(`${r.skills.length} skills on profile`);
  if (r.closedSkillGaps.length)
    skillItems.push(`${r.closedSkillGaps.length} skill gap(s) closed via AI engine`);

  // ── 3. Platform Engagement (12%) ──────────────────────────────────
  const appScore = Math.min(50, r.applicationCount * 5);
  const evtScore = Math.min(30, r.eventCount * 6);
  const hireScore = Math.min(20, r.hiredCount * 20);
  const engage = Math.min(100, appScore + evtScore + hireScore);

  const engageItems: string[] = [];
  if (r.applicationCount) engageItems.push(`${r.applicationCount} job application(s) submitted`);
  if (r.eventCount) engageItems.push(`${r.eventCount} event/webinar registration(s)`);
  if (r.hiredCount) engageItems.push(`${r.hiredCount} hiring outcome(s) on platform`);

  // ── 4. Mentorship Activity (10%) ──────────────────────────────────
  const mentor = Math.min(100, r.mentorSessionCount * 20);
  const mentorItems = r.mentorSessionCount
    ? [`${r.mentorSessionCount} completed mentor session(s)`]
    : ['No mentor sessions recorded'];

  // ── 5. Freelance Work Experience (12%) ────────────────────────────
  const freelance = Math.min(100, r.freelanceOrderCount * 20);
  const freelanceItems = r.freelanceOrderCount
    ? [`${r.freelanceOrderCount} freelance order(s) delivered`]
    : ['No freelance orders completed'];

  // ── 6. Peer Recognition — Badges (13%) ───────────────────────────
  const badgeScore = Math.min(100, r.badges.length * 16);
  const badgeItems = r.badges.length
    ? r.badges.map((b) => `${b.badgeName}`)
    : ['No badges earned yet'];

  // ── 7. Employer Endorsements (10%) ────────────────────────────────
  const endorseRating = r.avgEmployerRating > 0 ? (r.avgEmployerRating / 5) * 60 : 0;
  const endorseCount = Math.min(40, r.employerEndorsementCount * 20);
  const endorse = Math.min(100, endorseRating + endorseCount);
  const endorseItems: string[] = [];
  if (r.employerEndorsementCount)
    endorseItems.push(`${r.employerEndorsementCount} employer review(s) received`);
  if (r.avgEmployerRating > 0)
    endorseItems.push(`Average employer rating: ${r.avgEmployerRating.toFixed(1)} / 5.0`);
  if (endorseItems.length === 0) endorseItems.push('No employer endorsements yet');

  // ── 8. Opportunity Score Trajectory (10%) ────────────────────────
  const oppScore = r.opportunityScore;
  const oppItems = [`Nextern Opportunity Score: ${r.opportunityScore} / 100`];

  const WEIGHTS = [18, 15, 12, 10, 12, 13, 10, 10];
  const rawScores = [acad, skill, engage, mentor, freelance, badgeScore, endorse, oppScore];
  const labels = [
    'Academic Performance',
    'Skill Growth',
    'Platform Engagement',
    'Mentorship Activity',
    'Freelance Work Experience',
    'Peer Recognition',
    'Employer Endorsements',
    'Opportunity Score Trajectory',
  ];
  const details = [
    'CGPA, completed courses, certifications, and documented projects',
    'Skills added to profile and skill gaps closed via the AI engine',
    'Job applications, event registrations, and hiring outcomes',
    'Completed sessions with alumni mentors via the platform',
    'Client-delivered freelance orders completed through the board',
    'Badges earned for consistent platform engagement and excellence',
    'Star ratings and reviews left by employers who hired you',
    'Cumulative Opportunity Score generated by the M3 scoring engine',
  ];
  const allItems = [
    acadItems,
    skillItems,
    engageItems,
    mentorItems,
    freelanceItems,
    badgeItems,
    endorseItems,
    oppItems,
  ];
  const keys = [
    'academic',
    'skill',
    'engagement',
    'mentorship',
    'freelance',
    'badges',
    'endorsements',
    'opportunity',
  ];

  return WEIGHTS.map((w, i) => {
    const raw = Math.round(rawScores[i]);
    return {
      key: keys[i],
      label: labels[i],
      weight: w,
      rawScore: raw,
      weightedScore: parseFloat(((raw * w) / 100).toFixed(1)),
      detail: details[i],
      items: allItems[i],
    };
  });
}
