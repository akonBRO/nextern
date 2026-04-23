import { RtcRole, RtcTokenBuilder } from 'agora-token';
import { connectDB } from '@/lib/db';
import { MentorSession } from '@/models/MentorSession';
import { Mentor } from '@/models/Mentor';

export class MentorshipAccessError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = 'MentorshipAccessError';
    this.status = status;
  }
}

export function derivedAgoraUid(seed: string) {
  const hex = seed.replace(/[^a-fA-F0-9]/g, '').slice(-8);
  const parsed = parseInt(hex || '1001', 16);
  return Math.max(1, parsed % 2147483000);
}

export function ensureAgoraConfig() {
  const appId = process.env.AGORA_APP_ID?.trim() ?? process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim();
  if (!appId) {
    throw new Error('AGORA_APP_ID is not configured.');
  }

  return {
    appId,
    appCertificate: process.env.AGORA_APP_CERTIFICATE?.trim() ?? '',
  };
}

export async function issueMentorshipJoinToken(input: {
  sessionId: string;
  userId: string;
  role: 'student' | 'mentor';
}) {
  await connectDB();

  const session = await MentorSession.findById(input.sessionId).lean();
  if (!session) {
    throw new Error('Mentorship session not found.');
  }

  if (input.role === 'student' && session.studentId.toString() !== input.userId) {
    throw new MentorshipAccessError('You do not have access to this session.');
  }

  if (input.role === 'mentor') {
    const mentor = await Mentor.findById(session.mentorId).lean();
    if (!mentor || mentor.userId.toString() !== input.userId) {
      throw new MentorshipAccessError('You do not have access to this session as a mentor.');
    }
  }

  if (session.status === 'completed') {
    throw new MentorshipAccessError('This session has already been completed.');
  }

  if (session.status === 'cancelled') {
    throw new MentorshipAccessError('This session has been cancelled.');
  }

  if (!session.agoraChannelId) {
    throw new Error('This session does not have an active video channel.');
  }

  const { appId, appCertificate } = ensureAgoraConfig();
  const uid = derivedAgoraUid(`${input.userId}:${session._id.toString()}:${input.role}`);
  const expireSeconds = Number(process.env.AGORA_TOKEN_EXPIRE_SECONDS ?? 3600);
  const privilegeExpire = Math.floor(Date.now() / 1000) + expireSeconds;

  const token = appCertificate
    ? RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        session.agoraChannelId,
        uid,
        RtcRole.PUBLISHER, // Both can publish video/audio
        privilegeExpire,
        privilegeExpire
      )
    : null;

  return {
    appId,
    channelName: session.agoraChannelId,
    token,
    uid,
  };
}
