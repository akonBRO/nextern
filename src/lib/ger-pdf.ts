// src/lib/ger-pdf.ts
// Graduation Evaluation Report (GER) PDF generator using pdfkit
// 8 weighted professional categories, scored out of 100

import PDFDocument from 'pdfkit';

// ── Palette ────────────────────────────────────────────────────────────────
const NAVY = '#0A1628';
const NAVY_MID = '#112240';
const NAVY_LIGHT = '#1B3461';
const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C97A';
const GOLD_PALE = '#F5E6BB';
const WHITE = '#FFFFFF';
const OFF_WHITE = '#F8F6F0';
const SLATE_TEXT = '#4A5568';
const MUTED_TEXT = '#718096';
const LIGHT_TEXT = '#A0AEC0';
const DIVIDER = '#E2E8F0';
const DIVIDER_WARM = '#DDD0B8';

// Category accent colours
const CAT_COLORS = [
  '#1A56DB', // Academic Performance   — royal blue
  '#0D9488', // Skill Growth           — teal
  '#6D28D9', // Platform Engagement    — violet
  '#059669', // Mentorship Activity    — emerald
  '#B45309', // Freelance Work         — amber dark
  '#BE185D', // Peer Recognition       — rose
  '#0369A1', // Employer Endorsements  — sky
  '#4338CA', // Opportunity Score      — indigo
];

// ── Layout constants ───────────────────────────────────────────────────────
const PW = 595.28;
const PH = 841.89;
const ML = 48;
const MR = 48;
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
  graduatedAt: string;
  totalScore: number;
  grade: string;
  categories: GERCategory[];
  generatedAt: string;
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
  if (g === 'B+' || g === 'B') return '#1A56DB';
  if (g === 'C') return '#B45309';
  return '#DC2626';
}

function scoreGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  return 'F';
}

// ── Draw decorative corner ornaments ───────────────────────────────────────
function drawCornerOrnaments(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  size = 18
) {
  const s = size;
  const corners = [
    [x, y, x + s, y, x, y + s],
    [x + w, y, x + w - s, y, x + w, y + s],
    [x, y + h, x + s, y + h, x, y + h - s],
    [x + w, y + h, x + w - s, y + h, x + w, y + h - s],
  ];
  corners.forEach(([cx, cy, ex1, ey1, ex2, ey2]) => {
    doc.moveTo(cx, cy).lineTo(ex1, ey1).strokeColor(hex(color)).lineWidth(1.5).stroke();
    doc.moveTo(cx, cy).lineTo(ex2, ey2).strokeColor(hex(color)).lineWidth(1.5).stroke();
  });
}

// ── Draw thin double border ─────────────────────────────────────────────────
function drawDoubleBorder(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  // outer
  doc.rect(x, y, w, h).strokeColor(hex(color)).lineWidth(1.5).stroke();
  // inner (4px inset)
  doc
    .rect(x + 4, y + 4, w - 8, h - 8)
    .strokeColor(hex(color))
    .lineWidth(0.5)
    .stroke();
}

// ── Horizontal divider with diamond ────────────────────────────────────────
function goldenDivider(doc: PDFKit.PDFDocument, x: number, y: number, w: number) {
  const midX = x + w / 2;
  doc
    .moveTo(x, y)
    .lineTo(midX - 8, y)
    .strokeColor(hex(GOLD))
    .lineWidth(0.75)
    .stroke();
  doc
    .moveTo(midX + 8, y)
    .lineTo(x + w, y)
    .strokeColor(hex(GOLD))
    .lineWidth(0.75)
    .stroke();
  // diamond
  doc.save();
  doc.translate(midX, y);
  doc.rotate(45);
  doc.rect(-3.5, -3.5, 7, 7).fillColor(hex(GOLD)).fill();
  doc.restore();
}

// ── Progress bar (refined) ─────────────────────────────────────────────────
function progressBar(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  pct: number,
  color: string
) {
  // Track (warm grey)
  doc.rect(x, y, w, h).fillColor(hex('#E8E4DC')).fill();
  const filled = Math.max(0, Math.min(1, pct / 100)) * w;
  if (filled > 0) {
    doc.rect(x, y, filled, h).fillColor(hex(color)).fill();
  }
  // End cap highlight
  if (filled > 2) {
    doc.rect(x, y, 2, h).fillColor(hex(WHITE)).opacity(0.25).fill().opacity(1);
  }
}

