// // Event hook interface — Jauad's badge system calls these.
// // Each hook body is filled by the respective feature owner.
// // DO NOT change the function signatures.

// export async function onJobApplied(_userId: string, _jobId: string) {
//   // Samia fills this in module1-jobs branch
// }

// export async function onSkillGapClosed(_userId: string, _skillName: string) {
//   // Sabbir fills this in module2-ai-engine branch
// }

// export async function onApplicationStatusChanged(_userId: string, _status: string) {
//   // Samia fills this in module1-jobs branch
// }

// export async function onMentorSessionComplete(_studentId: string, _mentorId: string) {
//   // Jauad fills this in module3-mentorship branch
// }

// export async function onReviewSubmitted(_userId: string, _targetId: string) {
//   // Jauad fills this in module3-reviews branch
// }

// export async function onFreelanceCompleted(_studentId: string, _orderId: string) {
//   // Sabbir fills this in module3-freelance branch
// }

// Event hook interface — Jauad's badge system calls these.
// Each hook body is filled by the respective feature owner.
// DO NOT change the function signatures.

import { evaluateBadges } from '@/lib/badge-engine';

export async function onJobApplied(userId: string, _jobId: string) {
  // Evaluates Top Applicant (student) and Active Hirer (employer)
  await evaluateBadges(userId, 'onJobApplied').catch(console.error);
}

export async function onSkillGapClosed(userId: string, _skillName: string) {
  // Evaluates Skill Champion
  await evaluateBadges(userId, 'onSkillGapClosed', 'student').catch(console.error);
}

export async function onProfileVerified(userId: string) {
  // Evaluates Verified Scholar
  await evaluateBadges(userId, 'onProfileVerified', 'student').catch(console.error);
}

export async function onApplicationStatusChanged(userId: string, _status: string) {
  // Evaluates Verified Scholar (student) and Fast Responder (employer)
  await evaluateBadges(userId, 'onApplicationStatusChanged').catch(console.error);
}

export async function onMentorSessionComplete(studentId: string, mentorId: string) {
  // Evaluates Mentor's Pick
  await evaluateBadges(studentId, 'onMentorSessionComplete', 'student').catch(console.error);
  // Evaluates Guiding Light
  await evaluateBadges(mentorId, 'onMentorSessionComplete', 'advisor').catch(console.error);
}

export async function onReviewSubmitted(userId: string, targetId: string) {
  // Evaluates Community Leader (for reviewer)
  await evaluateBadges(userId, 'onReviewSubmitted', 'student').catch(console.error);
  // Evaluates Trusted Recruiter and Campus Favorite (for reviewee)
  await evaluateBadges(targetId, 'onReviewReceived', 'employer').catch(console.error);
}

export async function onFreelanceCompleted(studentId: string, _orderId: string) {
  // Evaluates any freelance badges (if added later)
  await evaluateBadges(studentId, 'onFreelanceCompleted', 'student').catch(console.error);
}

export async function onOpportunityScoreGain(userId: string, _newScore: number) {
  // Evaluates Rising Star
  await evaluateBadges(userId, 'onOpportunityScoreGain', 'student').catch(console.error);
}

export async function onDepartmentScoreUpdate(deptHeadId: string, _newAverageScore: number) {
  // Evaluates Visionary Leader
  await evaluateBadges(deptHeadId, 'onDepartmentScoreUpdate', 'dept_head').catch(console.error);
}

export async function onEventCreated(deptHeadId: string) {
  // Evaluates Engagement Pro
  await evaluateBadges(deptHeadId, 'onEventCreated', 'dept_head').catch(console.error);
}
