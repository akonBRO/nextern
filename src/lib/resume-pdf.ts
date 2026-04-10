// src/lib/resume-pdf.ts
// Generates a professional PDF resume using pdfkit
// Called by /api/resume/generate

import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http';

// ── Types ──────────────────────────────────────────────────────────────────
export type ResumeData = {
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
  opportunityScore?: number;
  skills: string[];
  completedCourses: string[];
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
  jobApplications?: {
    status: string;
    appliedAt: string | null;
    fitScore: number | null;
    job: {
      title: string;
      type: string;
      companyName: string;
      city?: string | null;
      locationType: string;
      stipendBDT?: number | null;
      durationMonths?: number | null;
    } | null;
  }[];
  eventRegistrations?: {
    status: string;
    appliedAt: string | null;
    job: {
      title: string;
      type: string;
      companyName: string;
    } | null;
  }[];
};

// ── Colour palette ─────────────────────────────────────────────────────────
const DARK = '#0F172A';
const MID = '#334155';
const MUTED = '#64748B';
const LIGHT = '#94A3B8';
const ACCENT = '#2563EB';
const TEAL = '#0D9488';
const DIVIDER = '#E2E8F0';
const WHITE = '#FFFFFF';
const SUCCESS = '#059669';
const WARNING = '#D97706';

// ── Layout constants ───────────────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const SIDEBAR_W = 190;
const SB_PAD = 20;
const SB_INN = SB_PAD;
const SB_W = SIDEBAR_W - SB_PAD * 2;
const MAIN_X = SIDEBAR_W + 24;
const MAIN_W = PAGE_W - MAIN_X - 24;
const HEADER_H = 110;

// ── Helpers ────────────────────────────────────────────────────────────────
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fmtDate(d?: string | null): string {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function jobTypeLabel(t: string): string {
  const map: Record<string, string> = {
    internship: 'Internship',
    'part-time': 'Part-time',
    'full-time': 'Full-time',
    'campus-drive': 'Campus Drive',
    webinar: 'Webinar',
    workshop: 'Workshop',
  };
  return map[t] ?? t;
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    applied: 'Applied',
    under_review: 'Under Review',
    shortlisted: 'Shortlisted',
    assessment_sent: 'Assessment Sent',
    interview_scheduled: 'Interview Scheduled',
    hired: 'Hired',
    rejected: 'Not Selected',
    withdrawn: 'Withdrawn',
  };
  return map[s] ?? s;
}

async function fetchImage(url: string): Promise<Buffer | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const attempt = (u: string, hops = 0) => {
      if (hops > 2) {
        resolve(null);
        return;
      }
      const mod = u.startsWith('https') ? https : http;
      const req = mod.get(u, { timeout: 8000 }, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          attempt(res.headers.location, hops + 1);
          return;
        }
        if (!res.statusCode || res.statusCode >= 400) {
          resolve(null);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    };
    attempt(url);
  });
}

// ── Sidebar section heading ────────────────────────────────────────────────
function sbSection(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor([147, 197, 253] as unknown as string)
    .text(title.toUpperCase(), SB_INN, y, { characterSpacing: 1.5 });
  y += 10;
  doc
    .rect(SB_INN, y, SB_W, 0.5)
    .fillColor([37, 99, 235] as unknown as string)
    .fill();
  return y + 7;
}

function sbRow(doc: PDFKit.PDFDocument, label: string, value: string, y: number): number {
  doc
    .font('Helvetica-Bold')
    .fontSize(6.5)
    .fillColor([100, 116, 139] as unknown as string)
    .text(label.toUpperCase(), SB_INN, y, { characterSpacing: 0.8 });
  y += 8;
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor([226, 232, 240] as unknown as string)
    .text(value, SB_INN, y, { width: SB_W, lineGap: 1.5 });
  y = doc.y + 7;
  return y;
}

// ── Main section heading ───────────────────────────────────────────────────
function mainSection(
  doc: PDFKit.PDFDocument,
  title: string,
  y: number,
  color: string = TEAL
): number {
  doc.rect(MAIN_X, y, 3, 12).fillColor(rgb(color)).fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(rgb(color))
    .text(title.toUpperCase(), MAIN_X + 9, y + 2, { characterSpacing: 1.2 });
  y += 13;
  doc.rect(MAIN_X, y, MAIN_W, 0.5).fillColor(rgb(DIVIDER)).fill();
  return y + 9;
}