// ── Single category block ──────────────────────────────────────────────────
function categoryBlock(
  doc: PDFKit.PDFDocument,
  cat: GERCategory,
  color: string,
  x: number,
  y: number,
  w: number
): number {
  const PAD = 12;
  const H = 58;

  // Card background
  doc.rect(x, y, w, H).fillColor(hex(OFF_WHITE)).fill();

  // Left color stripe
  doc.rect(x, y, 3, H).fillColor(hex(color)).fill();

  // Category name
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(hex(NAVY))
    .text(cat.label.toUpperCase(), x + PAD + 4, y + 9, { width: 155, characterSpacing: 0.4 });

  // Weight badge (pill)
  const bx = x + PAD + 4 + 162;
  doc
    .roundedRect(bx, y + 7, 38, 13, 3)
    .fillColor(hex(color))
    .fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(6.5)
    .fillColor(hex(WHITE))
    .text(`WT: ${cat.weight}%`, bx, y + 10, { width: 38, align: 'center' });

  // Weighted score (right)
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor(hex(color))
    .text(cat.weightedScore.toFixed(1), x + w - 50, y + 7, { width: 46, align: 'right' });
  doc
    .font('Helvetica')
    .fontSize(7)
    .fillColor(hex(MUTED_TEXT))
    .text('pts', x + w - 50, y + 25, { width: 46, align: 'right' });

  // Detail text
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(hex(MUTED_TEXT))
    .text(cat.detail, x + PAD + 4, y + 27, { width: w - PAD * 2 - 55, lineGap: 1 });

  // Progress bar
  const barY = y + H - 11;
  progressBar(doc, x + PAD + 4, barY, w - PAD * 2 - 8, 5, cat.rawScore, color);

  // Raw score label
  doc
    .font('Helvetica-Bold')
    .fontSize(6.5)
    .fillColor(hex(color))
    .text(`${cat.rawScore}/100`, x + w - 44, barY - 2, { width: 40, align: 'right' });

  // Subtle bottom rule
  doc
    .rect(x + 3, y + H - 1, w - 3, 0.5)
    .fillColor(hex(DIVIDER_WARM))
    .fill();

  return H + 5;
}

