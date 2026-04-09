// src/lib/resume-pdf.ts
// Professional navy + white resume. Orange = one thin accent line only.
// Profile photo fetched correctly via Node https/http with redirect support.

import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http';

// ── Palette ───────────────────────────────────────────────────────────────
const NAVY = '#0F172A'; // deepest navy  — sidebar bg
const NAVY2 = '#1E293B'; // mid navy      — header bg, section labels
const NAVY3 = '#334155'; // soft navy     — body text
const BLUE_ACCENT = '#2563EB'; // blue          — project links, highlights
const ORANGE = '#F97316'; // orange        — single accent rule only
const WHITE = '#FFFFFF';
const OFF_WHITE = '#F8FAFC'; // page body bg
const LIGHT_RULE = '#E2E8F0'; // body dividers
const SIDEBAR_TXT = '#CBD5E1'; // sidebar text
const SIDEBAR_MUT = '#64748B'; // sidebar muted
const BODY_MUT = '#64748B'; // body secondary

// ── Page metrics ──────────────────────────────────────────────────────────
const PW = 595.28;
const PH = 841.89;
const SW = 168;
const BX = SW + 28;
const BW = PW - BX - 28;
const SX = 16;
const SCON_W = SW - SX - 12;
const HEADER_H = 138;

// ── Types ─────────────────────────────────────────────────────────────────
export interface ResumeData {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  bio?: string;
  image?: string;
  university?: string;
  department?: string;
  yearOfStudy?: number;
  currentSemester?: string;
  cgpa?: number;
  studentId?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  skills: string[];
  completedCourses: string[];
  opportunityScore?: number;
  projects: {
    title: string;
    description: string;
    techStack: string[];
    projectUrl?: string;
    repoUrl?: string;
  }[];
  certifications: {
    name: string;
    issuedBy: string;
    issueDate?: string;
    credentialUrl?: string;
  }[];
}

// ── Fetch remote image → Buffer (follows 1 redirect) ─────────────────────
function fetchImage(url: string, redirects = 2): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 8000 }, (res) => {
      if (
        redirects > 0 &&
        (res.statusCode === 301 ||
          res.statusCode === 302 ||
          res.statusCode === 307 ||
          res.statusCode === 308) &&
        res.headers.location
      ) {
        fetchImage(res.headers.location, redirects - 1)
          .then(resolve)
          .catch(reject);
        return;
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Image fetch timeout'));
    });
  });
}

