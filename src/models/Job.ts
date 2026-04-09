// src/lib/resume-pdf.ts
// Professional two-column resume — navy sidebar, off-white body.
// Sections: Contact · Education · Skills · Courses · Links (sidebar)
//           Summary · Experience (Platform) · Projects · Certifications (body)

import PDFDocument from 'pdfkit';
import https from 'https';
import http from 'http';

// ── Palette ───────────────────────────────────────────────────────────────
const NAVY = '#0F172A'; // sidebar bg
const NAVY2 = '#1E293B'; // header bg, section label colour
const NAVY3 = '#334155'; // body text
const BLUE = '#2563EB'; // links, status pill bg
const BLUE_LIGHT = '#EFF6FF'; // skill tag bg (body)
const CYAN = '#22D3EE'; // opportunity score accent
const GREEN = '#10B981'; // hired / positive status
const AMBER = '#F59E0B'; // shortlisted / warning status
const RED_SOFT = '#EF4444'; // rejected status
const ORANGE = '#F97316'; // header accent rule
const WHITE = '#FFFFFF';
const OFF_WHITE = '#F8FAFC'; // body bg
const LIGHT_RULE = '#E2E8F0'; // body dividers
const SIDEBAR_TXT = '#CBD5E1'; // sidebar primary text
const SIDEBAR_MUT = '#64748B'; // sidebar muted text
const SIDEBAR_DIM = '#475569'; // sidebar even more muted
const BODY_MUT = '#64748B'; // body secondary text

// ── Page metrics ──────────────────────────────────────────────────────────
const PW = 595.28;
const PH = 841.89;
const SW = 172; // sidebar width
const BX = SW + 24; // body X start
const BW = PW - BX - 24; // body width
const SX = 14; // sidebar content X
const SCON_W = SW - SX - 10; // sidebar content width
const HEADER_H = 140;

// ── Status colour map ─────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  hired: { bg: '#DCFCE7', text: '#065F46', dot: GREEN },
  shortlisted: { bg: '#FFFBEB', text: '#92400E', dot: AMBER },
  under_review: { bg: '#FFFBEB', text: '#92400E', dot: AMBER },
  assessment_sent: { bg: '#EFF6FF', text: '#1D4ED8', dot: BLUE },
  interview_scheduled: { bg: '#EDE9FE', text: '#5B21B6', dot: '#7C3AED' },
  applied: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  rejected: { bg: '#FEF2F2', text: '#991B1B', dot: RED_SOFT },
  withdrawn: { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' },
};

const TYPE_LABELS: Record<string, string> = {
  internship: 'Internship',
  'part-time': 'Part-time',
  'full-time': 'Full-time',
  'campus-drive': 'Campus Drive',
  webinar: 'Webinar',
  workshop: 'Workshop',
};

// ── Types ─────────────────────────────────────────────────────────────────
export interface PlatformActivity {
  jobTitle: string;
  companyName: string;
  type: string;
  locationType: string;
  city?: string;
  status: string;
  appliedAt: string;
  fitScore?: number;
  isEventRegistration: boolean;
  stipendBDT?: number;
  durationMonths?: number;
}

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
  platformActivity?: PlatformActivity[];
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

