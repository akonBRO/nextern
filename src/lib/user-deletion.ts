import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Payment } from '@/models/Payment';
import { Subscription } from '@/models/Subscription';
import { Notification } from '@/models/Notification';
import { FeatureUsage } from '@/models/FeatureUsage';
import { BadgeAward } from '@/models/BadgeAward';
import { OpportunityScoreHistory } from '@/models/OpportunityScoreHistory';
import { GER } from '@/models/GER';
import { JobView } from '@/models/JobView';
import { Message } from '@/models/Message';
import { Review } from '@/models/Review';
import { AdvisorAction } from '@/models/AdvisorAction';
import { MockInterviewSession } from '@/models/MockInterviewSession';
import { Mentor } from '@/models/Mentor';
import { MentorSession } from '@/models/MentorSession';
import { FreelanceListing } from '@/models/FreelanceListing';
import { FreelanceOrder } from '@/models/FreelanceOrder';
import { Assessment } from '@/models/Assessment';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { AssessmentSubmission } from '@/models/AssessmentSubmission';
import { InterviewSession } from '@/models/InterviewSession';

export async function deleteUserAndRelatedRecords(userId: string) {
  await connectDB();

  const user = await User.findById(userId).select('role name');
  if (!user) {
    return null;
  }

  const mentorDocs = await Mentor.find({ userId }).select('_id').lean();
  const mentorIds = mentorDocs.map((item) => item._id);

  const ownedJobs = await Job.find({ employerId: userId }).select('_id').lean();
  const ownedJobIds = ownedJobs.map((item) => item._id);

  const relatedApplications = await Application.find({
    $or: [{ studentId: userId }, { employerId: userId }, { jobId: { $in: ownedJobIds } }],
  })
    .select('_id')
    .lean();
  const applicationIds = relatedApplications.map((item) => item._id);

  const ownedAssessments = await Assessment.find({
    $or: [{ employerId: userId }, { jobId: { $in: ownedJobIds } }],
  })
    .select('_id')
    .lean();
  const assessmentIds = ownedAssessments.map((item) => item._id);

  const ownedListings = await FreelanceListing.find({ studentId: userId }).select('_id').lean();
  const listingIds = ownedListings.map((item) => item._id);

  await Promise.all([
    User.updateMany({ assignedAdvisorId: userId }, { $unset: { assignedAdvisorId: 1 } }),
    Notification.deleteMany({ userId }),
    Payment.deleteMany({ userId }),
    Subscription.deleteMany({ userId }),
    FeatureUsage.deleteMany({ userId }),
    BadgeAward.deleteMany({ userId }),
    OpportunityScoreHistory.deleteMany({ userId }),
    GER.deleteMany({ studentId: userId }),
    JobView.deleteMany({
      $or: [{ studentId: userId }, { jobId: { $in: ownedJobIds } }],
    }),
    Message.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }, { relatedJobId: { $in: ownedJobIds } }],
    }),
    Review.deleteMany({
      $or: [
        { reviewerId: userId },
        { revieweeId: userId },
        { applicationId: { $in: applicationIds } },
      ],
    }),
    AdvisorAction.deleteMany({
      $or: [{ advisorId: userId }, { studentId: userId }],
    }),
    MockInterviewSession.deleteMany({ studentId: userId }),
    MentorSession.deleteMany({
      $or: [{ studentId: userId }, { mentorId: { $in: mentorIds } }],
    }),
    Mentor.deleteMany({ userId }),
    FreelanceOrder.deleteMany({
      $or: [{ listingId: { $in: listingIds } }, { freelancerId: userId }, { clientId: userId }],
    }),
    FreelanceListing.deleteMany({ studentId: userId }),
    AssessmentSubmission.deleteMany({
      $or: [
        { studentId: userId },
        { applicationId: { $in: applicationIds } },
        { assessmentId: { $in: assessmentIds } },
      ],
    }),
    AssessmentAssignment.deleteMany({
      $or: [
        { studentId: userId },
        { employerId: userId },
        { applicationId: { $in: applicationIds } },
        { assessmentId: { $in: assessmentIds } },
      ],
    }),
    InterviewSession.deleteMany({
      $or: [
        { studentId: userId },
        { employerId: userId },
        { applicationId: { $in: applicationIds } },
        { jobId: { $in: ownedJobIds } },
      ],
    }),
    Assessment.deleteMany({
      $or: [{ employerId: userId }, { jobId: { $in: ownedJobIds } }],
    }),
    Application.deleteMany({
      $or: [{ studentId: userId }, { employerId: userId }, { jobId: { $in: ownedJobIds } }],
    }),
    Job.deleteMany({ employerId: userId }),
    User.deleteOne({ _id: userId }),
  ]);

  return {
    userId,
    name: user.name,
    role: user.role,
  };
}
