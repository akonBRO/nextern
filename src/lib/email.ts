// src/lib/email.ts
// Uses Gmail SMTP via nodemailer — works for any email address immediately.
// Setup: npm install nodemailer && npm install -D @types/nodemailer
// Add GMAIL_USER and GMAIL_APP_PASSWORD to .env.local
//
// How to get GMAIL_APP_PASSWORD:
// 1. Enable 2-Step Verification on your Gmail account
// 2. Go to myaccount.google.com/apppasswords
// 3. Type "Nextern" → click Create → copy the 16-character password
// 4. Paste into .env.local as GMAIL_APP_PASSWORD=abcdefghijklmnop (no spaces)

import nodemailer from 'nodemailer';
import { getLoginUrl } from '@/lib/app-url';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  devOtp?: string;
}

async function sendViaResend({ to, subject, html }: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set in environment variables');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `Nextern <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

async function sendViaGmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD is not set in environment variables');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: `Nextern <${gmailUser}>`,
    to,
    subject,
    html,
  });
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const errors: string[] = [];

  try {
    await sendViaResend({ to, subject, html });
    return;
  } catch (error) {
    errors.push(`Resend: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    await sendViaGmail({ to, subject, html });
    return;
  } catch (error) {
    errors.push(`Gmail: ${error instanceof Error ? error.message : String(error)}`);
  }

  throw new Error(errors.join(' | '));
}

// ── Email templates ────────────────────────────────────────────────────────

export function otpEmailTemplate(otp: string, name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              <!-- Header -->
              <tr>
                <td style="background:#1E293B;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                    Nextern
                    <span style="color:#22D3EE;">.</span>
                  </h1>
                  <p style="margin:8px 0 0;color:#94A3B8;font-size:13px;">Career Readiness Platform</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 8px;color:#64748B;font-size:14px;">Hi ${name},</p>
                  <h2 style="margin:0 0 16px;color:#1E293B;font-size:22px;font-weight:700;">Verify your email address</h2>
                  <p style="margin:0 0 32px;color:#64748B;font-size:15px;line-height:1.6;">
                    Use the verification code below to complete your Nextern registration. 
                    This code expires in <strong>10 minutes</strong>.
                  </p>
                  <!-- OTP Box -->
                  <div style="background:#F1F5F9;border:2px dashed #2563EB;border-radius:12px;padding:28px;text-align:center;margin:0 0 32px;">
                    <p style="margin:0 0 8px;color:#64748B;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Verification Code</p>
                    <p style="margin:0;color:#1E293B;font-size:42px;font-weight:800;letter-spacing:12px;">${otp}</p>
                  </div>
                  <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;">
                    ⚠️ Never share this code with anyone. Nextern will never ask for your OTP.
                  </p>
                  <p style="margin:0;color:#94A3B8;font-size:13px;">
                    If you didn't request this, please ignore this email.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#F8FAFC;padding:24px 40px;border-top:1px solid #E2E8F0;text-align:center;">
                  <p style="margin:0;color:#94A3B8;font-size:12px;">
                    © 2026 Nextern. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function welcomeEmailTemplate(name: string, role: string): string {
  const loginUrl = getLoginUrl();
  const roleMessages: Record<string, string> = {
    student:
      'Start building your academic profile and discover internships matched to your skills.',
    employer:
      'Your account is under review. We will notify you once approved to start posting jobs.',
    advisor: 'Your advisor account is ready. Log in to begin supporting your students.',
    dept_head: 'Your department head account is ready. Log in to manage your academic workspace.',
  };

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(135deg,#1E293B 0%,#2563EB 100%);padding:40px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:28px;">Welcome to Nextern!</h1>
                  <p style="margin:12px 0 0;color:#93C5FD;font-size:15px;">Hi ${name}, your account is ready.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:40px;">
                  <p style="color:#64748B;font-size:15px;line-height:1.7;">${roleMessages[role] || 'Welcome to Nextern.'}</p>
                  <a href="${loginUrl}" style="display:inline-block;background:#2563EB;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin-top:16px;">
                    Go to Dashboard →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function academicCredentialEmailTemplate({
  recipientName,
  recipientRole,
  creatorName,
  email,
  temporaryPassword,
  institutionName,
  advisoryDepartment,
}: {
  recipientName: string;
  recipientRole: 'advisor' | 'dept_head';
  creatorName: string;
  email: string;
  temporaryPassword: string;
  institutionName: string;
  advisoryDepartment: string;
}): string {
  const roleLabel = recipientRole === 'dept_head' ? 'Department Head' : 'Advisor';
  const loginUrl = getLoginUrl();

  return `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#F1F5F9;font-family:'Segoe UI',sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08);">
              <tr>
                <td style="background:linear-gradient(135deg,#1E293B 0%,#2563EB 100%);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">Nextern</h1>
                  <p style="margin:10px 0 0;color:#BFDBFE;font-size:14px;">Academic account credentials</p>
                </td>
              </tr>
              <tr>
                <td style="padding:36px 40px;">
                  <p style="margin:0 0 12px;color:#1E293B;font-size:16px;">Hi ${recipientName},</p>
                  <p style="margin:0 0 18px;color:#64748B;font-size:15px;line-height:1.7;">
                    ${creatorName} created your <strong>${roleLabel}</strong> account on Nextern.
                    Use the temporary sign-in details below for your first login.
                  </p>

                  <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:20px 22px;margin:0 0 18px;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#94A3B8;margin-bottom:10px;">Account scope</div>
                    <div style="font-size:14px;color:#1E293B;line-height:1.8;">
                      <div><strong>University:</strong> ${institutionName}</div>
                      <div><strong>Department:</strong> ${advisoryDepartment}</div>
                      <div><strong>Role:</strong> ${roleLabel}</div>
                    </div>
                  </div>

                  <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:14px;padding:20px 22px;margin:0 0 20px;">
                    <div style="font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:#2563EB;margin-bottom:10px;">First login credentials</div>
                    <div style="font-size:14px;color:#1E293B;line-height:1.8;">
                      <div><strong>Email:</strong> ${email}</div>
                      <div><strong>One-time password:</strong> ${temporaryPassword}</div>
                    </div>
                  </div>

                  <p style="margin:0 0 20px;color:#64748B;font-size:14px;line-height:1.7;">
                    For security, you will be required to set your own password immediately after your first successful login.
                  </p>

                  <a href="${loginUrl}" style="display:inline-block;background:#2563EB;color:#ffffff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
                    Go to Login
                  </a>
                </td>
              </tr>
              <tr>
                <td style="background:#F8FAFC;padding:20px 40px;border-top:1px solid #E2E8F0;">
                  <p style="margin:0;color:#94A3B8;font-size:12px;line-height:1.6;">
                    If you were not expecting this account, please contact your administrator before logging in.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
