import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { deleteUserAndRelatedRecords } from '@/lib/user-deletion';

function parseBeforeDate(): Date | null {
  const beforeArg = process.argv.find((arg) => arg.startsWith('--before='));
  if (!beforeArg) {
    return null;
  }

  const rawValue = beforeArg.slice('--before='.length).trim();
  const parsedDate = new Date(rawValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(
      `Invalid --before value "${rawValue}". Use an ISO date like 2026-04-17 or 2026-04-17T00:00:00Z.`
    );
  }

  return parsedDate;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const beforeDate = parseBeforeDate();

  if (!dryRun && !beforeDate) {
    throw new Error(
      'Refusing to delete academic accounts without an explicit cutoff. Re-run with --before=<ISO date>.'
    );
  }

  await connectDB();
  const query: {
    role: { $in: string[] };
    createdAt?: { $lt: Date };
  } = {
    role: { $in: ['advisor', 'dept_head'] },
  };

  if (beforeDate) {
    query.createdAt = { $lt: beforeDate };
  }

  const legacyAcademicUsers = await User.find(query)
    .select('name email role institutionName advisoryDepartment createdAt')
    .sort({ createdAt: 1 })
    .lean();

  if (legacyAcademicUsers.length === 0) {
    console.log('No legacy advisor or department head accounts were found.');
    return;
  }

  console.log(
    `${dryRun ? '[dry-run] ' : ''}Found ${legacyAcademicUsers.length} legacy academic account(s)${beforeDate ? ` created before ${beforeDate.toISOString()}` : ''}.`
  );

  for (const user of legacyAcademicUsers) {
    const summary = `${user.role} | ${user.name} | ${user.email} | ${user.institutionName ?? 'No university'} | ${new Date(user.createdAt).toISOString()}`;

    if (dryRun) {
      console.log(`Would remove: ${summary}`);
      continue;
    }

    await deleteUserAndRelatedRecords(user._id.toString());
    console.log(`Removed: ${summary}`);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('[REMOVE LEGACY ACADEMIC ACCOUNTS ERROR]', error);
    process.exit(1);
  });
