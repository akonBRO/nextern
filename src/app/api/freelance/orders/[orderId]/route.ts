/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import {
  calculateFreelancePayout,
  completeFreelanceOrder,
  getFreelanceOrderThreadId,
  getObjectIdString,
} from '@/lib/freelance';
import { calculateFreelanceQuote, inferFreelanceProposalStatus } from '@/lib/freelance-shared';
import { createNotification } from '@/lib/notify';
import { FreelanceOrderActionSchema } from '@/lib/validations';
import '@/models/FreelanceListing';
import { FreelanceOrder } from '@/models/FreelanceOrder';
import { FreelanceReview } from '@/models/FreelanceReview';

type Params = { params: Promise<{ orderId: string }> };

function canAccessOrder(
  order: { clientId: mongoose.Types.ObjectId; freelancerId: mongoose.Types.ObjectId },
  userId: string,
  role?: string
) {
  return (
    role === 'admin' ||
    getObjectIdString(order.clientId) === userId ||
    getObjectIdString(order.freelancerId) === userId
  );
}

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
    disputedAt: order.disputedAt?.toISOString?.() ?? null,
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

function getNextProposalResponder(
  latestOfferBy: unknown,
  flags: { isClient: boolean; isFreelancer: boolean }
) {
  if (latestOfferBy === 'client') {
    return flags.isFreelancer ? 'freelancer' : null;
  }

  return flags.isClient ? 'client' : null;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 });
    }

    await connectDB();

    const order = await FreelanceOrder.findById(orderId)
      .populate('listingId', 'title category skills deliveryDays priceType priceBDT')
      .populate('clientId', 'name role image companyName')
      .populate('freelancerId', 'name image university department')
      .lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (!canAccessOrder(order as any, session.user.id, session.user.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const reviews = await FreelanceReview.find({ orderId: order._id })
      .populate('reviewerId', 'name image role companyName')
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({
      order: serializeOrder(order as Record<string, any>),
      reviews: reviews.map((review) => ({
        _id: review._id.toString(),
        reviewType: review.reviewType,
        overallRating: review.overallRating ?? null,
        communicationRating: review.communicationRating ?? null,
        requirementsClarityRating: review.requirementsClarityRating ?? null,
        paymentPromptnessRating: review.paymentPromptnessRating ?? null,
        professionalismRating: review.professionalismRating ?? null,
        punctualityRating: review.punctualityRating ?? null,
        skillPerformanceRating: review.skillPerformanceRating ?? null,
        workQualityRating: review.workQualityRating ?? null,
        isRecommended: Boolean(review.isRecommended),
        recommendationText: review.recommendationText ?? '',
        comment: review.comment ?? '',
        createdAt: review.createdAt?.toISOString?.() ?? null,
        reviewer:
          review.reviewerId && typeof review.reviewerId === 'object'
            ? {
                _id: review.reviewerId._id.toString(),
                name: review.reviewerId.name,
                image: review.reviewerId.image ?? null,
                role: review.reviewerId.role ?? null,
                companyName: review.reviewerId.companyName ?? null,
              }
            : null,
      })),
    });
  } catch (error) {
    console.error('[FREELANCE ORDER DETAIL ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch freelance order.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = FreelanceOrderActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await FreelanceOrder.findById(orderId)
      .populate('listingId', 'title priceType priceBDT')
      .populate('clientId', 'name role')
      .populate('freelancerId', 'name')
      .lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (!canAccessOrder(order as any, session.user.id, session.user.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const isClient = getObjectIdString(order.clientId) === session.user.id;
    const isFreelancer = getObjectIdString(order.freelancerId) === session.user.id;
    const listingTitle =
      order.listingId && typeof order.listingId === 'object' ? order.listingId.title : 'project';
    const priceType =
      order.priceType ??
      (order.listingId && typeof order.listingId === 'object' && 'priceType' in order.listingId
        ? order.listingId.priceType
        : 'fixed');
    const clientRole =
      order.clientId && typeof order.clientId === 'object' ? order.clientId.role : undefined;
    const proposalStatus = inferFreelanceProposalStatus({
      proposalStatus: (order as Record<string, unknown>).proposalStatus as string | undefined,
      status: order.status,
    });
    const latestOfferBy = (order as Record<string, unknown>).latestOfferBy ?? 'client';
    const nextResponder = getNextProposalResponder(latestOfferBy, { isClient, isFreelancer });
    const existingThreadId =
      typeof (order as Record<string, unknown>).messageThreadId === 'string' &&
      (order as Record<string, unknown>).messageThreadId
        ? String((order as Record<string, unknown>).messageThreadId)
        : getFreelanceOrderThreadId(orderId);

    if (parsed.data.action === 'accept_proposal') {
      if (!nextResponder) {
        return NextResponse.json(
          { error: 'You cannot accept your own current offer.' },
          { status: 400 }
        );
      }
      if (!['requested', 'countered'].includes(proposalStatus)) {
        return NextResponse.json(
          { error: 'There is no active proposal waiting for acceptance.' },
          { status: 400 }
        );
      }

      const updated = await FreelanceOrder.findByIdAndUpdate(
        orderId,
        {
          $set: {
            proposalStatus: 'accepted',
            messageThreadId: existingThreadId,
          },
          $push: {
            negotiationHistory: {
              by: nextResponder,
              action: 'accept',
              rateBDT: Number(
                (order as Record<string, unknown>).quotedRateBDT ?? order.agreedPriceBDT
              ),
              hours:
                priceType === 'hourly'
                  ? Number((order as Record<string, unknown>).quotedHours ?? 1)
                  : undefined,
              totalBDT: order.agreedPriceBDT,
              note: parsed.data.proposalNote?.trim() ?? '',
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      )
        .populate('listingId', 'title category skills deliveryDays priceType priceBDT')
        .populate('clientId', 'name role image companyName')
        .populate('freelancerId', 'name image university department')
        .lean();

      await createNotification({
        userId: getObjectIdString(order.clientId),
        type: 'freelance_order',
        title: 'Freelance quote accepted',
        body: `The quote for "${listingTitle}" is approved. Fund the escrow now to start the project, and use the dedicated freelance chat for delivery coordination.`,
        link: clientRole === 'employer' ? '/employer/freelance' : '/student/freelance',
        meta: { orderId, proposalStatus: 'accepted', threadId: existingThreadId },
      });

      await createNotification({
        userId: getObjectIdString(order.freelancerId),
        type: 'freelance_order',
        title: 'Freelance quote accepted',
        body: `The quote for "${listingTitle}" is now accepted. The project chat is ready, and work starts as soon as the client funds escrow.`,
        link: '/student/freelance',
        meta: { orderId, proposalStatus: 'accepted', threadId: existingThreadId },
      });

      return NextResponse.json({
        message:
          'Proposal accepted. The client can now fund escrow and the freelance chat is unlocked.',
        order: serializeOrder(updated as Record<string, any>),
      });
    }

    if (parsed.data.action === 'counter_proposal') {
      if (!nextResponder) {
        return NextResponse.json(
          { error: 'You cannot counter your own current offer.' },
          { status: 400 }
        );
      }
      if (!['requested', 'countered'].includes(proposalStatus)) {
        return NextResponse.json(
          { error: 'Only open proposal requests can be countered.' },
          { status: 400 }
        );
      }

      if (!parsed.data.quotedRateBDT) {
        return NextResponse.json(
          { error: 'A counter proposal must include the updated rate or price.' },
          { status: 400 }
        );
      }
      if (priceType === 'hourly' && !parsed.data.quotedHours) {
        return NextResponse.json(
          { error: 'Hourly counter proposals must include the estimated hours.' },
          { status: 400 }
        );
      }

      const quote = calculateFreelanceQuote({
        priceType,
        rateBDT: parsed.data.quotedRateBDT,
        hours: parsed.data.quotedHours,
      });
      const payout = calculateFreelancePayout(quote.totalBDT);

      const updated = await FreelanceOrder.findByIdAndUpdate(
        orderId,
        {
          $set: {
            quotedRateBDT: quote.rateBDT,
            quotedHours: quote.hours,
            proposalStatus: 'countered',
            latestOfferBy: nextResponder,
            proposalNote: parsed.data.proposalNote?.trim() ?? '',
            ...payout,
          },
          $push: {
            negotiationHistory: {
              by: nextResponder,
              action: 'counter',
              rateBDT: quote.rateBDT,
              hours: quote.hours,
              totalBDT: quote.totalBDT,
              note: parsed.data.proposalNote?.trim() ?? '',
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      )
        .populate('listingId', 'title category skills deliveryDays priceType priceBDT')
        .populate('clientId', 'name role image companyName')
        .populate('freelancerId', 'name image university department')
        .lean();

      const counterpartyId =
        nextResponder === 'client'
          ? getObjectIdString(order.freelancerId)
          : getObjectIdString(order.clientId);
      const counterpartyLink =
        nextResponder === 'client'
          ? '/student/freelance'
          : clientRole === 'employer'
            ? '/employer/freelance'
            : '/student/freelance';

      await createNotification({
        userId: counterpartyId,
        type: 'freelance_order',
        title: 'Freelance quote counter received',
        body:
          priceType === 'hourly'
            ? `A new counter-offer for "${listingTitle}" is ready: ${quote.rateBDT} BDT/hour for ${quote.hours} hour${quote.hours === 1 ? '' : 's'}.`
            : `A new counter-offer for "${listingTitle}" is ready: ${quote.totalBDT} BDT.`,
        link: counterpartyLink,
        meta: { orderId, proposalStatus: 'countered' },
      });

      return NextResponse.json({
        message: 'Counter proposal sent.',
        order: serializeOrder(updated as Record<string, any>),
      });
    }

    if (parsed.data.action === 'reject_proposal') {
      if (!nextResponder) {
        return NextResponse.json(
          { error: 'You cannot reject your own current offer.' },
          { status: 400 }
        );
      }
      if (!['requested', 'countered'].includes(proposalStatus)) {
        return NextResponse.json(
          { error: 'There is no open proposal to reject.' },
          { status: 400 }
        );
      }

      const updated = await FreelanceOrder.findByIdAndUpdate(
        orderId,
        {
          $set: {
            proposalStatus: 'rejected',
            status: 'cancelled',
            proposalNote: parsed.data.proposalNote?.trim() ?? '',
          },
          $push: {
            negotiationHistory: {
              by: nextResponder,
              action: 'reject',
              rateBDT: Number(
                (order as Record<string, unknown>).quotedRateBDT ?? order.agreedPriceBDT
              ),
              hours:
                priceType === 'hourly'
                  ? Number((order as Record<string, unknown>).quotedHours ?? 1)
                  : undefined,
              totalBDT: order.agreedPriceBDT,
              note: parsed.data.proposalNote?.trim() ?? '',
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      )
        .populate('listingId', 'title category skills deliveryDays priceType priceBDT')
        .populate('clientId', 'name role image companyName')
        .populate('freelancerId', 'name image university department')
        .lean();

      const counterpartyId =
        nextResponder === 'client'
          ? getObjectIdString(order.freelancerId)
          : getObjectIdString(order.clientId);
      const counterpartyLink =
        nextResponder === 'client'
          ? '/student/freelance'
          : clientRole === 'employer'
            ? '/employer/freelance'
            : '/student/freelance';

      await createNotification({
        userId: counterpartyId,
        type: 'freelance_order',
        title: 'Freelance quote closed',
        body: `The quote for "${listingTitle}" was declined. You can create a fresh request if you want to reopen the project.`,
        link: counterpartyLink,
        meta: { orderId, proposalStatus: 'rejected' },
      });

      return NextResponse.json({
        message: 'Proposal rejected.',
        order: serializeOrder(updated as Record<string, any>),
      });
    }

    if (parsed.data.action === 'deliver') {
      if (!isFreelancer) {
        return NextResponse.json(
          { error: 'Only the freelancer can deliver work.' },
          { status: 403 }
        );
      }
      if (
        !['in_progress', 'revision_requested'].includes(order.status) ||
        order.escrowStatus !== 'held'
      ) {
        return NextResponse.json(
          { error: 'This order is not ready for delivery.' },
          { status: 400 }
        );
      }

      const updated = await FreelanceOrder.findByIdAndUpdate(
        orderId,
        {
          $set: {
            status: 'delivered',
            deliveryNote: parsed.data.deliveryNote ?? '',
            deliveryFiles: parsed.data.deliveryFiles ?? [],
            deliveredAt: new Date(),
          },
        },
        { new: true }
      )
        .populate('listingId', 'title category skills deliveryDays priceType priceBDT')
        .populate('clientId', 'name role image companyName')
        .populate('freelancerId', 'name image university department')
        .lean();

      await createNotification({
        userId: getObjectIdString(order.clientId),
        type: 'freelance_order',
        title: 'Delivery submitted',
        body: `${order.freelancerId && typeof order.freelancerId === 'object' ? order.freelancerId.name : 'Your freelancer'} delivered work for "${listingTitle}". Review the files and confirm or request a revision.`,
        link: clientRole === 'employer' ? '/employer/freelance' : '/student/freelance',
        meta: { orderId, listingTitle, status: 'delivered' },
      });

      return NextResponse.json({
        message: 'Delivery submitted.',
        order: serializeOrder(updated as Record<string, any>),
      });
    }

    if (parsed.data.action === 'request_revision') {
      if (!isClient) {
        return NextResponse.json(
          { error: 'Only the client can request a revision.' },
          { status: 403 }
        );
      }
      if (order.status !== 'delivered') {
        return NextResponse.json(
          { error: 'A revision can only be requested after delivery.' },
          { status: 400 }
        );
      }

      const updated = await FreelanceOrder.findByIdAndUpdate(
        orderId,
        {
          $set: {
            status: 'revision_requested',
            clientNote: parsed.data.clientNote ?? '',
          },
          $inc: { revisionCount: 1 },
        },
        { new: true }
      )
        .populate('listingId', 'title category skills deliveryDays priceType priceBDT')
        .populate('clientId', 'name role image companyName')
        .populate('freelancerId', 'name image university department')
        .lean();

      await createNotification({
        userId: getObjectIdString(order.freelancerId),
        type: 'freelance_order',
        title: 'Revision requested',
        body: `The client requested a revision for "${listingTitle}". Review the latest note and upload an updated delivery.`,
        link: '/student/freelance',
        meta: { orderId, listingTitle, status: 'revision_requested' },
      });

      return NextResponse.json({
        message: 'Revision requested.',
        order: serializeOrder(updated as Record<string, any>),
      });
    }

    if (parsed.data.action === 'confirm_completion') {
      if (!isClient) {
        return NextResponse.json(
          { error: 'Only the client can confirm completion.' },
          { status: 403 }
        );
      }
      if (order.status !== 'delivered') {
        return NextResponse.json(
          { error: 'The order must be delivered before confirmation.' },
          { status: 400 }
        );
      }

      const completedOrder = await completeFreelanceOrder(orderId);
      return NextResponse.json({
        message: 'Project approved and escrow released.',
        order: completedOrder,
      });
    }

    if (parsed.data.action === 'cancel') {
      if (!isClient || order.escrowStatus !== 'pending_payment' || order.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only unpaid client orders can be cancelled here.' },
          { status: 400 }
        );
      }

      const updated = await FreelanceOrder.findByIdAndUpdate(
        orderId,
        { $set: { status: 'cancelled' } },
        { new: true }
      )
        .populate('listingId', 'title category skills deliveryDays priceType priceBDT')
        .populate('clientId', 'name role image companyName')
        .populate('freelancerId', 'name image university department')
        .lean();

      return NextResponse.json({
        message: 'Order cancelled.',
        order: serializeOrder(updated as Record<string, any>),
      });
    }

    if (parsed.data.action === 'mark_disputed') {
      if (!isClient && !isFreelancer) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
      if (
        !['in_progress', 'delivered', 'revision_requested'].includes(order.status) ||
        order.escrowStatus !== 'held'
      ) {
        return NextResponse.json(
          { error: 'Only held orders can be marked as disputed.' },
          { status: 400 }
        );
      }

      const updated = await FreelanceOrder.findByIdAndUpdate(
        orderId,
        {
          $set: {
            status: 'disputed',
            disputedAt: new Date(),
            clientNote: parsed.data.clientNote ?? order.clientNote ?? '',
          },
        },
        { new: true }
      )
        .populate('listingId', 'title category skills deliveryDays priceType priceBDT')
        .populate('clientId', 'name role image companyName')
        .populate('freelancerId', 'name image university department')
        .lean();

      const counterpartyId = isClient
        ? getObjectIdString(order.freelancerId)
        : getObjectIdString(order.clientId);
      const counterpartyRole = isClient ? 'student' : clientRole;

      await createNotification({
        userId: counterpartyId,
        type: 'freelance_order',
        title: 'Order marked as disputed',
        body: `A dispute was opened for "${listingTitle}". Superadmin can now review the escrow and project history.`,
        link: counterpartyRole === 'employer' ? '/employer/freelance' : '/student/freelance',
        meta: { orderId, listingTitle, status: 'disputed' },
      });

      return NextResponse.json({
        message: 'Dispute opened.',
        order: serializeOrder(updated as Record<string, any>),
      });
    }

    return NextResponse.json({ error: 'Unsupported order action.' }, { status: 400 });
  } catch (error) {
    console.error('[FREELANCE ORDER UPDATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update freelance order.' }, { status: 500 });
  }
}
