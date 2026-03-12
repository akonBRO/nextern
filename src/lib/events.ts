// Event hook interface — Jauad's badge system calls these.
// Each hook body is filled by the respective feature owner.
// DO NOT change the function signatures.

export async function onJobApplied(_userId: string, _jobId: string) {
  // Samia fills this in module1-jobs branch
}

export async function onSkillGapClosed(_userId: string, _skillName: string) {
  // Sabbir fills this in module2-ai-engine branch
}

export async function onApplicationStatusChanged(_userId: string, _status: string) {
  // Samia fills this in module1-jobs branch
}

export async function onMentorSessionComplete(_studentId: string, _mentorId: string) {
  // Jauad fills this in module3-mentorship branch
}

export async function onReviewSubmitted(_userId: string, _targetId: string) {
  // Jauad fills this in module3-reviews branch
}

export async function onFreelanceCompleted(_studentId: string, _orderId: string) {
  // Sabbir fills this in module3-freelance branch
}
