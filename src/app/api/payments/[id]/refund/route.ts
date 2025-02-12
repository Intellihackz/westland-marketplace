import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { refundTransaction } from '@/lib/paystack';

const JWT_SECRET = process.env.JWT_SECRET!;

// POST /api/payments/[id]/refund - Refund payment back to buyer
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const client = await clientPromise;
    const db = client.db('unimarket');

    // Get payment record
    const payment = await db.collection('payments').findOne({
      _id: new ObjectId(params.id),
      status: 'held'
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or not in escrow' },
        { status: 404 }
      );
    }

    // Verify that the requester is the seller
    if (payment.sellerId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Not authorized to refund this payment' },
        { status: 403 }
      );
    }

    // Process refund through Paystack
    await refundTransaction(payment.paystackReference);

    // Update payment status to refunded
    await db.collection('payments').updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: 'refunded',
          updatedAt: new Date()
        }
      }
    );

    // Update listing status back to active
    await db.collection('listings').updateOne(
      { _id: payment.listingId },
      {
        $set: {
          status: 'active'
        },
        $unset: {
          buyer: 1
        }
      }
    );

    // Update platform fee status back to pending
    await db.collection('platform_fees').updateOne(
      { listingId: payment.listingId },
      {
        $set: {
          status: 'pending',
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      message: 'Payment refunded successfully'
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to refund payment' },
      { status: 500 }
    );
  }
} 