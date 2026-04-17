/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { calculateFreelancePayout, getFreelanceOrderThreadId } from '@/lib/freelance';
import { calculateFreelanceQuote, inferFreelanceProposalStatus } from '@/lib/freelance-shared';
import { createNotification } from '@/lib/notify';
import { FreelanceOrderCreateSchema } from '@/lib/validations';
import { FreelanceListing } from '@/models/FreelanceListing';
import { FreelanceOrder } from '@/models/FreelanceOrder';

function serializeOrder(order: Record<string, any>) {
  const listing =
    order.listingId && typeof order.listingId === 'object'
      ? order.listingId
      : { _id: order.listingId };
  const client =
    order.clientId && typeof order.clientId === 'object' ? order.clientId : { _id: order.clientId };
  const freelancer =
    order.freelancerId && typeof order.freelancerId === 'object'
      ? order.freelancerId
      : { _id: order.freelancerId };
  const proposalStatus = inferFreelanceProposalStatus({
    proposalStatus: order.proposalStatus,
    status: order.status,
  });
  const priceType = order.priceType ?? listing.priceType ?? 'fixed';
  const quotedRateBDT = Number(
    order.quotedRateBDT ?? order.agreedPriceBDT ?? listing.priceBDT ?? 0
  );
  const quotedHours = priceType === 'hourly' ? Number(order.quotedHours ?? 1) : null;
  const messageThreadId =
    typeof order.messageThreadId === 'string' && order.messageThreadId.trim()
      ? order.messageThreadId
      : getFreelanceOrderThreadId(order._id.toString());

  return {
    _id: order._id.toString(),
    status: order.status,
    escrowStatus: order.escrowStatus,
    priceType,
    listedPriceBDT: Number(order.listedPriceBDT ?? listing.priceBDT ?? 0),
    quotedRateBDT,
    quotedHours,
    proposalStatus,
    latestOfferBy: order.latestOfferBy ?? 'client',
    proposalNote: order.proposalNote ?? '',
    messageThreadId,
    agreedPriceBDT: order.agreedPriceBDT,
    nexternCutBDT: order.nexternCutBDT,
    freelancerPayoutBDT: order.freelancerPayoutBDT,
    paymentMethod: order.paymentMethod ?? null,
    requirements: order.requirements,
    requirementsFiles: order.requirementsFiles ?? [],
    adminNote: order.adminNote ?? '',
    deliveryFiles: order.deliveryFiles ?? [],
    deliveryNote: order.deliveryNote ?? '',
    clientNote: order.clientNote ?? '',
    revisionCount: order.revisionCount ?? 0,
    dueDate: order.dueDate?.toISOString?.() ?? null,
    deliveredAt: order.deliveredAt?.toISOString?.() ?? null,
    completedAt: order.completedAt?.toISOString?.() ?? null,
    clientConfirmedAt: order.clientConfirmedAt?.toISOString?.() ?? null,
    createdAt: order.createdAt?.toISOString?.() ?? null,
    clientReviewSubmitted: Boolean(order.clientReviewSubmitted),
    freelancerReviewSubmitted: Boolean(order.freelancerReviewSubmitted),
    negotiationHistory: Array.isArray(order.negotiationHistory)
      ? order.negotiationHistory.map((entry: Record<string, any>) => ({
          by: entry.by,
          action: entry.action,
          rateBDT: Number(entry.rateBDT ?? 0),
          hours: typeof entry.hours === 'number' ? entry.hours : null,
          totalBDT: Number(entry.totalBDT ?? 0),
          note: entry.note ?? '',
          createdAt: entry.createdAt?.toISOString?.() ?? null,
        }))
      : [],
    listing: {
      _id: listing._id?.toString?.() ?? String(order.listingId ?? ''),
      title: listing.title ?? 'Freelance service',
      category: listing.category ?? 'other',
      skills: listing.skills ?? [],
      deliveryDays: listing.deliveryDays ?? null,
      priceType: listing.priceType ?? null,
      priceBDT: Number(listing.priceBDT ?? 0),
    },
    client: {
      _id: client._id?.toString?.() ?? String(order.clientId ?? ''),
      name: client.name ?? 'Client',
      role: client.role ?? null,
      image: client.image ?? null,
      companyName: client.companyName ?? null,
    },
    freelancer: {
      _id: freelancer._id?.toString?.() ?? String(order.freelancerId ?? ''),
      name: freelancer.name ?? 'Freelancer',
      image: freelancer.image ?? null,
      university: freelancer.university ?? null,
      department: freelancer.department ?? null,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const status = (new URL(req.url).searchParams.get('status') ?? '').trim();
    const queryFilter = status ? { status } : {};

    const clientOrdersPromise = FreelanceOrder.find({
      clientId: new mongoose.Types.ObjectId(session.user.id),
      ...queryFilter,
    })
      .populate('listingId', 'title category skills deliveryDays priceType priceBDT')
      .populate('clientId', 'name role image companyName')
      .populate('freelancerId', 'name image university department')
      .sort({ createdAt: -1 })
      .lean();

    const freelancerOrdersPromise =
      session.user.role === 'student'
        ? FreelanceOrder.find({
            freelancerId: new mongoose.Types.ObjectId(session.user.id),
            ...queryFilter,
          })
            .populate('listingId', 'title category skills deliveryDays priceType priceBDT')
            .populate('clientId', 'name role image companyName')
            .populate('freelancerId', 'name image university department')
            .sort({ createdAt: -1 })
            .lean()
        : Promise.resolve([]);

    const [clientOrders, freelancerOrders] = await Promise.all([
      clientOrdersPromise,
      freelancerOrdersPromise,
    ]);

    return NextResponse.json({
      clientOrders: clientOrders.map((order) => serializeOrder(order as Record<string, any>)),
      freelancerOrders: freelancerOrders.map((order) =>
        serializeOrder(order as Record<string, any>)
      ),
      summary: {
        clientOrders: clientOrders.length,
        freelancerOrders: freelancerOrders.length,
      },
    });
  } catch (error) {
    console.error('[FREELANCE ORDERS GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch freelance orders.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['student', 'employer'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only students and employers can place orders.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = FreelanceOrderCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const listing = await FreelanceListing.findById(parsed.data.listingId).select(
      'studentId title deliveryDays priceBDT priceType isActive'
    );
    if (!listing || !listing.isActive) {
      return NextResponse.json({ error: 'Listing is no longer available.' }, { status: 404 });
    }

    if (listing.studentId.toString() === session.user.id) {
      return NextResponse.json({ error: 'You cannot order your own listing.' }, { status: 400 });
    }

    if (listing.priceType === 'hourly' && !parsed.data.quotedHours) {
      return NextResponse.json(
        { error: 'Hourly orders require the estimated number of hours.' },
        { status: 400 }
      );
    }

    const quote = calculateFreelanceQuote({
      priceType: listing.priceType ?? 'fixed',
      rateBDT: parsed.data.quotedRateBDT ?? listing.priceBDT,
      hours: parsed.data.quotedHours,
    });
    const payout = calculateFreelancePayout(quote.totalBDT);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.max(1, listing.deliveryDays));

    const order = await FreelanceOrder.create({
      listingId: listing._id,
      clientId: new mongoose.Types.ObjectId(session.user.id),
      freelancerId: listing.studentId,
      requirements: parsed.data.requirements,
      requirementsFiles: parsed.data.requirementsFiles,
      priceType: listing.priceType ?? 'fixed',
      listedPriceBDT: listing.priceBDT,
      quotedRateBDT: quote.rateBDT,
      quotedHours: quote.hours,
      proposalStatus: 'requested',
      latestOfferBy: 'client',
      proposalNote: parsed.data.proposalNote?.trim() ?? '',
      negotiationHistory: [
        {
          by: 'client',
          action: 'request',
          rateBDT: quote.rateBDT,
          hours: quote.hours,
          totalBDT: quote.totalBDT,
          note: parsed.data.proposalNote?.trim() ?? '',
          createdAt: new Date(),
        },
      ],
      status: 'pending',
      escrowStatus: 'pending_payment',
      paymentMethod: parsed.data.paymentMethod,
      dueDate,
      ...payout,
    });

    await createNotification({
      userId: listing.studentId.toString(),
      type: 'freelance_order',
      title: 'New freelance order request',
      body:
        listing.priceType === 'hourly'
          ? `A client requested "${listing.title}" for ${quote.hours} hour${quote.hours === 1 ? '' : 's'} at ${quote.rateBDT} BDT/hour. Review the quote and accept, counter, or reject it.`
          : `A client requested "${listing.title}" for ${quote.totalBDT} BDT. Review the quote and accept, counter, or reject it.`,
      link: '/student/freelance',
      meta: {
        orderId: order._id.toString(),
        proposalStatus: 'requested',
      },
    });

    return NextResponse.json(
      {
        message:
          'Freelance order request sent. The freelancer must accept the quote before payment.',
        order: {
          _id: order._id.toString(),
          priceType: listing.priceType ?? 'fixed',
          quotedRateBDT: quote.rateBDT,
          quotedHours: quote.hours ?? null,
          agreedPriceBDT: order.agreedPriceBDT,
          proposalStatus: 'requested',
          status: order.status,
          escrowStatus: order.escrowStatus,
          paymentMethod: order.paymentMethod,
          dueDate: order.dueDate.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[FREELANCE ORDER CREATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to create freelance order.' }, { status: 500 });
  }
}
