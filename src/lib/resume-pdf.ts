// src/lib/resume-pdf.ts
// Generates a professional PDF resume using pdfkit
// Called by /api/resume/generate

import PDFDocument from 'pdfkit';

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
  // Platform activity
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
const ACCENT = '#2563EB'; // primary blue
const TEAL = '#0D9488'; // section teal
const DIVIDER = '#E2E8F0';
const SIDEBAR = '#F1F5F9';
const WHITE = '#FFFFFF';
const SUCCESS = '#059669';
const WARNING = '#D97706';

// ── Layout constants ───────────────────────────────────────────────────────
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const SIDEBAR_W = 180;
const MARGIN = 36;
const SB_X = MARGIN; // sidebar x
const SB_INN = SB_X + 14; // sidebar inner x
const SB_W = SIDEBAR_W - 14; // sidebar text width
const MAIN_X = MARGIN + SIDEBAR_W + 16; // main content x
const MAIN_W = PAGE_W - MAIN_X - MARGIN; // main content width
const HEADER_H = 100;

// ── Colour helper ──────────────────────────────────────────────────────────
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

// ── Sidebar helpers ────────────────────────────────────────────────────────
function sbSection(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor(rgb(ACCENT))
    .text(title.toUpperCase(), SB_INN, y, { characterSpacing: 1.2 });
  y += 11;
  doc
    .rect(SB_INN, y, SB_W - 4, 0.75)
    .fillColor(rgb(ACCENT))
    .fill();
  return y + 7;
}

function sbRow(doc: PDFKit.PDFDocument, label: string, value: string, y: number): number {
  doc
    .font('Helvetica-Bold')
    .fontSize(7)
    .fillColor(rgb(LIGHT))
    .text(label.toUpperCase(), SB_INN, y, { characterSpacing: 0.5 });
  y += 9;
  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(rgb(DARK))
    .text(value, SB_INN, y, { width: SB_W - 4, lineGap: 1 });
  y = doc.y + 6;
  return y;
}

// ── Main section heading ───────────────────────────────────────────────────
function mainSection(
  doc: PDFKit.PDFDocument,
  title: string,
  y: number,
  accentColor: string = TEAL
): number {
  // Left accent bar
  doc.rect(MAIN_X, y, 3, 13).fillColor(rgb(accentColor)).fill();
  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(rgb(accentColor))
    .text(title.toUpperCase(), MAIN_X + 8, y + 2, { characterSpacing: 1 });
  y += 14;
  doc.rect(MAIN_X, y, MAIN_W, 0.75).fillColor(rgb(DIVIDER)).fill();
  return y + 8;
}

