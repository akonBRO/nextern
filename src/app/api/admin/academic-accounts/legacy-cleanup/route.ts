import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin';
import {
  findLegacyAcademicAccounts,
  removeLegacyAcademicAccounts,
  type LegacyAcademicAccount,
} from '@/lib/legacy-academic-accounts';

function parseBeforeDate(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('before must be an ISO date string.');
  }

  const parsedDate = new Date(value.trim());
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(
      `Invalid before value "${value}". Use an ISO date like 2026-04-17 or 2026-04-17T00:00:00Z.`
    );
  }

  return parsedDate;
}

function serializeLegacyAcademicAccount(user: LegacyAcademicAccount) {
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    institutionName: user.institutionName,
    advisoryDepartment: user.advisoryDepartment,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const beforeDate = parseBeforeDate(searchParams.get('before'));
    const accounts = await findLegacyAcademicAccounts(beforeDate);

    return NextResponse.json({
      dryRun: true,
      before: beforeDate?.toISOString() ?? null,
      count: accounts.length,
      accounts: accounts.map(serializeLegacyAcademicAccount),
    });
  } catch (error) {
    console.error('[LEGACY ACADEMIC CLEANUP PREVIEW ERROR]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to preview legacy academic account cleanup.',
      },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as { before?: unknown };
    const beforeDate = parseBeforeDate(body.before);
    const removedAccounts = await removeLegacyAcademicAccounts({ beforeDate });

    return NextResponse.json({
      message: `Removed ${removedAccounts.length} legacy academic account(s).`,
      before: beforeDate?.toISOString() ?? null,
      count: removedAccounts.length,
      removedAccounts: removedAccounts.map(serializeLegacyAcademicAccount),
    });
  } catch (error) {
    console.error('[LEGACY ACADEMIC CLEANUP DELETE ERROR]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to remove legacy academic accounts.',
      },
      { status: 400 }
    );
  }
}
