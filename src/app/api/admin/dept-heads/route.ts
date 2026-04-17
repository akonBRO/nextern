import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/admin';
import { connectDB } from '@/lib/db';
import { provisionAcademicAccount } from '@/lib/academic-accounts';
import { CreateDeptHeadSchema } from '@/lib/validations';
import { User } from '@/models/User';

export async function GET() {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const deptHeads = await User.find({ role: 'dept_head' })
      .select(
        'name email institutionName advisoryDepartment designation advisorStaffId createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ deptHeads });
  } catch (error) {
    console.error('[ADMIN DEPT HEADS GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to load department heads.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateDeptHeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const user = await provisionAcademicAccount({
      role: 'dept_head',
      ...parsed.data,
      creatorName: session.user.name ?? 'Superadmin',
    });

    return NextResponse.json(
      {
        message: 'Department head account created successfully.',
        deptHead: {
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
    console.error('[ADMIN DEPT HEADS POST ERROR]', error);
    const message = error instanceof Error ? error.message : 'Failed to create department head.';
    const status = message.includes('already exists') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
