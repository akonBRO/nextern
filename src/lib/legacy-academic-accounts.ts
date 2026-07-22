import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { deleteUserAndRelatedRecords } from '@/lib/user-deletion';

export type LegacyAcademicAccount = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  role?: string;
  institutionName?: string;
  advisoryDepartment?: string;
  createdAt: Date;
};

export function buildLegacyAcademicAccountQuery(beforeDate?: Date | null) {
  const query: {
    role: { $in: string[] };
    createdAt?: { $lt: Date };
  } = {
    role: { $in: ['advisor', 'dept_head'] },
  };

  if (beforeDate) {
    query.createdAt = { $lt: beforeDate };
  }

  return query;
}

export async function findLegacyAcademicAccounts(beforeDate?: Date | null) {
  await connectDB();

  return User.find(buildLegacyAcademicAccountQuery(beforeDate))
    .select('name email role institutionName advisoryDepartment createdAt')
    .sort({ createdAt: 1 })
    .lean<LegacyAcademicAccount[]>();
}

export async function removeLegacyAcademicAccounts({
  beforeDate,
  dryRun = false,
}: {
  beforeDate?: Date | null;
  dryRun?: boolean;
}) {
  if (!dryRun && !beforeDate) {
    throw new Error(
      'Refusing to delete academic accounts without an explicit cutoff. Provide before as an ISO date.'
    );
  }

  const users = await findLegacyAcademicAccounts(beforeDate);

  if (!dryRun) {
    for (const user of users) {
      await deleteUserAndRelatedRecords(user._id.toString());
    }
  }

  return users;
}
