import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { provisionAcademicAccount } from '@/lib/academic-accounts';
import { connectDB } from '@/lib/db';
import { CreateAdvisorSchema } from '@/lib/validations';
import { User } from '@/models/User';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'dept_head') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const deptHead = await User.findById(session.user.id)
      .select('institutionName verificationStatus')
      .lean();

    if (!deptHead?.institutionName) {
      return NextResponse.json(
        { error: 'Your department head account is missing a university scope.' },
        { status: 400 }
      );
    }

    if (deptHead.verificationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Your account must be approved before managing advisors.' },
        { status: 403 }
      );
    }

    const advisors = await User.find({
      role: 'advisor',
      institutionName: deptHead.institutionName,
    })
      .select(
        'name email institutionName advisoryDepartment designation advisorStaffId createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      institutionName: deptHead.institutionName,
      advisors,
    });
  } catch (error) {
    console.error('[DEPT ADVISORS GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to load advisors.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'dept_head') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const deptHead = await User.findById(session.user.id)
      .select('name institutionName verificationStatus')
      .lean();

    if (!deptHead?.institutionName) {
      return NextResponse.json(
        { error: 'Your department head account is missing a university scope.' },
        { status: 400 }
      );
    }

    if (deptHead.verificationStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Your account must be approved before creating advisors.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = CreateAdvisorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await provisionAcademicAccount({
      role: 'advisor',
      ...parsed.data,
      institutionName: deptHead.institutionName,
      creatorName: deptHead.name ?? session.user.name ?? 'Department Head',
    });

    return NextResponse.json(
      {
        message: 'Advisor account created successfully.',
        advisor: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          institutionName: user.institutionName,
          advisoryDepartment: user.advisoryDepartment,
          designation: user.designation,
          advisorStaffId: user.advisorStaffId,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[DEPT ADVISORS POST ERROR]', error);
    const message = error instanceof Error ? error.message : 'Failed to create advisor.';
    const status = message.includes('already exists') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
