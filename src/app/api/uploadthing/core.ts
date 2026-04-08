import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { UploadThingError } from 'uploadthing/server';

const f = createUploadthing();

export const ourFileRouter = {
  // 📄 Resume Upload
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

  // 🖼️ Profile Picture Upload
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

  // 🏢 Company Logo Upload
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