// ── Main generator ─────────────────────────────────────────────────────────
export async function generateGERPDF(data: GERData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  await new Promise<void>((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);

    // ════════════════════════════════════════════════════════════════════
    // BACKGROUND — warm off-white body
    // ════════════════════════════════════════════════════════════════════
    doc.rect(0, 0, PW, PH).fillColor(hex(OFF_WHITE)).fill();

    // ── HEADER BLOCK ────────────────────────────────────────────────────
    // Full-width deep navy header
    doc.rect(0, 0, PW, 210).fillColor(hex(NAVY)).fill();
    // Subtle secondary gradient layer
    doc.rect(0, 0, PW, 210).fillColor(hex(NAVY_MID)).opacity(0.5).fill().opacity(1);

    // Gold top stripe
    doc.rect(0, 0, PW, 6).fillColor(hex(GOLD)).fill();
    // Gold bottom stripe on header
    doc.rect(0, 204, PW, 3).fillColor(hex(GOLD)).fill();
    // Thinner accent below
    doc.rect(0, 208, PW, 1).fillColor(hex(GOLD_PALE)).opacity(0.4).fill().opacity(1);

    // Fine decorative horizontal lines inside header
    doc.rect(ML, 22, INNER, 0.4).fillColor(hex(GOLD_PALE)).opacity(0.2).fill().opacity(1);
    doc.rect(ML, 192, INNER, 0.4).fillColor(hex(GOLD_PALE)).opacity(0.2).fill().opacity(1);

    // Platform wordmark
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(hex(GOLD))
      .text('N E X T E R N', ML, 30, { characterSpacing: 4 });
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(hex(GOLD_PALE))
      .opacity(0.7)
      .text('Career Readiness Platform  ·  Bangladesh', ML, 44)
      .opacity(1);

    // Document type — centered
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(hex(GOLD_PALE))
      .opacity(0.8)
      .text('OFFICIAL ACADEMIC CREDENTIAL', ML, 30, {
        width: INNER,
        align: 'right',
        characterSpacing: 2.5,
      })
      .opacity(1);

    // Certificate title — large, centered
    doc
      .font('Helvetica-Bold')
      .fontSize(32)
      .fillColor(hex(WHITE))
      .text('Graduation Evaluation', ML, 62, {
        width: INNER,
        align: 'center',
        characterSpacing: -0.5,
      });

    doc
      .font('Helvetica')
      .fontSize(18)
      .fillColor(hex(GOLD_LIGHT))
      .text('R E P O R T', ML, 99, { width: INNER, align: 'center', characterSpacing: 8 });

    // Thin gold rule under title
    const ruleY = 126;
    const ruleW = 160;
    const ruleX = (PW - ruleW) / 2;
    doc.rect(ruleX, ruleY, ruleW, 1).fillColor(hex(GOLD)).fill();
    doc
      .rect(ruleX + 20, ruleY + 3, ruleW - 40, 0.4)
      .fillColor(hex(GOLD_PALE))
      .opacity(0.5)
      .fill()
      .opacity(1);

    // Student name — large, centered
    doc
      .font('Helvetica-Bold')
      .fontSize(19)
      .fillColor(hex(WHITE))
      .text(data.name, ML, 138, { width: INNER, align: 'center' });

    // Sub-line: dept · university
    const subLine = [data.department, data.university].filter(Boolean).join('  ·  ');
    if (subLine) {
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(hex(GOLD_PALE))
        .opacity(0.85)
        .text(subLine, ML, 163, { width: INNER, align: 'center' })
        .opacity(1);
    }

    // Meta row: CGPA | Student ID | Graduated
    const metaParts = [
      data.cgpa != null ? `CGPA  ${data.cgpa.toFixed(2)} / 4.00` : null,
      data.studentId ? `ID  ${data.studentId}` : null,
      `Graduated  ${fmtDate(data.graduatedAt)}`,
    ].filter(Boolean) as string[];
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(hex(LIGHT_TEXT))
      .text(metaParts.join('     |     '), ML, 180, {
        width: INNER,
        align: 'center',
        characterSpacing: 0.3,
      });

    // ── SCORE MEDALLION (right of title area) ───────────────────────
    const medCX = PW - 70;
    const medCY = 104;
    const medR = 44;

    // Outer glow ring
    doc
      .circle(medCX, medCY, medR + 10)
      .fillColor(hex(GOLD))
      .opacity(0.08)
      .fill()
      .opacity(1);
    // Outer gold ring
    doc
      .circle(medCX, medCY, medR + 5)
      .strokeColor(hex(GOLD))
      .lineWidth(0.75)
      .stroke();
    // Inner dark circle
    doc.circle(medCX, medCY, medR).fillColor(hex(NAVY_LIGHT)).fill();
    // Colored inner ring
    doc
      .circle(medCX, medCY, medR)
      .strokeColor(hex(gradeColor(data.grade)))
      .lineWidth(2.5)
      .stroke();

    // Score number
    doc
      .font('Helvetica-Bold')
      .fontSize(26)
      .fillColor(hex(WHITE))
      .text(`${data.totalScore}`, medCX - medR, medCY - 18, { width: medR * 2, align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(hex(LIGHT_TEXT))
      .text('out of 100', medCX - medR, medCY + 12, { width: medR * 2, align: 'center' });

    // Grade pill below medallion
    const gc = gradeColor(data.grade);
    const pillW = 40;
    const pillX = medCX - pillW / 2;
    doc
      .roundedRect(pillX, medCY + medR + 8, pillW, 18, 4)
      .fillColor(hex(gc))
      .fill();
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(hex(WHITE))
      .text(data.grade, pillX, medCY + medR + 11, { width: pillW, align: 'center' });

    // ── BODY CONTENT ────────────────────────────────────────────────────
    let cy = 224;

    // ── OVERALL SCORE BAND ──────────────────────────────────────────────
    // White card
    doc
      .rect(ML, cy, INNER, 62)
      .fillColor(hex(WHITE))
      .strokeColor(hex(DIVIDER_WARM))
      .lineWidth(0.75)
      .fillAndStroke();

    // Section label
    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(hex(GOLD))
      .text('OVERALL READINESS SCORE', ML + 14, cy + 12, { characterSpacing: 1.5 });

    // Segmented score bar
    const BAR_X = ML + 14;
    const BAR_Y = cy + 30;
    const BAR_W = INNER - 90;
    const BAR_H = 12;

    // Bar background
    doc.rect(BAR_X, BAR_Y, BAR_W, BAR_H).fillColor(hex('#DDD9CF')).fill();

    // Colour segments
    let segX = BAR_X;
    data.categories.forEach((cat, i) => {
      const segW = (cat.weight / 100) * BAR_W;
      const fill = (cat.rawScore / 100) * segW;
      if (fill > 0) {
        doc.rect(segX, BAR_Y, fill, BAR_H).fillColor(hex(CAT_COLORS[i])).fill();
      }
      // segment divider
      if (i < data.categories.length - 1) {
        doc
          .rect(segX + segW, BAR_Y, 0.75, BAR_H)
          .fillColor(hex(WHITE))
          .opacity(0.4)
          .fill()
          .opacity(1);
      }
      segX += segW;
    });

    // Bar border
    doc.rect(BAR_X, BAR_Y, BAR_W, BAR_H).strokeColor(hex(DIVIDER_WARM)).lineWidth(0.5).stroke();

    // Score + grade text on right of bar
    const gc2 = gradeColor(data.grade);
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor(hex(gc2))
      .text(`${data.totalScore}`, BAR_X + BAR_W + 10, cy + 22, { width: 38, align: 'center' });
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(hex(MUTED_TEXT))
      .text('/ 100', BAR_X + BAR_W + 10, cy + 46, { width: 38, align: 'center' });
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(hex(gc2))
      .text(data.grade, BAR_X + BAR_W + 50, cy + 30, { width: 28, align: 'center' });

    cy += 74;

    // ── SECTION HEADING: CATEGORY BREAKDOWN ────────────────────────────
    goldenDivider(doc, ML, cy, INNER);
    cy += 10;

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(hex(NAVY))
      .text('PERFORMANCE CATEGORY BREAKDOWN', ML, cy, { characterSpacing: 1.5 });
    cy += 16;

    // ── Two-column category grid ────────────────────────────────────────
    const COL_W = (INNER - 8) / 2;
    const COL2_X = ML + COL_W + 8;
    let leftY = cy;
    let rightY = cy;

    data.categories.forEach((cat, i) => {
      const isLeft = i % 2 === 0;
      const x = isLeft ? ML : COL2_X;
      const y = isLeft ? leftY : rightY;
      const h = categoryBlock(doc, cat, CAT_COLORS[i], x, y, COL_W);
      if (isLeft) leftY += h;
      else rightY += h;
    });

    cy = Math.max(leftY, rightY) + 10;

    // ── SUPPORTING EVIDENCE ─────────────────────────────────────────────
    if (cy < PH - 160) {
      goldenDivider(doc, ML, cy, INNER);
      cy += 10;

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(hex(NAVY))
        .text('SUPPORTING EVIDENCE', ML, cy, { characterSpacing: 1.5 });
      cy += 16;

      // Two columns for evidence
      const E_COL_W = (INNER - 8) / 2;
      const E_COL2_X = ML + E_COL_W + 8;
      let eLeft = cy;
      let eRight = cy;

      data.categories.forEach((cat, i) => {
        if (cat.items.length === 0) return;
        const isLeft = i % 2 === 0;
        const ex = isLeft ? ML : E_COL2_X;
        let ey = isLeft ? eLeft : eRight;

        if (ey > PH - 90) return;

        // Category label for evidence
        doc.rect(ex, ey, E_COL_W, 14).fillColor(hex(CAT_COLORS[i])).opacity(0.08).fill().opacity(1);
        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor(hex(CAT_COLORS[i]))
          .text(cat.label, ex + 6, ey + 3, { width: E_COL_W - 8 });
        ey += 17;

        cat.items.forEach((item) => {
          if (ey > PH - 80) return;
          // Bullet dot
          doc
            .circle(ex + 7, ey + 4, 2)
            .fillColor(hex(CAT_COLORS[i]))
            .fill();
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor(hex(SLATE_TEXT))
            .text(item, ex + 15, ey, { width: E_COL_W - 20 });
          ey = doc.y + 3;
        });

        ey += 6;
        if (isLeft) eLeft = ey;
        else eRight = ey;
      });

      cy = Math.max(eLeft, eRight) + 6;
    }

    // ── CERTIFICATION STATEMENT ─────────────────────────────────────────
    if (cy < PH - 110) {
      goldenDivider(doc, ML, cy, INNER);
      cy += 12;

      const CERT_BOX_H = 42;
      doc.rect(ML, cy, INNER, CERT_BOX_H).fillColor(hex(NAVY)).fill();
      doc.rect(ML, cy, INNER, CERT_BOX_H).strokeColor(hex(GOLD)).lineWidth(0.75).stroke();

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(hex(GOLD_PALE))
        .opacity(0.9)
        .text(
          `This certifies that ${data.name} has successfully completed the Nextern Career Readiness Program and achieved a Graduation Evaluation Score of ${data.totalScore}/100 (Grade: ${data.grade}), validating professional and academic preparedness for the workforce.`,
          ML + 16,
          cy + 9,
          { width: INNER - 32, align: 'center', lineGap: 2 }
        )
        .opacity(1);

      cy += CERT_BOX_H + 8;
    }

    // ── SIGNATURE ROW ───────────────────────────────────────────────────
    if (cy < PH - 90) {
      const sigY = cy + 4;

      // Left: Issue details
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(hex(MUTED_TEXT))
        .text('ISSUED BY', ML, sigY, { characterSpacing: 0.8 });
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(hex(NAVY))
        .text('Nextern Platform', ML, sigY + 11);
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(hex(MUTED_TEXT))
        .text('nextern-virid.vercel.app', ML, sigY + 23);

      // Center: Date
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(hex(MUTED_TEXT))
        .text('DATE OF ISSUE', ML, sigY, { width: INNER, align: 'center', characterSpacing: 0.8 });
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(hex(NAVY))
        .text(fmtDate(data.generatedAt), ML, sigY + 11, { width: INNER, align: 'center' });

      // Right: Document ID
      doc
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .fillColor(hex(MUTED_TEXT))
        .text('DOCUMENT STATUS', ML + INNER - 110, sigY, {
          width: 110,
          align: 'right',
          characterSpacing: 0.8,
        });
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(hex(NAVY))
        .text('Official · Verified', ML + INNER - 110, sigY + 11, { width: 110, align: 'right' });
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(hex(MUTED_TEXT))
        .text('Digitally Certified', ML + INNER - 110, sigY + 23, { width: 110, align: 'right' });

      // Sig line
      doc
        .rect(ML, sigY + 36, INNER, 0.75)
        .fillColor(hex(DIVIDER_WARM))
        .fill();
    }

    // ── FOOTER ──────────────────────────────────────────────────────────
    const FY = PH - 38;
    doc.rect(0, FY, PW, 38).fillColor(hex(NAVY)).fill();
    doc.rect(0, FY, PW, 2).fillColor(hex(GOLD)).fill();

    // Fine ornament lines in footer
    doc
      .rect(ML, FY + 8, INNER, 0.3)
      .fillColor(hex(GOLD_PALE))
      .opacity(0.15)
      .fill()
      .opacity(1);

    doc
      .font('Helvetica-Bold')
      .fontSize(7)
      .fillColor(hex(GOLD))
      .text('NEXTERN', ML, FY + 12, { characterSpacing: 2 });
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(hex(LIGHT_TEXT))
      .text(
        `Graduation Evaluation Report  ·  ${data.name}  ·  ${fmtDate(data.generatedAt)}`,
        ML + 52,
        FY + 12,
        { width: INNER - 52 }
      );
    doc
      .font('Helvetica')
      .fontSize(6.5)
      .fillColor(hex('#4A5568'))
      .text(
        'This document is algorithmically generated and digitally certified by Nextern. For verification, visit nextern-virid.vercel.app',
        ML,
        FY + 24,
        { width: INNER, align: 'center' }
      );

    // ── PAGE BORDER (outermost frame) ────────────────────────────────────
    // Only on the body portion below header
    drawDoubleBorder(doc, 10, 214, PW - 20, PH - FY - (PH - FY) + FY - 224, GOLD_PALE);
    drawCornerOrnaments(doc, 10, 214, PW - 20, FY - 214, GOLD, 22);

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

  opportunityScore: number;
  skills: string[];
  closedSkillGaps: string[];
  applicationCount: number;
  eventCount: number;
  hiredCount: number;
  mentorSessionCount: number;
  freelanceOrderCount: number;
  badges: { badgeName: string; badgeSlug: string }[];
  employerEndorsementCount: number;
  avgEmployerRating: number;
  cgpaScore: number;
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