// ── Fetch remote image ────────────────────────────────────────────────────
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
        reject(new Error(`HTTP ${res.statusCode}`));
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
      reject(new Error('timeout'));
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
      console.warn('[resume-pdf] photo fetch failed:', e);
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

    // ── Page backgrounds ──────────────────────────────────────────────────
    doc.rect(0, 0, SW, PH).fill(NAVY);
    doc.rect(SW, 0, PW - SW, PH).fill(OFF_WHITE);

    // ── Header band ───────────────────────────────────────────────────────
    doc.rect(0, 0, PW, HEADER_H).fill(NAVY2);
    doc.rect(0, HEADER_H - 2, PW, 2).fill(ORANGE); // orange accent rule

    // ── Profile photo ─────────────────────────────────────────────────────
    const PHOTO = 108;
    const PX = PW - PHOTO - 14;
    const PY = Math.round((HEADER_H - PHOTO) / 2);

    if (imgBuf) {
      try {
        doc.save();
        doc.circle(PX + PHOTO / 2, PY + PHOTO / 2, PHOTO / 2).clip();
        doc.image(imgBuf, PX, PY, { width: PHOTO, height: PHOTO, cover: [PHOTO, PHOTO] });
        doc.restore();
      } catch {
        drawInitials(doc, data.name, PX, PY, PHOTO);
      }
    } else {
      drawInitials(doc, data.name, PX, PY, PHOTO);
    }

    // ── Header text ───────────────────────────────────────────────────────
    const TX = SW + 20;
    const TWIDTH = PX - TX - 12;

    doc.font('Helvetica-Bold').fontSize(23).fillColor(WHITE);
    doc.text(data.name, TX, 22, { width: TWIDTH, lineBreak: false });

    const role = [data.department, data.university].filter(Boolean).join('  ·  ');
    if (role) {
      doc.font('Helvetica').fontSize(9.5).fillColor('#93C5FD');
      doc.text(role, TX, 51, { width: TWIDTH, lineBreak: false });
    }

    const contacts = [data.email, data.phone, data.city].filter(Boolean) as string[];
    if (contacts.length) {
      doc.font('Helvetica').fontSize(8.5).fillColor(SIDEBAR_TXT);
      doc.text(contacts.join('   |   '), TX, 69, { width: TWIDTH, lineBreak: false });
    }

    const linkArr = [data.linkedinUrl, data.githubUrl, data.portfolioUrl]
      .filter(Boolean)
      .map((u) => stripProtocol(u!));
    if (linkArr.length) {
      doc.font('Helvetica').fontSize(8).fillColor('#7DD3FC');
      doc.text(linkArr.join('   ·   '), TX, 86, { width: TWIDTH, lineBreak: false });
    }

    // Opportunity score chip in header
    if (data.opportunityScore != null && data.opportunityScore > 0) {
      const chip = `Opportunity Score  ${data.opportunityScore}/100`;
      const cw = doc.font('Helvetica-Bold').fontSize(7.5).widthOfString(chip) + 16;
      doc.roundedRect(TX, 104, cw, 18, 4).fill('rgba(34,211,238,0.15)');
      doc
        .moveTo(TX, 104)
        .lineTo(TX + cw, 104)
        .strokeColor(CYAN)
        .lineWidth(0.6)
        .stroke();
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(CYAN);
      doc.text(chip, TX + 8, 109, { lineBreak: false });
    }

    // ── ════════════════════════════════════════════════════════════════════
    //    SIDEBAR
    // ══════════════════════════════════════════════════════════════════════
    let sy = HEADER_H + 20;

    // ── Contact ──────────────────────────────────────────────────────────
    sy = sidebarHead(doc, 'CONTACT', sy);

    const contactItems: [string, string | undefined][] = [
      ['✉', data.email],
      ['✆', data.phone],
      ['⌖', data.city],
    ];
    for (const [icon, val] of contactItems) {
      if (!val || sy > PH - 60) continue;
      doc.font('Helvetica-Bold').fontSize(7).fillColor(SIDEBAR_MUT);
      doc.text(icon, SX, sy + 1, { lineBreak: false, width: 10 });
      doc.font('Helvetica').fontSize(7.5).fillColor(SIDEBAR_TXT);
      doc.text(val, SX + 12, sy, { width: SCON_W - 12, lineBreak: false });
      sy += 13;
    }
    sy += 6;

    // ── Education ────────────────────────────────────────────────────────
    if (data.university || data.cgpa != null) {
      sy = sidebarHead(doc, 'EDUCATION', sy);

      if (data.university) {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(WHITE);
        doc.text(data.university, SX, sy, { width: SCON_W });
        sy = doc.y + 2;
      }
      if (data.department) {
        doc.font('Helvetica').fontSize(8).fillColor(SIDEBAR_TXT);
        doc.text(data.department, SX, sy, { width: SCON_W });
        sy = doc.y + 2;
      }
      const meta = [data.yearOfStudy ? `Year ${data.yearOfStudy}` : '', data.currentSemester ?? '']
        .filter(Boolean)
        .join('  ·  ');
      if (meta) {
        doc.font('Helvetica').fontSize(7.5).fillColor(SIDEBAR_MUT);
        doc.text(meta, SX, sy, { width: SCON_W });
        sy = doc.y + 4;
      }
      if (data.cgpa != null) {
        // CGPA pill
        doc.roundedRect(SX, sy, SCON_W, 22, 4).fill('rgba(255,255,255,0.07)');
        doc
          .moveTo(SX, sy)
          .lineTo(SX, sy + 22)
          .strokeColor(CYAN)
          .lineWidth(2)
          .stroke();
        doc.font('Helvetica-Bold').fontSize(9).fillColor(WHITE);
        doc.text(`CGPA  ${data.cgpa.toFixed(2)} / 4.00`, SX + 8, sy + 6, { lineBreak: false });
        sy += 30;
      }
      if (data.studentId) {
        doc.font('Helvetica').fontSize(7).fillColor(SIDEBAR_DIM);
        doc.text(`ID: ${data.studentId}`, SX, sy, { width: SCON_W });
        sy = doc.y + 3;
      }
      sy += 8;
    }

    // ── Skills ────────────────────────────────────────────────────────────
    if (data.skills.length > 0) {
      sy = sidebarHead(doc, 'SKILLS', sy);
      for (const skill of data.skills) {
        if (sy > PH - 70) break;
        // skill dot + text
        doc.circle(SX + 3, sy + 4.5, 2).fill('#3B82F6');
        doc.font('Helvetica').fontSize(8.5).fillColor(SIDEBAR_TXT);
        doc.text(skill, SX + 10, sy, { width: SCON_W - 10, lineBreak: false });
        sy += 13;
      }
      sy += 8;
    }

    // ── Courses ───────────────────────────────────────────────────────────
    if (data.completedCourses.length > 0 && sy < PH - 100) {
      sy = sidebarHead(doc, 'COURSES', sy);
      // Render as small pills 2-per-row
      let cx2 = SX,
        cy2 = sy;
      for (const course of data.completedCourses.slice(0, 20)) {
        if (cy2 > PH - 70) break;
        const cw = doc.font('Helvetica').fontSize(7).widthOfString(course) + 10;
        if (cx2 + cw > SX + SCON_W) {
          cx2 = SX;
          cy2 += 15;
        }
        doc.roundedRect(cx2, cy2, cw, 12, 2).fill('rgba(255,255,255,0.06)');
        doc.font('Helvetica').fontSize(7).fillColor(SIDEBAR_MUT);
        doc.text(course, cx2 + 5, cy2 + 2, { lineBreak: false });
        cx2 += cw + 4;
      }
      sy = cy2 + 18;
    }

    // ── Links ─────────────────────────────────────────────────────────────
    if ((data.linkedinUrl || data.githubUrl || data.portfolioUrl) && sy < PH - 90) {
      sy = sidebarHead(doc, 'LINKS', sy);
      for (const [label, url] of [
        ['LinkedIn', data.linkedinUrl],
        ['GitHub', data.githubUrl],
        ['Portfolio', data.portfolioUrl],
      ] as [string, string | undefined][]) {
        if (!url || sy > PH - 65) continue;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#7DD3FC');
        doc.text(label, SX, sy, { lineBreak: false });
        sy += 10;
        doc.font('Helvetica').fontSize(6.8).fillColor(SIDEBAR_DIM);
        doc.text(stripProtocol(url), SX, sy, { width: SCON_W });
        sy = doc.y + 7;
      }
    }

    // ── ════════════════════════════════════════════════════════════════════
    //    BODY
    // ══════════════════════════════════════════════════════════════════════
    let by = HEADER_H + 20;

    // ── Professional Summary ──────────────────────────────────────────────
    if (data.bio) {
      by = bodyHead(doc, 'PROFESSIONAL SUMMARY', by);
      // Light teal left bar for summary
      doc.roundedRect(BX - 4, by - 2, 3, 999, 2); // will be clipped by text height
      doc.font('Helvetica').fontSize(9.5).fillColor(NAVY3);
      doc.text(data.bio, BX, by, { width: BW, lineGap: 3.5 });
      const endY = doc.y;
      // Draw the left bar now that we know height
      doc.roundedRect(BX - 4, by - 2, 3, endY - by + 6, 2).fill(NAVY2);
      by = endY + 16;
    }

    // ── Platform Activity (Jobs + Events) ─────────────────────────────────
    const activity = data.platformActivity ?? [];
    const jobs = activity.filter((a) => !a.isEventRegistration);
    const events = activity.filter((a) => a.isEventRegistration);

    if (jobs.length > 0) {
      by = pageBreak(doc, by, 60);
      by = bodyHead(doc, 'INTERNSHIP & JOB APPLICATIONS', by);

      for (const job of jobs) {
        by = pageBreak(doc, by, 52);
        const sc = STATUS_COLORS[job.status] ?? STATUS_COLORS['applied'];
        const CARD_H = 48;

        // Card background
        doc.roundedRect(BX - 4, by - 4, BW + 8, CARD_H, 5).fill(WHITE);
        // Left accent bar — colour based on status
        doc.roundedRect(BX - 4, by - 4, 3, CARD_H, 2).fill(sc.dot);

        // Job title
        doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
        doc.text(job.jobTitle, BX + 6, by, { width: BW - 100, lineBreak: false });

        // Status pill — top right
        const statusLabel = formatStatusLabel(job.status);
        const pw2 = doc.font('Helvetica-Bold').fontSize(7).widthOfString(statusLabel) + 14;
        const px2 = BX + BW - pw2;
        doc.roundedRect(px2, by - 1, pw2, 13, 3).fill(sc.bg);
        doc.font('Helvetica-Bold').fontSize(7).fillColor(sc.text);
        doc.text(statusLabel, px2 + 7, by + 2, { lineBreak: false });

        by += 14;

        // Company · type · location
        const meta1Parts = [
          job.companyName,
          TYPE_LABELS[job.type] ?? job.type,
          job.city ? `${job.city} (${job.locationType})` : job.locationType,
        ];
        doc.font('Helvetica').fontSize(8.5).fillColor(BODY_MUT);
        doc.text(meta1Parts.join('  ·  '), BX + 6, by, { width: BW - 12, lineBreak: false });
        by += 12;

        // Date · fit score · stipend
        const meta2Parts: string[] = [`Applied ${formatDate(job.appliedAt)}`];
        if (job.fitScore != null && job.fitScore > 0) meta2Parts.push(`AI Fit ${job.fitScore}%`);
        if (job.stipendBDT) meta2Parts.push(`৳${job.stipendBDT.toLocaleString()}/mo`);
        if (job.durationMonths) meta2Parts.push(`${job.durationMonths} months`);

        doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8');
        doc.text(meta2Parts.join('   ·   '), BX + 6, by, { width: BW - 12, lineBreak: false });

        by += CARD_H - 26; // bottom padding
      }
      by += 4;
    }

    if (events.length > 0) {
      by = pageBreak(doc, by, 50);
      by = bodyHead(doc, 'EVENTS & WEBINARS ATTENDED', by);

      for (const ev of events) {
        by = pageBreak(doc, by, 42);
        const CARD_H = 40;

        doc.roundedRect(BX - 4, by - 4, BW + 8, CARD_H, 5).fill(WHITE);
        // Purple accent for events
        doc.roundedRect(BX - 4, by - 4, 3, CARD_H, 2).fill('#7C3AED');

        // Event title
        doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
        doc.text(ev.jobTitle, BX + 6, by, { width: BW - 100, lineBreak: false });

        // Type badge
        const typeLabel = TYPE_LABELS[ev.type] ?? ev.type;
        const tbw = doc.font('Helvetica-Bold').fontSize(7).widthOfString(typeLabel) + 12;
        const tbx = BX + BW - tbw;
        doc.roundedRect(tbx, by - 1, tbw, 13, 3).fill('#EDE9FE');
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#5B21B6');
        doc.text(typeLabel, tbx + 6, by + 2, { lineBreak: false });

        by += 14;

        // Organiser · format · date
        const evMeta = [
          ev.companyName,
          ev.city ? `${ev.city} (${ev.locationType})` : ev.locationType,
          `Registered ${formatDate(ev.appliedAt)}`,
        ];
        doc.font('Helvetica').fontSize(8.5).fillColor(BODY_MUT);
        doc.text(evMeta.join('  ·  '), BX + 6, by, { width: BW - 12, lineBreak: false });

        by += CARD_H - 18;
      }
      by += 4;
    }

    // ── Projects ──────────────────────────────────────────────────────────
    if (data.projects.length > 0) {
      by = pageBreak(doc, by, 60);
      by = bodyHead(doc, 'PROJECTS', by);

      for (const proj of data.projects) {
        by = pageBreak(doc, by, 80);
        const CARD_H = estimateProjectCard(proj, BW);

        doc.roundedRect(BX - 4, by - 4, BW + 8, CARD_H, 5).fill(WHITE);
        doc.roundedRect(BX - 4, by - 4, 3, CARD_H, 2).fill(NAVY2);

        // Title + links
        doc.font('Helvetica-Bold').fontSize(10.5).fillColor(NAVY);
        doc.text(proj.title, BX + 6, by, { width: BW - 75, lineBreak: false });

        const pl = [proj.projectUrl && 'Live ↗', proj.repoUrl && 'Repo ↗'].filter(
          Boolean
        ) as string[];
        if (pl.length) {
          doc.font('Helvetica-Bold').fontSize(8).fillColor(BLUE);
          doc.text(pl.join('  '), BX + BW - 65, by, {
            width: 65,
            align: 'right',
            lineBreak: false,
          });
        }
        by += 15;

        // Tech stack pills
        if (proj.techStack.length > 0) {
          let tx = BX + 6;
          for (const t of proj.techStack) {
            const tw = doc.font('Helvetica').fontSize(7.5).widthOfString(t) + 10;
            if (tx + tw > BX + BW) break;
            doc.roundedRect(tx, by, tw, 13, 3).fill(BLUE_LIGHT);
            doc.font('Helvetica').fontSize(7.5).fillColor(NAVY2);
            doc.text(t, tx + 5, by + 3, { lineBreak: false });
            tx += tw + 4;
          }
          by += 18;
        }

        if (proj.description) {
          doc.font('Helvetica').fontSize(9).fillColor(BODY_MUT);
          doc.text(proj.description, BX + 6, by, { width: BW - 12, lineGap: 2 });
          by = doc.y + 4;
        }
        by += 14;
      }
    }

    // ── Certifications ────────────────────────────────────────────────────
    if (data.certifications.length > 0) {
      by = pageBreak(doc, by, 60);
      by = bodyHead(doc, 'CERTIFICATIONS', by);

      for (const cert of data.certifications) {
        by = pageBreak(doc, by, 36);

        // Small green check circle
        doc.circle(BX + 5, by + 5, 5).fill('#ECFDF5');
        doc.font('Helvetica-Bold').fontSize(7).fillColor(GREEN);
        doc.text('✓', BX + 2, by + 1.5, { lineBreak: false });

        doc.font('Helvetica-Bold').fontSize(10).fillColor(NAVY);
        doc.text(cert.name, BX + 16, by, { width: BW - 16, lineBreak: false });
        by += 14;

        const cmeta = [cert.issuedBy, cert.issueDate ? formatDate(cert.issueDate) : '']
          .filter(Boolean)
          .join('  ·  ');
        doc.font('Helvetica').fontSize(8.5).fillColor(BODY_MUT);
        doc.text(cmeta, BX + 16, by, { lineBreak: false });
        by += 18;
      }
    }

    // ── Footer ────────────────────────────────────────────────────────────
    doc.rect(0, PH - 26, SW, 26).fill('#090E18');
    doc.rect(SW, PH - 26, PW - SW, 26).fill(NAVY2);
    doc.rect(SW, PH - 26, PW - SW, 1).fill(LIGHT_RULE);

    // Footer left — nextern branding
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#334155');
    doc.text('NEXTERN', SX, PH - 13, { lineBreak: false, characterSpacing: 1.8 });

    // Footer right — name · email · generated by
    doc.font('Helvetica').fontSize(7.5).fillColor('#64748B');
    doc.text(`${data.name}  ·  ${data.email}  ·  Generated by Nextern`, BX, PH - 13, {
      lineBreak: false,
    });

    doc.end();
  });
}

