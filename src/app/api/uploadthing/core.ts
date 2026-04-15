import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

export const ourFileRouter = {
  // Resume upload from the student profile page.
  // Saves to User.resumeUrl, which is the actual resume used for applications.
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

  // Generated resume upload from the Resume Builder page.
  // Saves to User.generatedResumeUrl and must stay separate from the actual resume.
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

  // ── GER Upload (save GER PDF separately from resume) ────────────────
  // Saves to: User.gerUrl — does not touch main resumeUrl or generatedResumeUrl
  gerUploader: f({ pdf: { maxFileSize: '8MB' } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError('Unauthorized');
      if (session.user.role !== 'student') throw new UploadThingError('Students only');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await connectDB();
      await User.findByIdAndUpdate(metadata.userId, {
        gerUrl: file.ufsUrl,
      });
      return { gerUrl: file.ufsUrl };
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

  // Company logo upload for employer accounts.
  // Saves to User.companyLogo.
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

  // Message attachment upload
  messageAttachmentUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 4 },
    pdf: { maxFileSize: '8MB', maxFileCount: 4 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError('Unauthorized');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      // Just return the URL, the message POST will save it
      return { ufsUrl: file.ufsUrl, name: file.name, type: file.type };
    }),

  freelanceSampleUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 6 },
    pdf: { maxFileSize: '8MB', maxFileCount: 6 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError('Unauthorized');
      if (session.user.role !== 'student') throw new UploadThingError('Students only');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { ufsUrl: file.ufsUrl, name: file.name, type: file.type };
    }),

  freelanceRequirementUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 6 },
    pdf: { maxFileSize: '8MB', maxFileCount: 6 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError('Unauthorized');
      if (!['student', 'employer'].includes(session.user.role)) {
        throw new UploadThingError('Students and employers only');
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { ufsUrl: file.ufsUrl, name: file.name, type: file.type };
    }),

  freelanceDeliveryUploader: f({
    image: { maxFileSize: '8MB', maxFileCount: 8 },
    pdf: { maxFileSize: '16MB', maxFileCount: 8 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new UploadThingError('Unauthorized');
      if (session.user.role !== 'student') throw new UploadThingError('Students only');
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { ufsUrl: file.ufsUrl, name: file.name, type: file.type };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
