// src/lib/events.ts
// Shared event hook interface — called from all feature modules.
// Triggers badge evaluation AND real-time notifications.
// DO NOT change the function signatures.

import { evaluateBadges } from '@/lib/badge-engine';
import { notifyApplicationStatusChanged, notifyJobApplied, notifyBadgeEarned } from '@/lib/notify';
import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { Job } from '@/models/Job';
import mongoose from 'mongoose';

// ── onJobApplied ──────────────────────────────────────────────────────────
export async function onJobApplied(userId: string, jobId: string) {
  // 1. Badge evaluation
  await evaluateBadges(userId, 'onJobApplied').catch(console.error);

  // 2. Notify student that their application was submitted
  try {
    await connectDB();
    const job = await Job.findById(jobId).select('title companyName').lean();
    if (job) {
      const app = await Application.findOne({
        studentId: new mongoose.Types.ObjectId(userId),
        jobId: new mongoose.Types.ObjectId(jobId),
      })
        .select('_id')
        .lean();

      await notifyJobApplied(userId, job.title, job.companyName, app?._id?.toString() ?? jobId);
    }
  } catch (err) {
    console.error('[onJobApplied notify error]', err);
  }
}

// ── onSkillGapClosed ──────────────────────────────────────────────────────
export async function onSkillGapClosed(userId: string, _skillName: string) {
  await evaluateBadges(userId, 'onSkillGapClosed', 'student').catch(console.error);
  // Notification for skill gap closed handled in the skill gap engine directly
}

// ── onProfileVerified ─────────────────────────────────────────────────────
export async function onProfileVerified(userId: string) {
  await evaluateBadges(userId, 'onProfileVerified', 'student').catch(console.error);
}

// ── onApplicationStatusChanged ────────────────────────────────────────────
export async function onApplicationStatusChanged(userId: string, status: string) {
  // 1. Badge evaluation
  await evaluateBadges(userId, 'onApplicationStatusChanged').catch(console.error);

  // 2. Notify student of status change
  // Note: the caller (applications PATCH route) should pass applicationId, jobTitle, companyName.
  // We re-fetch here to keep the function signature unchanged.
  try {
    await connectDB();

    // Find the most recently updated application for this student
    const app = await Application.findOne({ studentId: userId, status })
      .sort({ updatedAt: -1 })
      .populate('jobId', 'title companyName')
      .lean();

    if (app?.jobId) {
      const job = app.jobId as { title: string; companyName: string };
      await notifyApplicationStatusChanged(
        userId,
        job.title,
        job.companyName,
        status,
        app._id.toString()
      );
    }
  } catch (err) {
    console.error('[onApplicationStatusChanged notify error]', err);
  }
}

// ── onMentorSessionComplete ───────────────────────────────────────────────
export async function onMentorSessionComplete(studentId: string, mentorId: string) {
  await evaluateBadges(studentId, 'onMentorSessionComplete', 'student').catch(console.error);
  await evaluateBadges(mentorId, 'onMentorSessionComplete', 'advisor').catch(console.error);
}

// ── onReviewSubmitted ─────────────────────────────────────────────────────
export async function onReviewSubmitted(userId: string, targetId: string) {
  await evaluateBadges(userId, 'onReviewSubmitted', 'student').catch(console.error);
  await evaluateBadges(targetId, 'onReviewReceived', 'employer').catch(console.error);
}

// ── onFreelanceCompleted ──────────────────────────────────────────────────
export async function onFreelanceCompleted(studentId: string, _orderId: string) {
  await evaluateBadges(studentId, 'onFreelanceCompleted', 'student').catch(console.error);
}

// ── onOpportunityScoreGain ────────────────────────────────────────────────
export async function onOpportunityScoreGain(userId: string, _newScore: number) {
  await evaluateBadges(userId, 'onOpportunityScoreGain', 'student').catch(console.error);
}

// ── onDepartmentScoreUpdate ───────────────────────────────────────────────
export async function onDepartmentScoreUpdate(deptHeadId: string, _newAverageScore: number) {
  await evaluateBadges(deptHeadId, 'onDepartmentScoreUpdate', 'dept_head').catch(console.error);
}

// ── onEventCreated ────────────────────────────────────────────────────────
export async function onEventCreated(deptHeadId: string) {
  await evaluateBadges(deptHeadId, 'onEventCreated', 'dept_head').catch(console.error);
}

// ── onBadgeEarned ─────────────────────────────────────────────────────────
// Called from badge-engine.ts after awarding a badge — notify the user
export async function onBadgeEarned(
  userId: string,
  badgeName: string,
  badgeIcon: string,
  badgeSlug: string
) {
  await notifyBadgeEarned(userId, badgeName, badgeIcon, badgeSlug).catch(console.error);
}
