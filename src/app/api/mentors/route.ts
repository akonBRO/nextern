import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Mentor } from '@/models/Mentor';
import { User } from '@/models/User';
import { BadgeAward } from '@/models/BadgeAward';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const industry = searchParams.get('industry');
    const expertise = searchParams.get('expertise'); // comma-separated
    const mentorType = searchParams.get('mentorType');

    await connectDB();

    const query: Record<string, unknown> = { isAvailable: true };
    if (industry) query.industry = industry;
    if (mentorType) query.mentorType = mentorType;
    if (expertise) {
      const expertiseList = expertise
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
      if (expertiseList.length > 0) {
        query.expertise = { $in: expertiseList };
      }
    }

    const mentors = await Mentor.find(query)
      .populate('userId', 'name image email') // include basic user details
      .sort({ averageRating: -1, totalSessions: -1 })
      .lean();

    const userIds = mentors.map((m) => m.userId._id);
    const badgeAwards = await BadgeAward.find({
      userId: { $in: userIds },
      isDisplayed: true,
    }).lean();

    const mentorsWithBadges = mentors.map((m) => {
      const userBadges = badgeAwards.filter((ba) => String(ba.userId) === String(m.userId._id));
      return {
        ...m,
        badges: userBadges.map((ba) => ({
          badgeName: ba.badgeName,
          badgeIcon: ba.badgeIcon,
        })),
      };
    });

    return NextResponse.json(mentorsWithBadges);
  } catch (error) {
    console.error('[GET MENTORS ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch mentors' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only alumni or other non-student verified roles should be able to create mentor profiles
    // Let's assume the UI already enforced they are alumni, but we should verify
    await connectDB();

    const dbUser = await User.findById(session.user.id);
    if (!dbUser || dbUser.role === 'student') {
      return NextResponse.json(
        { error: 'Students cannot create mentor profiles' },
        { status: 403 }
      );
    }

    const body = await req.json();

    const existingMentor = await Mentor.findOne({ userId: session.user.id });
    if (existingMentor) {
      return NextResponse.json({ error: 'Mentor profile already exists' }, { status: 400 });
    }

    const mentorData = {
      userId: new mongoose.Types.ObjectId(session.user.id),
      expertise: body.expertise || [],
      industry: body.industry,
      currentRole: body.currentRole,
      currentCompany: body.currentCompany,
      yearsOfExperience: body.yearsOfExperience,
      bio: body.bio,
      monthlySessionLimit: body.monthlySessionLimit || 4,
      linkedinUrl: body.linkedinUrl,
      graduatedFrom: body.graduatedFrom,
      mentorType: dbUser.role === 'alumni' ? 'alumni' : 'professional',
    };

    const mentor = await Mentor.create(mentorData);

    return NextResponse.json(mentor, { status: 201 });
  } catch (error) {
    console.error('[CREATE MENTOR ERROR]', error);
    return NextResponse.json({ error: 'Failed to create mentor profile' }, { status: 500 });
  }
}
