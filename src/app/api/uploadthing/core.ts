import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

export const ourFileRouter = {
  // ── Resume Upload (manual PDF upload by student from profile page) ─────
  // Saves to: User.resumeUrl — the "actual resume" attached to job applications
  resumeUploader: f({ pdf: { maxFileSize: '8MB' } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new Error('Unauthorized');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await connectDB();
      await User.findByIdAndUpdate(metadata.userId, {
        resumeUrl: file.ufsUrl,
      });
      return { resumeUrl: file.ufsUrl };
    }),

  // ── Generated Resume Upload (auto-generated PDF from Resume Builder) ───
  // Saves to: User.generatedResumeUrl — completely separate from actual resume
  generatedResumeUploader: f({ pdf: { maxFileSize: '8MB' } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError('Unauthorized');
      if (session.user.role !== 'student') throw new UploadThingError('Students only');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await connectDB();
      await User.findByIdAndUpdate(metadata.userId, {
        generatedResumeUrl: file.ufsUrl,
      });
      return { generatedResumeUrl: file.ufsUrl };
    }),

  // ── Profile Picture Upload (students, advisors, dept heads) ───────────
  // Saves to: User.image
  profilePictureUploader: f({
    image: { maxFileSize: '2MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError('Unauthorized');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await connectDB();
      await User.findByIdAndUpdate(metadata.userId, {
        image: file.ufsUrl,
      });
      return { imageUrl: file.ufsUrl };
    }),

  // ── Company Logo Upload (employers only) ──────────────────────────────
  // Saves to: User.companyLogo
  companyLogoUploader: f({
    image: { maxFileSize: '2MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError('Unauthorized');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await connectDB();
      await User.findByIdAndUpdate(metadata.userId, {
        companyLogo: file.ufsUrl,
      });
      return { companyLogoUrl: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
