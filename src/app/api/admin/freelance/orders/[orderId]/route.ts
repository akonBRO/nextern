import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  completeFreelanceOrder,
  getFreelanceWorkspaceHref,
  getObjectIdString,
  refundFreelanceOrder,
} from '@/lib/freelance';
import { createNotification } from '@/lib/notify';
import { requireAdminSession } from '@/lib/admin';
import { AdminFreelanceOrderUpdateSchema } from '@/lib/validations';
import { FreelanceOrder } from '@/models/FreelanceOrder';

type Params = { params: Promise<{ orderId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { orderId } = await params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = AdminFreelanceOrderUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await FreelanceOrder.findById(orderId)
      .populate('listingId', 'title')
      .populate('clientId', 'name role')
      .populate('freelancerId', 'name')
      .lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const listingTitle =
      order.listingId && typeof order.listingId === 'object' && 'title' in order.listingId
        ? order.listingId.title
        : 'the freelance project';
    const clientRole =
      order.clientId && typeof order.clientId === 'object' && 'role' in order.clientId
        ? order.clientId.role
        : undefined;
    const adminNote = parsed.data.adminNote?.trim() ?? '';

    if (parsed.data.action === 'mark_disputed') {
      if (order.escrowStatus !== 'held') {
        return NextResponse.json(
          { error: 'Only funded escrow orders can be marked disputed.' },
          { status: 400 }
        );
      }

      await FreelanceOrder.findByIdAndUpdate(orderId, {
        $set: {
          status: 'disputed',
          disputedAt: new Date(),
          adminNote,
        },
      });

      await Promise.all([
        createNotification({
          userId: getObjectIdString(order.clientId),
          type: 'freelance_order',
          title: 'Superadmin opened a dispute review',
          body: adminNote
            ? `Superadmin marked "${listingTitle}" as disputed. Note: ${adminNote}`
            : `Superadmin marked "${listingTitle}" as disputed and is reviewing the escrow.`,
          link: getFreelanceWorkspaceHref(clientRole),
          meta: { orderId, status: 'disputed' },
        }),
        createNotification({
          userId: getObjectIdString(order.freelancerId),
          type: 'freelance_order',
          title: 'Superadmin opened a dispute review',
          body: adminNote
            ? `Superadmin marked "${listingTitle}" as disputed. Note: ${adminNote}`
            : `Superadmin marked "${listingTitle}" as disputed and is reviewing the escrow.`,
          link: '/student/freelance',
          meta: { orderId, status: 'disputed' },
        }),
      ]);

      return NextResponse.json({ message: 'Order marked as disputed.' });
    }

    if (parsed.data.action === 'restore_in_progress') {
      if (order.status !== 'disputed' || order.escrowStatus !== 'held') {
        return NextResponse.json(
          { error: 'Only disputed held orders can be restored.' },
          { status: 400 }
        );
      }

      await FreelanceOrder.findByIdAndUpdate(orderId, {
        $set: {
          status: 'in_progress',
          adminNote,
        },
      });

      await Promise.all([
        createNotification({
          userId: getObjectIdString(order.clientId),
          type: 'freelance_order',
          title: 'Dispute review closed',
          body: adminNote
            ? `Superadmin restored "${listingTitle}" to in-progress. Note: ${adminNote}`
            : `Superadmin restored "${listingTitle}" to in-progress.`,
          link: getFreelanceWorkspaceHref(clientRole),
          meta: { orderId, status: 'in_progress' },
        }),
        createNotification({
          userId: getObjectIdString(order.freelancerId),
          type: 'freelance_order',
          title: 'Dispute review closed',
          body: adminNote
            ? `Superadmin restored "${listingTitle}" to in-progress. Note: ${adminNote}`
            : `Superadmin restored "${listingTitle}" to in-progress.`,
          link: '/student/freelance',
          meta: { orderId, status: 'in_progress' },
        }),
      ]);

      return NextResponse.json({ message: 'Order restored to in-progress.' });
    }

    if (parsed.data.action === 'release_escrow') {
      if (order.escrowStatus !== 'held') {
        return NextResponse.json(
          { error: 'Only held escrow orders can be released.' },
          { status: 400 }
        );
      }

      await FreelanceOrder.findByIdAndUpdate(orderId, { $set: { adminNote } });
      await completeFreelanceOrder(orderId);

      if (adminNote) {
        await Promise.all([
          createNotification({
            userId: getObjectIdString(order.clientId),
            type: 'freelance_order',
            title: 'Superadmin released escrow',
            body: `Superadmin released escrow for "${listingTitle}". Note: ${adminNote}`,
            link: getFreelanceWorkspaceHref(clientRole),
            meta: { orderId, escrowStatus: 'released' },
          }),
          createNotification({
            userId: getObjectIdString(order.freelancerId),
            type: 'payment_received',
            title: 'Superadmin released escrow',
            body: `Superadmin released escrow for "${listingTitle}". Note: ${adminNote}`,
            link: '/student/freelance',
            meta: { orderId, escrowStatus: 'released' },
          }),
        ]);
      }

      return NextResponse.json({ message: 'Escrow released to freelancer.' });
    }

    if (parsed.data.action === 'refund_escrow') {
      if (order.escrowStatus !== 'held') {
        return NextResponse.json(
          { error: 'Only held escrow orders can be refunded.' },
          { status: 400 }
        );
      }

      await FreelanceOrder.findByIdAndUpdate(orderId, { $set: { adminNote } });
      await refundFreelanceOrder(orderId);

      if (adminNote) {
        await Promise.all([
          createNotification({
            userId: getObjectIdString(order.clientId),
            type: 'payment_received',
            title: 'Superadmin refunded escrow',
            body: `Superadmin refunded escrow for "${listingTitle}". Note: ${adminNote}`,
            link: getFreelanceWorkspaceHref(clientRole),
            meta: { orderId, escrowStatus: 'refunded' },
          }),
          createNotification({
            userId: getObjectIdString(order.freelancerId),
            type: 'freelance_order',
            title: 'Superadmin refunded escrow',
            body: `Superadmin refunded escrow for "${listingTitle}". Note: ${adminNote}`,
            link: '/student/freelance',
            meta: { orderId, escrowStatus: 'refunded' },
          }),
        ]);
      }

      return NextResponse.json({ message: 'Escrow refunded to client.' });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error) {
    console.error('[ADMIN FREELANCE ORDER UPDATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update freelance order.' }, { status: 500 });
  }
}
