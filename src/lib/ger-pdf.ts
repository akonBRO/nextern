// src/lib/ger-pdf.ts
// Graduation Evaluation Report — Certificate design matching reference image
// Parchment background · Cinzel headings · IM Fell italic · gold ornaments
// 4-level performance system · dual score display in breakdown

import PDFDocument from 'pdfkit';

// ── Palette ────────────────────────────────────────────────────────────────
const NAVY = '#0A1628';
const GOLD = '#C9A84C';
const GOLD_PALE = '#F5E8C2';
const GOLD_MID = '#DDD5BC';
const OFF_WHITE = '#FAF7F0';
const PARCH = '#F2E9D0';
const WARM_LINE = '#C9A84C';
const MUTED = '#8A7040';
const BODY_COL = '#1A1208';
const SUB_COL = '#7A6535';
const DARK_SUB = '#4A3C20';

// ── Layout ─────────────────────────────────────────────────────────────────
const PW = 595.28;
const PH = 841.89;
const ML = 50;
const MR = 50;
const INNER = PW - ML - MR;

// ── Types ──────────────────────────────────────────────────────────────────
export type GERCategory = {
  key: string;
  label: string;
  weight: number;
  rawScore: number;
  weightedScore: number;
  detail: string;
  items: string[];
};

export type GERData = {
  name: string;
  email: string;
  studentId?: string;
  university?: string;
  department?: string;
  cgpa?: number;
  gender?: 'male' | 'female' | 'other';
  graduatedAt: string;
  totalScore: number;
  grade: string;
  categories: GERCategory[];
  generatedAt: string;
};

export type RawGERInput = {
  name: string;
  email: string;
  studentId?: string;
  university?: string;
  department?: string;
  cgpa?: number;
  gender?: 'male' | 'female' | 'other';
  graduatedAt: string;
  opportunityScore: number;
  skills: string[];
  closedSkillGaps: string[];
  applicationCount: number;
  eventCount: number;
  hiredCount: number;
  mentorSessionCount: number;
  freelanceOrderCount: number;
  badges: { badgeName: string; badgeSlug: string; marksReward: number }[];
  employerEndorsementCount: number;
  avgEmployerRating: number;
  cgpaScore: number;
  completedCourses: string[];
  certifications: string[];
  projects: string[];
};