// ── Main ───────────────────────────────────────────────────────────────────
export async function generateResumePDF(data: ResumeData): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
  const chunks: Buffer[] = [];

  doc.on('data', (c: Buffer) => chunks.push(c));

  await new Promise<void>((resolve, reject) => {
    doc.on('end', resolve);
    doc.on('error', reject);

    // ────────────────────────────────────────────────────────────────────
    // HEADER
    // ────────────────────────────────────────────────────────────────────
    // Dark background
    doc.rect(0, 0, PAGE_W, HEADER_H).fillColor(rgb(DARK)).fill();
    // Teal top stripe
    doc.rect(0, 0, PAGE_W, 4).fillColor(rgb(TEAL)).fill();
    // Blue bottom stripe
    doc
      .rect(0, HEADER_H - 3, PAGE_W, 3)
      .fillColor(rgb(ACCENT))
      .fill();

    // Name
    doc
      .font('Helvetica-Bold')
      .fontSize(24)
      .fillColor(rgb(WHITE))
      .text(data.name, MARGIN, 18, { width: PAGE_W - 2 * MARGIN });

    // Subtitle
    const subtitle = [data.department, data.university].filter(Boolean).join('  ·  ');
    if (subtitle) {
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(rgb(LIGHT))
        .text(subtitle, MARGIN, 48, { width: PAGE_W - 2 * MARGIN });
    }

    // Contact row
    const contacts = [data.email, data.phone, data.city].filter(Boolean).join('   |   ');
    if (contacts) {
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(rgb(MUTED))
        .text(contacts, MARGIN, 66, { width: PAGE_W - 2 * MARGIN });
    }

    // ────────────────────────────────────────────────────────────────────
    // SIDEBAR BACKGROUND
    // ────────────────────────────────────────────────────────────────────
    doc
      .rect(SB_X, HEADER_H, SIDEBAR_W, PAGE_H - HEADER_H)
      .fillColor(rgb(SIDEBAR))
      .fill();
    // thin accent border on right edge of sidebar
    doc
      .rect(SB_X + SIDEBAR_W - 1, HEADER_H, 1, PAGE_H - HEADER_H)
      .fillColor(rgb(DIVIDER))
      .fill();

    let sy = HEADER_H + 16;

    // ── Contact (sidebar) ──
    sy = sbSection(doc, 'Contact', sy);
    if (data.email) sy = sbRow(doc, 'Email', data.email, sy);
    if (data.phone) sy = sbRow(doc, 'Phone', data.phone, sy);
    if (data.city) sy = sbRow(doc, 'City', data.city, sy);
    sy += 4;

    // ── Links ──
    const links: [string, string][] = [];
    if (data.linkedinUrl)
      links.push(['LinkedIn', data.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')]);
    if (data.githubUrl) links.push(['GitHub', data.githubUrl.replace(/^https?:\/\/(www\.)?/, '')]);
    if (data.portfolioUrl)
      links.push(['Portfolio', data.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')]);

    if (links.length > 0) {
      sy = sbSection(doc, 'Links', sy);
      links.forEach(([label, url]) => {
        sy = sbRow(doc, label, url, sy);
      });
      sy += 4;
    }

    // ── Education ──
    sy = sbSection(doc, 'Education', sy);
    if (data.university) {
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(rgb(DARK))
        .text(data.university, SB_INN, sy, { width: SB_W - 4 });
      sy = doc.y + 3;
    }
    if (data.department) {
      doc.font('Helvetica').fontSize(8.5).fillColor(rgb(MID)).text(data.department, SB_INN, sy);
      sy = doc.y + 3;
    }
    const acadMeta = [
      data.yearOfStudy ? `Year ${data.yearOfStudy}` : '',
      data.currentSemester ?? '',
    ]
      .filter(Boolean)
      .join('  ·  ');
    if (acadMeta) {
      doc.font('Helvetica').fontSize(7.5).fillColor(rgb(LIGHT)).text(acadMeta, SB_INN, sy);
      sy = doc.y + 4;
    }
    if (data.cgpa != null) {
      // CGPA pill
      const pillW = SB_W - 8;
      doc.rect(SB_INN, sy, pillW, 18).fillColor(rgb(ACCENT)).fill();
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(rgb(WHITE))
        .text(`CGPA  ${data.cgpa.toFixed(2)} / 4.00`, SB_INN + 6, sy + 4, { width: pillW - 8 });
      sy += 24;
    }
    if (data.studentId) {
      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(rgb(LIGHT))
        .text(`ID: ${data.studentId}`, SB_INN, sy);
      sy = doc.y + 6;
    }
    sy += 4;

    // ── Skills ──
    if (data.skills.length > 0) {
      sy = sbSection(doc, 'Skills', sy);
      data.skills.forEach((skill) => {
        // Bullet dot
        doc
          .circle(SB_INN + 3, sy + 4.5, 2)
          .fillColor(rgb(TEAL))
          .fill();
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(rgb(MID))
          .text(skill, SB_INN + 10, sy, { width: SB_W - 12 });
        sy = doc.y + 2;
      });
      sy += 6;
    }

    // ── Courses ──
    if (data.completedCourses.length > 0) {
      sy = sbSection(doc, 'Courses', sy);
      data.completedCourses.forEach((c) => {
        doc
          .circle(SB_INN + 3, sy + 4.5, 2)
          .fillColor(rgb(MUTED))
          .fill();
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(rgb(MID))
          .text(c, SB_INN + 10, sy, { width: SB_W - 12 });
        sy = doc.y + 2;
      });
      sy += 6;
    }

    // ── Nextern Score ──
    if (data.opportunityScore && data.opportunityScore > 0) {
      sy = sbSection(doc, 'Nextern Score', sy);
      const barW = SB_W - 8;
      const fillW = Math.round((data.opportunityScore / 100) * barW);
      // Track
      doc.rect(SB_INN, sy, barW, 8).fillColor(rgb(DIVIDER)).fill();
      // Fill
      const barColor =
        data.opportunityScore >= 70 ? SUCCESS : data.opportunityScore >= 40 ? ACCENT : WARNING;
      doc.rect(SB_INN, sy, fillW, 8).fillColor(rgb(barColor)).fill();
      sy += 12;
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(rgb(DARK))
        .text(`${data.opportunityScore} / 100`, SB_INN, sy);
      sy = doc.y + 8;
    }

    // ────────────────────────────────────────────────────────────────────
    // MAIN CONTENT
    // ────────────────────────────────────────────────────────────────────
    let cy = HEADER_H + 16;

    // ── Professional Summary ──
    if (data.bio) {
      cy = mainSection(doc, 'Professional Summary', cy);
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(rgb(MID))
        .text(data.bio, MAIN_X, cy, { width: MAIN_W, lineGap: 2.5 });
      cy = doc.y + 14;
    }

    // ── Projects ──
    if (data.projects.length > 0) {
      cy = mainSection(doc, 'Projects', cy);
      data.projects.forEach((proj, i) => {
        if (i > 0) {
          doc.rect(MAIN_X, cy, MAIN_W, 0.5).fillColor(rgb(DIVIDER)).fill();
          cy += 8;
        }
        // Title
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(rgb(DARK)).text(proj.title, MAIN_X, cy);
        cy = doc.y + 2;
        // Tech stack
        if (proj.techStack?.length > 0) {
          doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor(rgb(TEAL))
            .text(proj.techStack.join('  ·  '), MAIN_X, cy);
          cy = doc.y + 4;
        }
        // Description
        if (proj.description) {
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor(rgb(MID))
            .text(proj.description, MAIN_X, cy, { width: MAIN_W, lineGap: 2 });
          cy = doc.y + 4;
        }
        // Links
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
      cy += 10;
    }

    // ── Certifications ──
    if (data.certifications.length > 0) {
      cy = mainSection(doc, 'Certifications', cy);
      data.certifications.forEach((cert, i) => {
        if (i > 0) cy += 5;
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
      cy += 10;
    }

    // ── Platform Activity: Job Applications ──
    const jobs = data.jobApplications?.filter((a) => a.job) ?? [];
    if (jobs.length > 0) {
      cy = mainSection(doc, 'Platform Activity — Job Applications', cy, ACCENT);
      jobs.forEach((app, i) => {
        if (i > 0) {
          doc.rect(MAIN_X, cy, MAIN_W, 0.5).fillColor(rgb(DIVIDER)).fill();
          cy += 8;
        }
        const job = app.job!;
        // Row: title + status pill
        const statusColor =
          app.status === 'hired'
            ? SUCCESS
            : app.status === 'shortlisted' || app.status === 'interview_scheduled'
              ? ACCENT
              : MUTED;
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(rgb(DARK))
          .text(job.title, MAIN_X, cy, { continued: false });
        cy = doc.y + 1;

        // Company · type · location
        const meta = [
          job.companyName,
          jobTypeLabel(job.type),
          job.city ? `${job.city} (${job.locationType})` : job.locationType,
        ].join('  ·  ');
        doc.font('Helvetica').fontSize(8.5).fillColor(rgb(MUTED)).text(meta, MAIN_X, cy);
        cy = doc.y + 2;

        // Status + date row
        const statusText = statusLabel(app.status);
        const dateText = app.appliedAt ? fmtDate(app.appliedAt) : '';
        const fitText = app.fitScore != null ? `Fit: ${app.fitScore}%` : '';

        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor(rgb(statusColor))
          .text(statusText, MAIN_X, cy, { continued: true });
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
        cy = doc.y + 4;
      });
      cy += 10;
    }

    // ── Platform Activity: Events & Webinars ──
    const events = data.eventRegistrations?.filter((e) => e.job) ?? [];
    if (events.length > 0) {
      cy = mainSection(doc, 'Platform Activity — Events & Webinars', cy, TEAL);
      events.forEach((evt, i) => {
        if (i > 0) cy += 4;
        const job = evt.job!;
        doc
          .circle(MAIN_X + 4, cy + 4.5, 2.5)
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
        cy = doc.y + 4;
      });
      cy += 6;
    }

    // ────────────────────────────────────────────────────────────────────
    // FOOTER
    // ────────────────────────────────────────────────────────────────────
    const footerY = PAGE_H - 26;
    doc.rect(0, footerY, PAGE_W, 26).fillColor(rgb(DARK)).fill();
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
        MARGIN,
        footerY + 10,
        { width: PAGE_W - 2 * MARGIN, align: 'center' }
      );

    doc.end();
  });

  return Buffer.concat(chunks);
}