// ── Helper: sidebar section heading ──────────────────────────────────────
function sidebarHead(doc: PDFKit.PDFDocument, title: string, y: number): number {
  // Accent dot before label
  doc.circle(SX + 2, y + 4, 2).fill('#3B82F6');
  doc.font('Helvetica-Bold').fontSize(7).fillColor(SIDEBAR_MUT);
  doc.text(title, SX + 8, y, { lineBreak: false, characterSpacing: 1.5 });
  // Subtle rule
  doc
    .moveTo(SX, y + 11)
    .lineTo(SX + SCON_W, y + 11)
    .strokeColor('rgba(255,255,255,0.06)')
    .lineWidth(0.5)
    .stroke();
  return y + 16;
}

// ── Helper: body section heading ──────────────────────────────────────────
function bodyHead(doc: PDFKit.PDFDocument, title: string, y: number): number {
  doc.font('Helvetica-Bold').fontSize(9).fillColor(NAVY2);
  doc.text(title, BX, y, { lineBreak: false, characterSpacing: 0.7 });
  const tw = doc.widthOfString(title, { characterSpacing: 0.7 });
  // Extend rule to right margin
  doc
    .moveTo(BX + tw + 8, y + 6)
    .lineTo(BX + BW, y + 6)
    .strokeColor(LIGHT_RULE)
    .lineWidth(0.7)
    .stroke();
  // Underline title in accent colour
  doc
    .moveTo(BX, y + 12)
    .lineTo(BX + tw, y + 12)
    .strokeColor(NAVY2)
    .lineWidth(1)
    .stroke();
  return y + 22;
}