// ── Helpers ────────────────────────────────────────────────────────────────
function hex(h: string): [number, number, number] {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fmtDate(iso: string): string {
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

function getYear(iso: string): string {
  try {
    return String(new Date(iso).getFullYear());
  } catch {
    return iso;
  }
}

function scoreGrade(s: number): string {
  if (s >= 90) return 'A+';
  if (s >= 80) return 'A';
  if (s >= 70) return 'B+';
  if (s >= 60) return 'B';
  if (s >= 50) return 'C';
  return 'F';
}

/**
 * 4-level performance system (professional world aligned)
 * Developing    0–49
 * Satisfactory  50–69
 * Proficient    70–84
 * Distinguished 85–100
 */
function performanceLevel(score: number): { level: string; stage: string } {
  if (score >= 85) return { level: 'Distinguished', stage: 'Distinguished Stage' };
  if (score >= 70) return { level: 'Proficient', stage: 'Proficient Stage' };
  if (score >= 50) return { level: 'Satisfactory', stage: 'Satisfactory Stage' };
  return { level: 'Developing', stage: 'Developing Stage' };
}

function pronouns(g?: string) {
  if (g === 'female') return { subj: 'she', poss: 'her' };
  if (g === 'male') return { subj: 'he', poss: 'his' };
  return { subj: 'they', poss: 'their' };
}

// ── Draw helpers ───────────────────────────────────────────────────────────

/** Gold line + rotated-square diamond at centre */
function goldenDivider(doc: PDFKit.PDFDocument, x: number, y: number, w: number) {
  const mid = x + w / 2;
  doc
    .moveTo(x, y)
    .lineTo(mid - 9, y)
    .strokeColor(hex(GOLD))
    .lineWidth(0.5)
    .stroke();
  doc
    .moveTo(mid + 9, y)
    .lineTo(x + w, y)
    .strokeColor(hex(GOLD))
    .lineWidth(0.5)
    .stroke();
  doc.save();
  doc.translate(mid, y).rotate(45);
  doc.rect(-3.2, -3.2, 6.4, 6.4).fillColor(hex(GOLD)).fill();
  doc.restore();
}

/** Small circle ornament (used between name and body) */
function circDivider(doc: PDFKit.PDFDocument, x: number, y: number, w: number) {
  const mid = x + w / 2;
  doc
    .moveTo(x, y)
    .lineTo(mid - 7, y)
    .strokeColor(hex(GOLD))
    .lineWidth(0.5)
    .stroke();
  doc
    .moveTo(mid + 7, y)
    .lineTo(x + w, y)
    .strokeColor(hex(GOLD))
    .lineWidth(0.5)
    .stroke();
  doc.circle(mid, y, 2.5).strokeColor(hex(GOLD)).lineWidth(0.6).stroke();
}

/** Corner L-brackets at all 4 corners */
function cornerBrackets(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number) {
  const S = 22;
  const pts: [number, number, number, number, number, number][] = [
    [x, y, x + S, y, x, y + S],
    [x + w, y, x + w - S, y, x + w, y + S],
    [x, y + h, x + S, y + h, x, y + h - S],
    [x + w, y + h, x + w - S, y + h, x + w, y + h - S],
  ];
  pts.forEach(([ax, ay, bx, by, cx, cy]) => {
    doc.moveTo(ax, ay).lineTo(bx, by).strokeColor(hex(GOLD)).lineWidth(1.5).stroke();
    doc.moveTo(ax, ay).lineTo(cx, cy).strokeColor(hex(GOLD)).lineWidth(1.5).stroke();
    const dx = bx - ax,
      dy2 = by - ay;
    const len = Math.sqrt(dx * dx + dy2 * dy2);
    if (len > 0) {
      const nx = dx / len,
        ny = dy2 / len;
      doc
        .moveTo(ax + nx * 9, ay + ny * 9)
        .lineTo(ax + nx * 14, ay + ny * 14)
        .strokeColor(hex(GOLD))
        .lineWidth(0.4)
        .stroke();
    }
    const ex = cx - ax,
      ey = cy - ay;
    const len2 = Math.sqrt(ex * ex + ey * ey);
    if (len2 > 0) {
      const nx2 = ex / len2,
        ny2 = ey / len2;
      doc
        .moveTo(ax + nx2 * 9, ay + ny2 * 9)
        .lineTo(ax + nx2 * 14, ay + ny2 * 14)
        .strokeColor(hex(GOLD))
        .lineWidth(0.4)
        .stroke();
    }
  });
}

/** Score medallion */
function drawMedallion(doc: PDFKit.PDFDocument, cx: number, cy: number, r: number, score: number) {
  doc
    .circle(cx, cy, r + 8)
    .fillColor(hex(GOLD_PALE))
    .opacity(0.5)
    .fill()
    .opacity(1);
  doc
    .circle(cx, cy, r + 5)
    .strokeColor(hex(GOLD))
    .lineWidth(0.8)
    .stroke();
  doc.circle(cx, cy, r).fillColor(hex(NAVY)).fill();
  const scoreStr = `${score}`;
  doc
    .font('Helvetica-Bold')
    .fontSize(scoreStr.length >= 3 ? 20 : 26)
    .fillColor(hex('#FFFFFF'))
    .text(scoreStr, cx - r, cy - (scoreStr.length >= 3 ? 13 : 16), {
      width: r * 2,
      align: 'center',
    });
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(hex(GOLD))
    .text('/ 100', cx - r, cy + 10, { width: r * 2, align: 'center' });
}

/** Progress bar track + fill */
function progressBar(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  pct: number
) {
  doc.rect(x, y, w, h).fillColor(hex(GOLD_MID)).fill();
  const filled = Math.max(0, Math.min(1, pct / 100)) * w;
  if (filled > 0) doc.rect(x, y, filled, h).fillColor(hex(GOLD)).fill();
}

// ── Main PDF generator ─────────────────────────────────────────────────────
export async function generateGERPDF(data: GERData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  await new Promise<void>((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);

    const p = pronouns(data.gender);
    const perf = performanceLevel(data.totalScore);
    const year = getYear(data.graduatedAt);
    const uni = data.university || 'the aforesaid institution';
    const dept = data.department ? `, ${data.department},` : '';

    // ── BACKGROUND ──────────────────────────────────────────────────────
    doc.rect(0, 0, PW, PH).fillColor(hex(OFF_WHITE)).fill();
    doc
      .rect(8, 8, PW - 16, PH - 16)
      .strokeColor(hex(GOLD))
      .lineWidth(1.4)
      .stroke();
    doc
      .rect(13, 13, PW - 26, PH - 26)
      .strokeColor(hex(GOLD))
      .lineWidth(0.4)
      .stroke();
    cornerBrackets(doc, 13, 13, PW - 26, PH - 26);

    let cy = 36;

    // ── PLATFORM NAME ────────────────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(hex(GOLD))
      .text('N E X T E R N   ·   C A R E E R   R E A D I N E S S   P L A T F O R M', ML, cy, {
        width: INNER,
        align: 'center',
        characterSpacing: 1.5,
      });
    cy += 18;

    // ── DIAMOND DIVIDER ──────────────────────────────────────────────────
    goldenDivider(doc, ML, cy, INNER);
    cy += 14;

    // ── TITLE ────────────────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(26)
      .fillColor(hex(NAVY))
      .text('Graduation Evaluation Report', ML, cy, {
        width: INNER,
        align: 'center',
        characterSpacing: 0.5,
      });
    cy += 34;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(hex(MUTED))
      .text(
        'O F F I C I A L   A C A D E M I C   C R E D E N T I A L   ·   V E R I F I E D',
        ML,
        cy,
        { width: INNER, align: 'center', characterSpacing: 1 }
      );
    cy += 22;

    // ── THIS IS TO CERTIFY THAT ──────────────────────────────────────────
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(hex(SUB_COL))
      .text('This is to certify that', ML, cy, {
        width: INNER,
        align: 'center',
        oblique: true,
      });
    cy += 17;

    // ── STUDENT NAME ─────────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(hex(NAVY))
      .text(data.name, ML, cy, { width: INNER, align: 'center' });
    cy += 36;

    // Sub: dept · university
    const subLine = [data.department, data.university].filter(Boolean).join(' · ');
    if (subLine) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(hex(SUB_COL))
        .text(subLine, ML, cy, { width: INNER, align: 'center', oblique: true });
      cy += 15;
    }

    // Meta: CGPA | ID | Graduated
    const meta = [
      data.cgpa != null ? `CGPA ${data.cgpa.toFixed(2)} / 4.00` : null,
      data.studentId ? `ID ${data.studentId}` : null,
      `Graduated ${fmtDate(data.graduatedAt)}`,
    ].filter(Boolean) as string[];
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(hex(MUTED))
      .text(meta.join('     |     '), ML, cy, { width: INNER, align: 'center' });
    cy += 12;

    // Circle divider
    circDivider(doc, ML, cy, INNER);
    cy += 20;

    // ── PROCLAMATION BODY ────────────────────────────────────────────────
    const para1 =
      `has successfully completed ${p.poss} graduation from ${uni}${dept} in the year ${year}. ` +
      `During this period, ${p.subj} actively participated in the Nextern Career Readiness Platform, ` +
      `engaging in academic development, professional skill-building, and career-oriented activities ` +
      `as part of the graduation programme.`;

    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(hex(BODY_COL))
      .text(para1, ML, cy, { width: INNER, align: 'justify', lineGap: 2.5 });
    cy = doc.y + 12;

    const para2start =
      `Upon comprehensive evaluation across eight weighted performance categories — encompassing ` +
      `academic standing, skill growth, platform engagement, mentorship, freelance experience, peer ` +
      `recognition, employer endorsements, and opportunity readiness — ${p.subj} has been assessed and ` +
      `awarded a `;
    const para2bold = `Graduation Evaluation Score of ${data.totalScore} out of 100`;

    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(hex(BODY_COL))
      .text(para2start, ML, cy, { width: INNER, align: 'justify', lineGap: 2.5, continued: true })
      .font('Helvetica-Bold')
      .text(para2bold, { continued: true })
      .font('Helvetica')
      .text('.', { align: 'justify' });
    cy = doc.y + 16;

    // ── PERFORMANCE STANDING BAR ─────────────────────────────────────────
    const perfBarH = 22;
    doc.rect(ML, cy, INNER, perfBarH).fillColor(hex(PARCH)).fill();
    doc.rect(ML, cy, INNER, perfBarH).strokeColor(hex(GOLD)).lineWidth(0.5).stroke();
    doc
      .font('Helvetica')
      .fontSize(8.5)
      .fillColor(hex(NAVY))
      .text(`P e r f o r m a n c e   S t a n d i n g   ·   ${perf.level}`, ML, cy + 7, {
        width: INNER,
        align: 'center',
        characterSpacing: 1,
      });
    cy += perfBarH + 8;

    // ── 4-LEVEL PERFORMANCE INDICATOR ────────────────────────────────────
    const levels = [
      { name: 'Developing', range: '0 – 49' },
      { name: 'Satisfactory', range: '50 – 69' },
      { name: 'Proficient', range: '70 – 84' },
      { name: 'Distinguished', range: '85 – 100' },
    ];
    const lvW = INNER / 4;
    doc.rect(ML, cy, INNER, 28).strokeColor(hex(GOLD)).lineWidth(0.5).stroke();
    levels.forEach((lv, i) => {
      const lx = ML + i * lvW;
      const isActive = lv.name === perf.level;
      doc
        .rect(lx, cy, lvW, 28)
        .fillColor(hex(isActive ? NAVY : OFF_WHITE))
        .fill();
      if (i < 3) {
        doc
          .rect(lx + lvW, cy, 0.5, 28)
          .fillColor(hex(GOLD))
          .fill();
      }
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(hex(isActive ? GOLD : MUTED))
        .text(lv.name.toUpperCase(), lx, cy + 7, {
          width: lvW,
          align: 'center',
          characterSpacing: 0.8,
        });
      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(hex(isActive ? GOLD_PALE : '#AAA097'))
        .text(lv.range, lx, cy + 17, { width: lvW, align: 'center' });
    });
    cy += 36;

    // ── SCORE ROW — centred horizontally ─────────────────────────────────
    const medR = 36;
    const gap = 24; // gap between medallion right edge and text
    const detW = 200; // fixed width of the details text block
    const rowW = medR * 2 + gap + detW; // total row width
    const rowX = ML + (INNER - rowW) / 2; // left edge so the row sits centred in INNER
    const medCX = rowX + medR; // medallion centre X
    const detX = rowX + medR * 2 + gap; // details text left X

    // Measure how tall the text block will be so we can vertically centre the medallion
    const detLineH = 15;
    const lineCount =
      2 + // "Graduation Evaluation Score" title + "Grade" line
      1 + // Graduated
      (data.studentId ? 1 : 0) +
      (data.cgpa != null ? 1 : 0);
    const detH = 17 + lineCount * detLineH; // 17 = title line height
    const medCY = cy + Math.max(detH / 2, medR + 4); // centre medallion against text block

    drawMedallion(doc, medCX, medCY, medR, data.totalScore);

    let dy = cy + 6;
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(hex(NAVY))
      .text('Graduation Evaluation Score', detX, dy, { width: detW });
    dy += 17;

    doc
      .font('Helvetica')
      .fontSize(10.5)
      .fillColor(hex(DARK_SUB))
      .text('Grade  ', detX, dy, { continued: true, width: detW })
      .font('Helvetica-Bold')
      .text(`${data.grade}`, { continued: true })
      .font('Helvetica')
      .text(`  —  ${perf.stage}`);
    dy += detLineH;

    doc
      .font('Helvetica')
      .fontSize(10.5)
      .fillColor(hex(DARK_SUB))
      .text(`Graduated: ${fmtDate(data.graduatedAt)}`, detX, dy, { width: detW });
    dy += detLineH;

    if (data.studentId) {
      doc.text(`Student ID: ${data.studentId}`, detX, dy, { width: detW });
      dy += detLineH;
    }
    if (data.cgpa != null) {
      doc.text(`CGPA: ${data.cgpa.toFixed(2)} / 4.00`, detX, dy, { width: detW });
      dy += detLineH;
    }

    cy = Math.max(medCY + medR + 14, dy + 8);

    // ── BREAKDOWN DIVIDER ─────────────────────────────────────────────────
    goldenDivider(doc, ML, cy, INNER);
    cy += 10;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(hex(GOLD))
      .text('B R E A K D O W N   O F   P L A T F O R M   A C T I V I T Y', ML, cy, {
        width: INNER,
        align: 'center',
        characterSpacing: 2,
      });
    cy += 14;

    // ── CATEGORY GRID (2 columns) ─────────────────────────────────────────
    const COL_W = (INNER - 6) / 2;
    const COL2_X = ML + COL_W + 6;
    let leftY = cy,
      rightY = cy;

    data.categories.forEach((cat, i) => {
      const isLeft = i % 2 === 0;
      const x = isLeft ? ML : COL2_X;
      const y = isLeft ? leftY : rightY;
      const H = 52;

      doc.rect(x, y, COL_W, H).fillColor(hex(PARCH)).fill();
      doc.rect(x, y, 2.5, H).fillColor(hex(GOLD)).fill();

      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(hex(NAVY))
        .text(cat.label.toUpperCase(), x + 9, y + 7, {
          width: COL_W - 14,
          characterSpacing: 1,
        });

      const barY = y + 22;
      const barW = COL_W - 14 - 70;
      progressBar(doc, x + 9, barY, barW, 4, cat.rawScore);

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(hex(SUB_COL))
        .text(cat.weightedScore.toFixed(1) + ' pts', x + 9 + barW + 4, y + 18, {
          width: 56,
          align: 'right',
        });

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(hex('#AAA097'))
        .text(`(WT ${cat.weight}%)`, x + 9 + barW + 4, y + 30, {
          width: 56,
          align: 'right',
        });

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(hex(MUTED))
        .text(`Raw: ${cat.rawScore} / 100`, x + 9, barY + 8, {
          width: barW + 60,
        });

      doc
        .rect(x + 2.5, y + H - 0.5, COL_W - 2.5, 0.4)
        .fillColor(hex(WARM_LINE))
        .fill();

      const step = H + 5;
      if (isLeft) leftY += step;
      else rightY += step;
    });

    cy = Math.max(leftY, rightY) + 12;

    // ── CERTIFICATION STATEMENT ───────────────────────────────────────────
    if (cy < PH - 100) {
      const certH = 36;
      doc.rect(ML, cy, INNER, certH).fillColor(hex(NAVY)).fill();
      doc.rect(ML, cy, INNER, certH).strokeColor(hex(GOLD)).lineWidth(0.5).stroke();

      const certText =
        `This certifies that ${data.name} has successfully completed the Nextern Career Readiness ` +
        `Programme and achieved a Graduation Evaluation Score of ${data.totalScore}/100 ` +
        `(Grade: ${data.grade} · ${perf.level}), validating ${p.poss} professional and academic ` +
        `preparedness for the workforce.`;

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(hex(GOLD_PALE))
        .opacity(0.9)
        .text(certText, ML + 14, cy + 8, { width: INNER - 28, align: 'center', lineGap: 2 })
        .opacity(1);

      cy += certH + 12;
    }

    // ── SIGNATURE ROW ─────────────────────────────────────────────────────
    if (cy < PH - 72) {
      const sigY = cy;

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(hex(MUTED))
        .text('AUTHORISED SIGNATORY', ML, sigY, { characterSpacing: 1 });
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(hex(NAVY))
        .text('Nextern Platform', ML, sigY + 10);

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(hex(GOLD))
        .text(`I S S U E D   ·   ${fmtDate(data.generatedAt).toUpperCase()}`, ML, sigY, {
          width: INNER,
          align: 'center',
          characterSpacing: 1,
        });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(hex(MUTED))
        .text('nextern-virid.vercel.app', ML, sigY + 11, {
          width: INNER,
          align: 'center',
          oblique: true,
        });
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(hex(GOLD))
        .text('O F F I C I A L   &   D I G I T A L L Y   C E R T I F I E D', ML, sigY + 22, {
          width: INNER,
          align: 'center',
          characterSpacing: 1,
        });

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(hex(MUTED))
        .text('DATE OF ISSUE', ML + INNER - 110, sigY, {
          width: 110,
          align: 'right',
          characterSpacing: 1,
        });
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(hex(NAVY))
        .text(fmtDate(data.generatedAt), ML + INNER - 110, sigY + 10, {
          width: 110,
          align: 'right',
        });

      doc
        .rect(ML, sigY - 2, 100, 0.5)
        .fillColor(hex(WARM_LINE))
        .fill();
      doc
        .rect(ML + INNER - 110, sigY - 2, 110, 0.5)
        .fillColor(hex(WARM_LINE))
        .fill();
    }

    doc.end();
  });

  return Buffer.concat(chunks);
}

