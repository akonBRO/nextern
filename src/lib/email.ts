// src/lib/email.ts
// Uses Gmail SMTP via nodemailer.
// Setup: npm install nodemailer && npm install -D @types/nodemailer
// Add GMAIL_USER and GMAIL_APP_PASSWORD to .env.local
//
// How to get GMAIL_APP_PASSWORD:
// 1. Enable 2-Step Verification on your Gmail account
// 2. Go to myaccount.google.com/apppasswords
// 3. Create an app password for Nextern
// 4. Paste it into .env.local as GMAIL_APP_PASSWORD=abcdefghijklmnop

import nodemailer from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

type ApplicationStatusEmailStatus =
  | 'under_review'
  | 'shortlisted'
  | 'assessment_sent'
  | 'interview_scheduled'
  | 'hired'
  | 'rejected';

function getAppUrl(): string {
  return (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

function createGmailTransport() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD is not set in environment variables');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;

  if (!gmailUser) {
    throw new Error('GMAIL_USER is not set in environment variables');
  }

  const transporter = createGmailTransport();

  await transporter.sendMail({
    from: `Nextern <${gmailUser}>`,
    to,
    subject,
    html,
  });
}

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#EEF2F7;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #D9E2EC;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:#0F172A;padding:28px 40px;text-align:center;border-bottom:4px solid #0EA5A4;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:0.02em;">
                nextern<span style="color:#22D3EE;">.</span>
              </h1>
              <p style="margin:8px 0 0;color:#CBD5E1;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">
                Official Notification
              </p>
            </td>
          </tr>

          ${content}

          <tr>
            <td style="background:#F8FAFC;padding:24px 40px;border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0;color:#94A3B8;font-size:12px;">
                &copy; 2026 Nextern. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function applicationStatusEmailTemplate(params: {
  studentName: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatusEmailStatus;
}): { subject: string; html: string } {
  const { studentName, jobTitle, companyName, status } = params;

  const STATUS_EMAIL: Record<
    ApplicationStatusEmailStatus,
    {
      subject: string;
      headline: string;
      body: string;
      statusLabel: string;
      includeFollowUp: boolean;
    }
  > = {
    under_review: {
      subject: `Your application is under review - ${jobTitle}`,
      headline: 'Application under review',
      body: `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;">This is to inform you that ${companyName} is currently reviewing your application for <strong>${jobTitle}</strong>. Your profile is under active consideration.</p>`,
      statusLabel: 'Under Review',
      includeFollowUp: true,
    },
    shortlisted: {
      subject: `You've been shortlisted - ${jobTitle}`,
      headline: 'You have been shortlisted',
      body: `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;">We are pleased to inform you that ${companyName} has shortlisted you for <strong>${jobTitle}</strong>. This reflects strong progress in your application journey.</p>`,
      statusLabel: 'Shortlisted',
      includeFollowUp: true,
    },
    assessment_sent: {
      subject: `Assessment available - ${jobTitle}`,
      headline: 'Assessment assigned',
      body: `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;">${companyName} has issued an assessment for your <strong>${jobTitle}</strong> application. Please review the instructions carefully and complete the assessment within the required timeframe.</p>`,
      statusLabel: 'Assessment Sent',
      includeFollowUp: true,
    },
    interview_scheduled: {
      subject: `Interview scheduled - ${jobTitle}`,
      headline: 'Interview scheduled',
      body: `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;">${companyName} has scheduled an interview for your <strong>${jobTitle}</strong> application. Please review your application updates for the relevant schedule and preparation details.</p>`,
      statusLabel: 'Interview Scheduled',
      includeFollowUp: true,
    },
    hired: {
      subject: `Congratulations - ${jobTitle}`,
      headline: 'Offer decision update',
      body: `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;">Congratulations. ${companyName} has selected you for the <strong>${jobTitle}</strong> role. This is an important achievement, and we are delighted to share this update with you.</p>`,
      statusLabel: 'Hired',
      includeFollowUp: true,
    },
    rejected: {
      subject: `Application update - ${jobTitle}`,
      headline: 'Application decision update',
      body: `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;">After careful consideration, ${companyName} has decided not to move forward with your application for <strong>${jobTitle}</strong>. We encourage you to continue applying for opportunities that align with your goals.</p>`,
      statusLabel: 'Not Selected',
      includeFollowUp: false,
    },
  };

  const cfg = STATUS_EMAIL[status];

  const content = `
    <tr>
      <td style="padding:40px 44px 16px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;">Dear ${studentName},</p>
        <h2 style="margin:0;color:#0F172A;font-size:30px;font-weight:800;letter-spacing:-0.02em;">
          ${cfg.headline}
        </h2>
      </td>
    </tr>
    <tr>
      <td style="padding:0 44px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D9E2EC;border-radius:14px;background:#F8FAFC;">
          <tr>
            <td style="padding:18px 20px;border-bottom:1px solid #E2E8F0;">
              <p style="margin:0 0 6px;color:#64748B;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Position</p>
              <p style="margin:0;color:#0F172A;font-size:15px;font-weight:600;">${jobTitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 20px;border-bottom:1px solid #E2E8F0;">
              <p style="margin:0 0 6px;color:#64748B;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Organization</p>
              <p style="margin:0;color:#0F172A;font-size:15px;font-weight:600;">${companyName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 6px;color:#64748B;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Current Status</p>
              <p style="margin:0;color:#0F172A;font-size:15px;font-weight:600;">${cfg.statusLabel}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 44px 40px;">
        ${cfg.body}
        ${
          cfg.includeFollowUp
            ? `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;">
          We will inform you later with any necessary information regarding the next steps.
        </p>`
            : ''
        }
        <p style="margin:0;color:#64748B;font-size:14px;line-height:1.8;">
          You may continue monitoring your progress through your Nextern account.
        </p>
      </td>
    </tr>
  `;

  return {
    subject: cfg.subject,
    html: emailWrapper(content),
  };
}

export function deadlineReminderEmailTemplate(params: {
  studentName: string;
  jobTitle: string;
  companyName: string;
  deadline: Date;
  daysLeft: number;
}): { subject: string; html: string } {
  const { studentName, jobTitle, companyName, deadline, daysLeft } = params;
  const dayLabel = `${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  const deadlineLabel = deadline.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const content = `
    <tr>
      <td style="padding:40px 44px 16px;">
        <p style="margin:0 0 10px;color:#475569;font-size:14px;">Dear ${studentName},</p>
        <h2 style="margin:0;color:#0F172A;font-size:30px;font-weight:800;letter-spacing:-0.02em;">
          Upcoming application deadline
        </h2>
      </td>
    </tr>
    <tr>
      <td style="padding:0 44px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #D9E2EC;border-radius:14px;background:#F8FAFC;">
          <tr>
            <td style="padding:18px 20px;border-bottom:1px solid #E2E8F0;">
              <p style="margin:0 0 6px;color:#64748B;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Position</p>
              <p style="margin:0;color:#0F172A;font-size:15px;font-weight:600;">${jobTitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 20px;border-bottom:1px solid #E2E8F0;">
              <p style="margin:0 0 6px;color:#64748B;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Organization</p>
              <p style="margin:0;color:#0F172A;font-size:15px;font-weight:600;">${companyName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 20px;border-bottom:1px solid #E2E8F0;">
              <p style="margin:0 0 6px;color:#64748B;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Deadline</p>
              <p style="margin:0;color:#0F172A;font-size:15px;font-weight:600;">${deadlineLabel}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 6px;color:#64748B;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Time Remaining</p>
              <p style="margin:0;color:#0F172A;font-size:15px;font-weight:600;">${dayLabel}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 44px 40px;">
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;">
          This is a reminder that the application deadline for <strong>${jobTitle}</strong> at ${companyName} is approaching.
        </p>
        <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.8;">
          Please review the opportunity details and complete your submission before the closing date if you intend to apply.
        </p>
        <p style="margin:0;color:#64748B;font-size:14px;line-height:1.8;">
          You can manage your saved opportunities from your Nextern account at ${getAppUrl()}/student/jobs.
        </p>
      </td>
    </tr>
  `;

  return {
    subject: `Deadline reminder - ${jobTitle} closes in ${dayLabel}`,
    html: emailWrapper(content),
  };
}

export function otpEmailTemplate(otp: string, name: string): string {
  const content = `
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 8px;color:#64748B;font-size:14px;">Hi ${name},</p>
        <h2 style="margin:0 0 16px;color:#0F172A;font-size:26px;font-weight:800;">
          Verify your email address
        </h2>
        <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.7;">
          Use the verification code below to complete your Nextern registration. This code expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#F8FAFC;border:2px dashed #2563EB;border-radius:14px;padding:28px;text-align:center;margin:0 0 24px;">
          <p style="margin:0 0 8px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">
            Verification Code
          </p>
          <p style="margin:0;color:#0F172A;font-size:40px;font-weight:800;letter-spacing:10px;">
            ${otp}
          </p>
        </div>
        <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;">
          Never share this code with anyone. Nextern will never ask for your OTP.
        </p>
        <p style="margin:0;color:#94A3B8;font-size:13px;">
          If you did not request this, you can safely ignore this email.
        </p>
      </td>
    </tr>
  `;

  return emailWrapper(content);
}

export function welcomeEmailTemplate(name: string, role: string): string {
  const roleMessages: Record<string, string> = {
    student:
      'Start building your academic profile and discover internships matched to your skills.',
    employer:
      'Your account is under review. We will notify you once approved so you can start posting jobs.',
    advisor: 'Your advisor account is under review. We will notify you once approved.',
    dept_head: 'Your department head account is under review. We will notify you once approved.',
  };

  const content = `
    <tr>
      <td style="padding:40px;">
        <p style="margin:0 0 8px;color:#475569;font-size:14px;">Dear ${name},</p>
        <h2 style="margin:0 0 16px;color:#0F172A;font-size:28px;font-weight:800;">
          Welcome to Nextern
        </h2>
        <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.7;">
          ${roleMessages[role] || 'Welcome to Nextern.'}
        </p>
        <p style="margin:0;color:#64748B;font-size:14px;line-height:1.8;">
          You may sign in to your account at
          <span style="color:#0F172A;font-weight:600;">${getAppUrl()}/login</span>
          whenever you are ready.
        </p>
      </td>
    </tr>
  `;

  return emailWrapper(content);
}
