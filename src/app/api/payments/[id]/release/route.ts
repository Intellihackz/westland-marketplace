import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET!;

// POST /api/payments/[id]/release - Release funds from escrow to seller
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

    // Verify that the requester is the buyer
    if (payment.buyerId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Not authorized to release this payment' },
        { status: 403 }
      );
    }

    // Update payment status to released
    await db.collection('payments').updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: 'released',
          updatedAt: new Date()
        }
      }
    );

    // Update listing status to sold
    await db.collection('listings').updateOne(
      { _id: payment.listingId },
      {
        $set: {
          status: 'sold',
          buyer: {
            _id: payment.buyerId,
            purchasedAt: new Date()
          }
        }
      }
    );

    return NextResponse.json({
      message: 'Funds released to seller successfully'
    });
  } catch (error) {
    console.error('Release payment error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to release payment' },
      { status: 500 }
    );
  }
} 