// ── Score computation ──────────────────────────────────────────────────────
export function computeGERScore(raw: RawGERInput): GERData {
  const cats = buildCategories(raw);
  const total = Math.round(
    Math.min(
      100,
      cats.reduce((s, c) => s + c.weightedScore, 0)
    )
  );
  return {
    name: raw.name,
    email: raw.email,
    studentId: raw.studentId,
    university: raw.university,
    department: raw.department,
    cgpa: raw.cgpa,
    gender: raw.gender,
    graduatedAt: raw.graduatedAt,
    totalScore: total,
    grade: scoreGrade(total),
    categories: cats,
    generatedAt: new Date().toISOString(),
  };
}

function buildCategories(r: RawGERInput): GERCategory[] {
  // 1. Academic Performance (18%)
  const cgpaRaw = Math.min(100, ((r.cgpaScore ?? r.cgpa ?? 0) / 4.0) * 100);
  const courseBonus = Math.min(10, r.completedCourses.length * 2);
  const certBonus = Math.min(10, r.certifications.length * 5);
  const projBonus = Math.min(10, r.projects.length * 3);
  const acad = Math.min(100, cgpaRaw * 0.7 + courseBonus + certBonus + projBonus);
  const acadItems: string[] = [];
  if (r.cgpa) acadItems.push(`CGPA: ${r.cgpa.toFixed(2)} / 4.00`);
  if (r.completedCourses.length) acadItems.push(`${r.completedCourses.length} course(s) completed`);
  if (r.certifications.length) acadItems.push(`${r.certifications.length} certification(s)`);
  if (r.projects.length) acadItems.push(`${r.projects.length} project(s) documented`);

  // 2. Skill Growth (15%)
  const skill = Math.min(
    100,
    Math.min(60, r.skills.length * 6) + Math.min(40, r.closedSkillGaps.length * 10)
  );
  const skillItems: string[] = [];
  if (r.skills.length) skillItems.push(`${r.skills.length} skill(s) on profile`);
  if (r.closedSkillGaps.length) skillItems.push(`${r.closedSkillGaps.length} skill gap(s) closed`);

  // 3. Platform Engagement (12%)
  const engage = Math.min(
    100,
    Math.min(50, r.applicationCount * 5) +
      Math.min(30, r.eventCount * 6) +
      Math.min(20, r.hiredCount * 20)
  );
  const engageItems: string[] = [];
  if (r.applicationCount) engageItems.push(`${r.applicationCount} application(s) submitted`);
  if (r.eventCount) engageItems.push(`${r.eventCount} event(s) attended`);
  if (r.hiredCount) engageItems.push(`${r.hiredCount} hiring outcome(s)`);

  // 4. Mentorship Activity (10%)
  const mentor = Math.min(100, r.mentorSessionCount * 20);
  const mentorItems = r.mentorSessionCount
    ? [`${r.mentorSessionCount} mentor session(s) completed`]
    : ['No mentor sessions recorded'];

  // 5. Freelance Work Experience (12%)
  const freelance = Math.min(100, r.freelanceOrderCount * 20);
  const freelanceItems = r.freelanceOrderCount
    ? [`${r.freelanceOrderCount} freelance order(s) delivered`]
    : ['No freelance orders completed'];

  // 6. Peer Recognition — Badges (13%)
  // Raw score = proportion of badges earned out of total available (0–100 scale)
  const TOTAL_STUDENT_BADGE_POINTS = r.badges.reduce((sum, badge) => sum + badge.marksReward, 0);
  const badgeScore = Math.min(100, Math.round(TOTAL_STUDENT_BADGE_POINTS));
  const badgeItems =
    r.badges.length > 0 ? r.badges.map((b) => b.badgeName) : ['No badges earned yet'];

  // 7. Employer Endorsements (10%)
  const endorse = Math.min(
    100,
    (r.avgEmployerRating > 0 ? (r.avgEmployerRating / 5) * 60 : 0) +
      Math.min(40, r.employerEndorsementCount * 20)
  );
  const endorseItems: string[] = [];
  if (r.employerEndorsementCount)
    endorseItems.push(`${r.employerEndorsementCount} review(s) received`);
  if (r.avgEmployerRating > 0)
    endorseItems.push(`Avg rating: ${r.avgEmployerRating.toFixed(1)} / 5.0`);
  if (!endorseItems.length) endorseItems.push('No employer endorsements yet');

  // 8. Opportunity Score Trajectory (10%)
  const oppItems = [`Nextern Opportunity Score: ${r.opportunityScore} / 100`];

  const WEIGHTS = [18, 15, 12, 10, 12, 13, 10, 10];
  const raws = [acad, skill, engage, mentor, freelance, badgeScore, endorse, r.opportunityScore];
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
    'CGPA, courses, certifications, and documented projects',
    'Skills added and skill gaps closed via the AI engine',
    'Job applications, event registrations, and hiring outcomes',
    'Completed sessions with alumni mentors via the platform',
    'Client-delivered freelance orders through the board',
    'Badges earned for platform engagement and excellence',
    'Star ratings and reviews left by employers',
    'Cumulative Opportunity Score from the M3 scoring engine',
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
    const raw = Math.round(raws[i]);
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