// ── Helper: draw initials circle ──────────────────────────────────────────
function drawInitials(
  doc: PDFKit.PDFDocument,
  name: string,
  x: number,
  y: number,
  size: number
): void {
  const cx = x + size / 2,
    cy = y + size / 2;
  doc.circle(cx, cy, size / 2).fill(NAVY);
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  doc
    .font('Helvetica-Bold')
    .fontSize(size * 0.38)
    .fillColor(WHITE);
  const tw = doc.widthOfString(initial);
  doc.text(initial, cx - tw / 2, cy - size * 0.21, { lineBreak: false });
}

// ── Helper: page break guard ──────────────────────────────────────────────
function pageBreak(doc: PDFKit.PDFDocument, y: number, needed: number): number {
  if (y + needed > PH - 40) {
    doc.addPage();
    doc.rect(0, 0, SW, PH).fill(NAVY);
    doc.rect(SW, 0, PW - SW, PH).fill(OFF_WHITE);
    return 24;
  }
  return y;
}

// ── Helper: estimate project card height ──────────────────────────────────
function estimateProjectCard(proj: ResumeData['projects'][0], w: number): number {
  let h = 20;
  if (proj.techStack.length > 0) h += 20;
  if (proj.description) h += Math.ceil(proj.description.length / Math.floor(w / 5.5)) * 13;
  return h + 18;
}

// ── Helper: format status label ───────────────────────────────────────────
function formatStatusLabel(s: string): string {
  return s
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Helper: strip protocol from URL ──────────────────────────────────────
function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '');
}

// ── Helper: format date string ────────────────────────────────────────────
function formatDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return s;
  }
}