// ── Main export ───────────────────────────────────────────────────────────
export async function generateResumePDF(data: ResumeData): Promise<Buffer> {
  let imgBuf: Buffer | null = null;
  if (data.image) {
    try {
      imgBuf = await fetchImage(data.image);
    } catch (e) {
      console.warn('[resume-pdf] Could not fetch profile image:', e);
      imgBuf = null;
    }
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: { Title: `${data.name} — Resume`, Author: data.name, Creator: 'Nextern' },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── Backgrounds ───────────────────────────────────────────────────────
    doc.rect(0, 0, SW, PH).fill(NAVY);
    doc.rect(SW, 0, PW - SW, PH).fill(OFF_WHITE);

    // ── Header ────────────────────────────────────────────────────────────
    doc.rect(0, 0, PW, HEADER_H).fill(NAVY2);
    // The ONE orange accent — bottom of header
    doc.rect(0, HEADER_H - 2, PW, 2).fill(ORANGE);

    // ── Profile photo (top-right, bigger, no white border) ───────────────
    const PHOTO = 108;
    const PX = PW - PHOTO - 14;
    const PY = Math.round((HEADER_H - PHOTO) / 2);

    if (imgBuf) {
      try {
        // Clip to circle and draw image — no white ring
        doc.save();
        doc.circle(PX + PHOTO / 2, PY + PHOTO / 2, PHOTO / 2).clip();
        doc.image(imgBuf, PX, PY, {
          width: PHOTO,
          height: PHOTO,
          cover: [PHOTO, PHOTO],
        });
        doc.restore();
      } catch (imgErr) {
        console.warn('[resume-pdf] Could not render image:', imgErr);
        drawInitials(doc, data.name, PX, PY, PHOTO);
      }
    } else {
      drawInitials(doc, data.name, PX, PY, PHOTO);
    }

    // ── Header text — starts just after sidebar, left of center ──────────
    const TEXT_X = SW - 70;
    const nameAreaW = PX - TEXT_X - 10;

    doc.font('Helvetica-Bold').fontSize(22).fillColor(WHITE);
    doc.text(data.name, TEXT_X, 24, { width: nameAreaW, lineBreak: false });

    const role = [data.department, data.university].filter(Boolean).join('  ·  ');
    if (role) {
      doc.font('Helvetica').fontSize(9.5).fillColor('#93C5FD');
      doc.text(role, TEXT_X, 52, { width: nameAreaW, lineBreak: false });
    }

    const contacts = [data.email, data.phone, data.city].filter(Boolean) as string[];
    if (contacts.length > 0) {
      doc.font('Helvetica').fontSize(8.5).fillColor(SIDEBAR_TXT);
      doc.text(contacts.join('   |   '), TEXT_X, 72, { width: nameAreaW, lineBreak: false });
    }

    const linkArr = [data.linkedinUrl, data.githubUrl, data.portfolioUrl]
      .filter(Boolean)
      .map((u) => stripProtocol(u!));
    if (linkArr.length > 0) {
      doc.font('Helvetica').fontSize(8).fillColor('#7DD3FC');
      doc.text(linkArr.join('   ·   '), TEXT_X, 90, { width: nameAreaW, lineBreak: false });
    }

    // ── SIDEBAR ───────────────────────────────────────────────────────────
    let sy = HEADER_H + 22;

    // Education
    if (data.university || data.cgpa != null) {
      sy = sidebarHead(doc, 'EDUCATION', sy);
      if (data.university) {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(WHITE);
        doc.text(data.university, SX, sy, { width: SCON_W });
        sy = doc.y + 3;
      }
      if (data.department) {
        doc.font('Helvetica').fontSize(8).fillColor(SIDEBAR_TXT);
        doc.text(data.department, SX, sy, { width: SCON_W });
        sy = doc.y + 2;
      }
      const eduMeta = [
        data.yearOfStudy ? `Year ${data.yearOfStudy}` : '',
        data.currentSemester ?? '',
      ]
        .filter(Boolean)
        .join(' · ');
      if (eduMeta) {
        doc.font('Helvetica').fontSize(7.5).fillColor(SIDEBAR_MUT);
        doc.text(eduMeta, SX, sy, { width: SCON_W });
        sy = doc.y + 3;
      }
      if (data.cgpa != null) {
        doc.roundedRect(SX, sy, SCON_W, 20, 4).fill('rgba(255,255,255,0.07)');
        doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE);
        doc.text(`CGPA  ${data.cgpa.toFixed(2)} / 4.00`, SX + 8, sy + 5, { lineBreak: false });
        sy += 27;
      }
      if (data.studentId) {
        doc.font('Helvetica').fontSize(7.5).fillColor(SIDEBAR_MUT);
        doc.text(`ID: ${data.studentId}`, SX, sy, { width: SCON_W });
        sy = doc.y + 4;
      }
      sy += 8;
    }

    // Skills
    if (data.skills.length > 0) {
      sy = sidebarHead(doc, 'SKILLS', sy);
      for (const skill of data.skills) {
        if (sy > PH - 70) break;
        doc.font('Helvetica').fontSize(8.5).fillColor(SIDEBAR_TXT);
        doc.text(`• ${skill}`, SX, sy, { width: SCON_W, lineBreak: false });
        sy += 13;
      }
      sy += 8;
    }

    // Courses
    if (data.completedCourses.length > 0 && sy < PH - 90) {
      sy = sidebarHead(doc, 'COURSES', sy);
      doc.font('Helvetica').fontSize(7.5).fillColor(SIDEBAR_MUT);
      doc.text(data.completedCourses.slice(0, 16).join(', '), SX, sy, {
        width: SCON_W,
        lineGap: 2,
      });
      sy = doc.y + 10;
    }

    // Links
    if ((data.linkedinUrl || data.githubUrl || data.portfolioUrl) && sy < PH - 80) {
      sy = sidebarHead(doc, 'LINKS', sy);
      for (const [label, url] of [
        ['LinkedIn', data.linkedinUrl],
        ['GitHub', data.githubUrl],
        ['Portfolio', data.portfolioUrl],
      ] as [string, string | undefined][]) {
        if (!url || sy > PH - 60) continue;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor(WHITE);
        doc.text(label, SX, sy, { lineBreak: false });
        sy += 11;
        doc.font('Helvetica').fontSize(7).fillColor(SIDEBAR_MUT);
        doc.text(stripProtocol(url), SX, sy, { width: SCON_W });
        sy = doc.y + 6;
      }
    }

    // ── BODY ──────────────────────────────────────────────────────────────
    let by = HEADER_H + 22;

    // Summary
    if (data.bio) {
      by = bodyHead(doc, 'PROFESSIONAL SUMMARY', by);
      doc.font('Helvetica').fontSize(9.5).fillColor(NAVY3);
      doc.text(data.bio, BX, by, { width: BW, lineGap: 3 });
      by = doc.y + 16;
    }

    // Projects
    if (data.projects.length > 0) {
      by = bodyHead(doc, 'PROJECTS', by);
      for (const proj of data.projects) {
        by = pageBreak(doc, by, 80);
        const cardH = estimateCard(proj, BW);

        doc.roundedRect(BX - 4, by - 4, BW + 8, cardH, 5).fill(WHITE);
        // navy left bar on card
        doc.roundedRect(BX - 4, by - 4, 3, cardH, 2).fill(NAVY2);

        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(NAVY);
        doc.text(proj.title, BX + 6, by, { width: BW - 70, lineBreak: false });

        const pl = [proj.projectUrl && 'Live ↗', proj.repoUrl && 'Repo ↗'].filter(
          Boolean
        ) as string[];
        if (pl.length > 0) {
          doc.font('Helvetica-Bold').fontSize(8).fillColor(BLUE_ACCENT);
          doc.text(pl.join('  '), BX + BW - 62, by, {
            width: 62,
            align: 'right',
            lineBreak: false,
          });
        }
        by += 15;

        if (proj.techStack.length > 0) {
          let tx = BX + 6;
          for (const t of proj.techStack) {
            const tw = doc.font('Helvetica').fontSize(7.5).widthOfString(t) + 10;
            if (tx + tw > BX + BW) break;
            doc.roundedRect(tx, by, tw, 13, 3).fill('#EFF6FF');
            doc.font('Helvetica').fontSize(7.5).fillColor(NAVY2);
            doc.text(t, tx + 5, by + 3, { lineBreak: false });
            tx += tw + 4;
          }
          by += 18;
        }

        if (proj.description) {
          doc.font('Helvetica').fontSize(9).fillColor(BODY_MUT);
          doc.text(proj.description, BX + 6, by, { width: BW - 10, lineGap: 2 });
          by = doc.y + 4;
        }
        by += 12;
      }
    }

    // Certifications
    if (data.certifications.length > 0) {
      by = pageBreak(doc, by, 60);
      by = bodyHead(doc, 'CERTIFICATIONS', by);
      for (const cert of data.certifications) {
        by = pageBreak(doc, by, 34);
        doc.circle(BX + 3, by + 5, 2.5).fill(NAVY2);
        doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
        doc.text(cert.name, BX + 12, by, { width: BW - 12, lineBreak: false });
        by += 14;
        const meta = [cert.issuedBy, cert.issueDate ? formatDate(cert.issueDate) : '']
          .filter(Boolean)
          .join('  ·  ');
        doc.font('Helvetica').fontSize(8.5).fillColor(BODY_MUT);
        doc.text(meta, BX + 12, by, { lineBreak: false });
        by += 17;
      }
    }

    // ── Footer ────────────────────────────────────────────────────────────
    doc.rect(0, PH - 24, SW, 24).fill('#090E18');
    doc.rect(SW, PH - 24, PW - SW, 24).fill(NAVY2);
    doc.rect(SW, PH - 24, PW - SW, 1).fill(LIGHT_RULE);

    doc.font('Helvetica').fontSize(7).fillColor(SIDEBAR_MUT);
    doc.text('NEXTERN', SX, PH - 14, { lineBreak: false, characterSpacing: 2 });

    doc.font('Helvetica').fontSize(7.5).fillColor(SIDEBAR_MUT);
    doc.text(`${data.name}  ·  ${data.email}  ·  Generated by Nextern`, BX, PH - 14, {
      lineBreak: false,
    });

    doc.end();
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────
function sidebarHead(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.font('Helvetica-Bold').fontSize(7).fillColor(SIDEBAR_MUT);
  doc.text(title, SX, y, { lineBreak: false, characterSpacing: 1.8 });
  doc
    .moveTo(SX, y + 10)
    .lineTo(SX + SCON_W, y + 10)
    .strokeColor('rgba(255,255,255,0.07)')
    .lineWidth(0.5)
    .stroke();
  return y + 15;
}

function bodyHead(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY2);
  doc.text(title, BX, y, { lineBreak: false, characterSpacing: 0.8 });
  const tw = doc.widthOfString(title, { characterSpacing: 0.8 });
  // extend divider to right edge
  doc
    .moveTo(BX + tw + 8, y + 6)
    .lineTo(BX + BW, y + 6)
    .strokeColor(LIGHT_RULE)
    .lineWidth(0.8)
    .stroke();
  // underline title
  doc
    .moveTo(BX, y + 12)
    .lineTo(BX + tw, y + 12)
    .strokeColor(NAVY2)
    .lineWidth(1)
    .stroke();
  return y + 20;
}

function drawInitials(
  doc: PDFKit.PDFDocument,
  name: string,
  x: number,
  y: number,
  size: number
): void {
  const cx = x + size / 2,
    cy = y + size / 2,
    r = size / 2;
  doc.circle(cx, cy, r).fill(NAVY);
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  doc
    .font('Helvetica-Bold')
    .fontSize(size * 0.38)
    .fillColor(WHITE);
  const tw = doc.widthOfString(initial);
  doc.text(initial, cx - tw / 2, cy - size * 0.21, { lineBreak: false });
}

function pageBreak(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed > PH - 40) {
    doc.addPage();
    doc.rect(0, 0, SW, PH).fill(NAVY);
    doc.rect(SW, 0, PW - SW, PH).fill(OFF_WHITE);
    return 24;
  }
  return y;
}

function estimateCard(proj: ResumeData['projects'][0], w: number): number {
  let h = 20;
  if (proj.techStack.length > 0) h += 20;
  if (proj.description) h += Math.ceil(proj.description.length / Math.floor(w / 5.5)) * 13;
  return h + 16;
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '');
}

function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return s;
  }
}