// ── Main ───────────────────────────────────────────────────────────────────
export async function generateResumePDF(data: ResumeData): Promise<Buffer> {
  const imageBuffer = data.image ? await fetchImage(data.image) : null;

  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  await new Promise<void>((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);

    // ── FULL-HEIGHT DARK SIDEBAR ──────────────────────────────────────────
    doc.rect(0, 0, SIDEBAR_W, PAGE_H).fillColor(rgb(DARK)).fill();
    doc
      .rect(SIDEBAR_W - 2, 0, 2, PAGE_H)
      .fillColor(rgb(TEAL))
      .fill();

    // ── HEADER BAND (right side) ──────────────────────────────────────────
    doc
      .rect(SIDEBAR_W, 0, PAGE_W - SIDEBAR_W, HEADER_H)
      .fillColor(rgb(DARK))
      .fill();
    doc
      .rect(SIDEBAR_W, HEADER_H - 3, PAGE_W - SIDEBAR_W, 3)
      .fillColor(rgb(ACCENT))
      .fill();

    // ── PROFILE PHOTO — no ring border, bigger size ───────────────────────
    // CHANGE 1: removed teal + white ring, increased size from 100→116
    const photoSize = 116;
    const photoX = (SIDEBAR_W - photoSize) / 2;
    const photoY = 20;
    const cx = photoX + photoSize / 2;
    const cy_photo = photoY + photoSize / 2;

    if (imageBuffer) {
      try {
        doc.save();
        doc.circle(cx, cy_photo, photoSize / 2).clip();
        doc.image(imageBuffer, photoX, photoY, {
          width: photoSize,
          height: photoSize,
          cover: [photoSize, photoSize],
        });
        doc.restore();
      } catch {
        doc
          .circle(cx, cy_photo, photoSize / 2)
          .fillColor(rgb(ACCENT))
          .fill();
        const initials = data.name
          .split(' ')
          .map((w) => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        doc
          .font('Helvetica-Bold')
          .fontSize(30)
          .fillColor(rgb(WHITE))
          .text(initials, photoX, cy_photo - 16, { width: photoSize, align: 'center' });
      }
    } else {
      doc
        .circle(cx, cy_photo, photoSize / 2)
        .fillColor(rgb(ACCENT))
        .fill();
      const initials = data.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      doc
        .font('Helvetica-Bold')
        .fontSize(30)
        .fillColor(rgb(WHITE))
        .text(initials, photoX, cy_photo - 16, { width: photoSize, align: 'center' });
    }

    // ── NAME + SUBTITLE in header ─────────────────────────────────────────
    const hx = SIDEBAR_W + 28;
    const hWidth = PAGE_W - hx - 20;

    doc
      .font('Helvetica-Bold')
      .fontSize(26)
      .fillColor(rgb(WHITE))
      .text(data.name, hx, 22, { width: hWidth });

    const subtitle = [data.department, data.university].filter(Boolean).join('  ·  ');
    if (subtitle) {
      doc
        .font('Helvetica')
        .fontSize(10.5)
        .fillColor([147, 197, 253] as unknown as string)
        .text(subtitle, hx, 56, { width: hWidth });
    }

    // CHANGE 2: use · as separator between contact items
    const contactParts: string[] = [];
    if (data.email) contactParts.push(data.email);
    if (data.phone) contactParts.push(data.phone);
    if (data.city) contactParts.push(data.city);
    if (contactParts.length > 0) {
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor([148, 163, 184] as unknown as string)
        .text(contactParts.join('   ·   '), hx, 80, { width: hWidth });
    }

    // Link row in header
    const linkParts: string[] = [];
    if (data.linkedinUrl) linkParts.push(data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''));
    if (data.githubUrl) linkParts.push(data.githubUrl.replace(/^https?:\/\/(www\.)?/, ''));
    if (data.portfolioUrl) linkParts.push(data.portfolioUrl.replace(/^https?:\/\/(www\.)?/, ''));
    if (linkParts.length > 0) {
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor([99, 179, 237] as unknown as string)
        .text(linkParts.join('   ·   '), hx, 98, { width: hWidth });
    }

    // ── SIDEBAR CONTENT ───────────────────────────────────────────────────
    let sy = photoY + photoSize + 16;

    // CHANGE 3 & 4: Contact section FIRST, includes all links
    sy = sbSection(doc, 'Contact', sy);
    if (data.email) sy = sbRow(doc, 'Email', data.email, sy);
    if (data.phone) sy = sbRow(doc, 'Phone', data.phone, sy);
    if (data.city) sy = sbRow(doc, 'City', data.city, sy);
    if (data.linkedinUrl)
      sy = sbRow(doc, 'LinkedIn', data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, ''), sy);
    if (data.githubUrl)
      sy = sbRow(doc, 'GitHub', data.githubUrl.replace(/^https?:\/\/(www\.)?/, ''), sy);
    if (data.portfolioUrl)
      sy = sbRow(doc, 'Portfolio', data.portfolioUrl.replace(/^https?:\/\/(www\.)?/, ''), sy);
    sy += 4;

    // ── Education ──
    sy = sbSection(doc, 'Education', sy);
    if (data.university) {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor([248, 250, 252] as unknown as string)
        .text(data.university, SB_INN, sy, { width: SB_W });
      sy = doc.y + 3;
    }
    if (data.department) {
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor([203, 213, 225] as unknown as string)
        .text(data.department, SB_INN, sy);
      sy = doc.y + 3;
    }
    const acadMeta = [
      data.yearOfStudy ? `Year ${data.yearOfStudy}` : '',
      data.currentSemester ?? '',
    ]
      .filter(Boolean)
      .join('  ·  ');
    if (acadMeta) {
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor([100, 116, 139] as unknown as string)
        .text(acadMeta, SB_INN, sy);
      sy = doc.y + 5;
    }
    if (data.cgpa != null) {
      const pillW = SB_W;
      doc.rect(SB_INN, sy, pillW, 20).fillColor(rgb(ACCENT)).fill();
      doc
        .font('Helvetica-Bold')
        .fontSize(9.5)
        .fillColor(rgb(WHITE))
        .text(`CGPA  ${data.cgpa.toFixed(2)} / 4.00`, SB_INN, sy + 5, {
          width: pillW,
          align: 'center',
        });
      sy += 27;
    }
    sy += 8;

    // ── Skills ──
    if (data.skills.length > 0) {
      sy = sbSection(doc, 'Skills', sy);
      data.skills.forEach((skill) => {
        doc
          .circle(SB_INN + 3.5, sy + 5, 2.5)
          .fillColor(rgb(TEAL))
          .fill();
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor([203, 213, 225] as unknown as string)
          .text(skill, SB_INN + 12, sy, { width: SB_W - 14 });
        sy = doc.y + 3;
      });
      sy += 8;
    }

    // ── Completed Courses ──
    if (data.completedCourses.length > 0) {
      sy = sbSection(doc, 'Completed Courses', sy);
      data.completedCourses.forEach((c) => {
        doc
          .circle(SB_INN + 3.5, sy + 5, 2)
          .fillColor([71, 85, 105] as unknown as string)
          .fill();
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor([148, 163, 184] as unknown as string)
          .text(c, SB_INN + 12, sy, { width: SB_W - 14 });
        sy = doc.y + 3;
      });
      sy += 8;
    }

    // ── Nextern Score ──
    if (data.opportunityScore && data.opportunityScore > 0) {
      sy = sbSection(doc, 'Nextern Score', sy);
      const barW = SB_W;
      const fillW = Math.round((data.opportunityScore / 100) * barW);
      doc
        .rect(SB_INN, sy, barW, 9)
        .fillColor([30, 41, 59] as unknown as string)
        .fill();
      const barColor =
        data.opportunityScore >= 70 ? SUCCESS : data.opportunityScore >= 40 ? ACCENT : WARNING;
      doc.rect(SB_INN, sy, fillW, 9).fillColor(rgb(barColor)).fill();
      sy += 14;
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor([226, 232, 240] as unknown as string)
        .text(`${data.opportunityScore} / 100`, SB_INN, sy);
      sy = doc.y + 10;
    }

    // ────────────────────────────────────────────────────────────────────
    // MAIN CONTENT
    // ────────────────────────────────────────────────────────────────────
    doc
      .rect(SIDEBAR_W, HEADER_H, PAGE_W - SIDEBAR_W, PAGE_H - HEADER_H)
      .fillColor(rgb(WHITE))
      .fill();

    let cy = HEADER_H + 20;

    // ── Professional Summary ──
    if (data.bio) {
      cy = mainSection(doc, 'Professional Summary', cy);
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(rgb(MID))
        .text(data.bio, MAIN_X, cy, { width: MAIN_W, lineGap: 3 });
      cy = doc.y + 16;
    }

    // ── Projects ──
    if (data.projects.length > 0) {
      cy = mainSection(doc, 'Projects', cy);
      data.projects.forEach((proj, i) => {
        if (i > 0) {
          doc.rect(MAIN_X, cy, MAIN_W, 0.5).fillColor(rgb(DIVIDER)).fill();
          cy += 9;
        }
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(rgb(DARK)).text(proj.title, MAIN_X, cy);
        cy = doc.y + 2;
        if (proj.techStack?.length > 0) {
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor(rgb(TEAL))
            .text(proj.techStack.join('  ·  '), MAIN_X, cy);
          cy = doc.y + 4;
        }
        if (proj.description) {
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor(rgb(MID))
            .text(proj.description, MAIN_X, cy, { width: MAIN_W, lineGap: 2.5 });
          cy = doc.y + 4;
        }
        const lnks: string[] = [];
        if (proj.projectUrl) lnks.push(`Live: ${proj.projectUrl.replace(/^https?:\/\//, '')}`);
        if (proj.repoUrl) lnks.push(`Repo: ${proj.repoUrl.replace(/^https?:\/\//, '')}`);
        if (lnks.length > 0) {
          doc
            .font('Helvetica')
            .fontSize(7.5)
            .fillColor(rgb(ACCENT))
            .text(lnks.join('   '), MAIN_X, cy);
          cy = doc.y + 4;
        }
      });
      cy += 12;
    }

    // ── Certifications ──
    if (data.certifications.length > 0) {
      cy = mainSection(doc, 'Certifications', cy);
      data.certifications.forEach((cert, i) => {
        if (i > 0) cy += 6;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(rgb(DARK)).text(cert.name, MAIN_X, cy);
        cy = doc.y + 1;
        const meta = [cert.issuedBy, cert.issueDate ? fmtDate(cert.issueDate) : '']
          .filter(Boolean)
          .join('  ·  ');
        doc.font('Helvetica').fontSize(8.5).fillColor(rgb(LIGHT)).text(meta, MAIN_X, cy);
        cy = doc.y + 3;
        if (cert.credentialUrl) {
          doc
            .font('Helvetica')
            .fontSize(7.5)
            .fillColor(rgb(ACCENT))
            .text(cert.credentialUrl.replace(/^https?:\/\//, ''), MAIN_X, cy);
          cy = doc.y + 3;
        }
      });
      cy += 12;
    }

    // ── Platform Activity: Job Applications ──
    const jobs = data.jobApplications?.filter((a) => a.job) ?? [];
    if (jobs.length > 0) {
      cy = mainSection(doc, 'Platform Activity — Job Applications', cy, ACCENT);
      jobs.forEach((app, i) => {
        if (i > 0) {
          doc.rect(MAIN_X, cy, MAIN_W, 0.5).fillColor(rgb(DIVIDER)).fill();
          cy += 9;
        }
        const job = app.job!;
        const statusColor =
          app.status === 'hired'
            ? SUCCESS
            : app.status === 'shortlisted' || app.status === 'interview_scheduled'
              ? ACCENT
              : MUTED;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(rgb(DARK)).text(job.title, MAIN_X, cy);
        cy = doc.y + 1;
        const meta = [
          job.companyName,
          jobTypeLabel(job.type),
          job.city ? `${job.city} (${job.locationType})` : job.locationType,
        ].join('  ·  ');
        doc.font('Helvetica').fontSize(8.5).fillColor(rgb(MUTED)).text(meta, MAIN_X, cy);
        cy = doc.y + 2;
        const statusText = statusLabel(app.status);
        const dateText = app.appliedAt ? fmtDate(app.appliedAt) : '';
        const fitText = app.fitScore != null ? `Fit: ${app.fitScore}%` : '';
        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor(rgb(statusColor))
          .text(statusText, MAIN_X, cy, { continued: !!(dateText || fitText) });
        if (dateText) {
          doc
            .font('Helvetica')
            .fontSize(7.5)
            .fillColor(rgb(LIGHT))
            .text(`   Applied ${dateText}`, { continued: !!fitText });
        }
        if (fitText) {
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor(rgb(TEAL)).text(`   ${fitText}`);
        }
        cy = doc.y + 5;
      });
      cy += 12;
    }

    // ── Platform Activity: Events ──
    const events = data.eventRegistrations?.filter((e) => e.job) ?? [];
    if (events.length > 0) {
      cy = mainSection(doc, 'Platform Activity — Events & Webinars', cy, TEAL);
      events.forEach((evt, i) => {
        if (i > 0) cy += 5;
        const job = evt.job!;
        doc
          .circle(MAIN_X + 4, cy + 5, 2.5)
          .fillColor(rgb(TEAL))
          .fill();
        doc
          .font('Helvetica-Bold')
          .fontSize(9.5)
          .fillColor(rgb(DARK))
          .text(job.title, MAIN_X + 12, cy);
        cy = doc.y + 1;
        const meta2 = [job.companyName, jobTypeLabel(job.type)].join('  ·  ');
        const dateStr = evt.appliedAt ? `  ·  ${fmtDate(evt.appliedAt)}` : '';
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(rgb(MUTED))
          .text(`${meta2}${dateStr}`, MAIN_X + 12, cy);
        cy = doc.y + 5;
      });
      cy += 8;
    }

    // ── FOOTER ────────────────────────────────────────────────────────────
    const footerY = PAGE_H - 28;
    doc.rect(0, footerY, PAGE_W, 28).fillColor(rgb(DARK)).fill();
    doc.rect(0, footerY, PAGE_W, 2).fillColor(rgb(ACCENT)).fill();
    const generated = new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor(rgb(MUTED))
      .text(
        `Generated by Nextern  ·  nextern-virid.vercel.app  ·  ${generated}`,
        36,
        footerY + 11,
        { width: PAGE_W - 72, align: 'center' }
      );

    doc.end();
  });

  return Buffer.concat(chunks);
}
