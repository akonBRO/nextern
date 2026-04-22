import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { academicCredentialEmailTemplate, sendEmail } from '@/lib/email';
import { onProfileVerified } from '@/lib/events';
import { User } from '@/models/User';

const BCRYPT_ROUNDS = 12;

export type AcademicAccountRole = 'advisor' | 'dept_head';

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function academicRoleLabel(role: AcademicAccountRole) {
  return role === 'dept_head' ? 'Department Head' : 'Advisor';
}

export async function provisionAcademicAccount({
  role,
  name,
  email,
  temporaryPassword,
  institutionName,
  advisoryDepartment,
  advisorStaffId,
  designation,
  creatorName,
}: {
  role: AcademicAccountRole;
  name: string;
  email: string;
  temporaryPassword: string;
  institutionName: string;
  advisoryDepartment: string;
  advisorStaffId?: string;
  designation?: string;
  creatorName: string;
}) {
  await connectDB();

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail }).select('_id role isVerified');

  if (existingUser) {
    throw new Error('An account with this email already exists.');
  }

  const hashedPassword = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role,
    isVerified: true,
    verificationStatus: 'approved',
    verificationNote: '',
    approvalStatus: 'approved',
    mustChangePassword: true,
    institutionName,
    advisoryDepartment,
    advisorStaffId: normalizeOptionalText(advisorStaffId),
    designation: normalizeOptionalText(designation),
  });

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: `Your Nextern ${academicRoleLabel(role)} account is ready`,
      html: academicCredentialEmailTemplate({
        recipientName: name.trim(),
        recipientRole: role,
        creatorName,
        email: normalizedEmail,
        temporaryPassword,
        institutionName,
        advisoryDepartment,
      }),
    });
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }

  // Award verification badge since they are internally provisioned
  await onProfileVerified(user._id.toString()).catch(console.error);

  return user;
}
