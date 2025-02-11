import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { verifyTransaction } from '@/lib/paystack';

// POST /api/payments/verify - Verify payment and update escrow status
export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json(
        { error: 'Missing reference' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('unimarket');

    // Get payment record
    const payment = await db.collection('payments').findOne({
      paystackReference: reference
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify payment with Paystack
    const verificationResponse = await verifyTransaction(reference);

    if (verificationResponse.data.status === 'success') {
      // Update payment status to held (in escrow)
      await db.collection('payments').updateOne(
        { paystackReference: reference },
        {
          $set: {
            status: 'held',
            updatedAt: new Date()
          }
        }
      );

      // Update listing status to pending
      await db.collection('listings').updateOne(
        { _id: payment.listingId },
        {
          $set: {
            status: 'pending',
            buyer: {
              _id: payment.buyerId,
              purchasedAt: new Date()
            }
          }
        }
      );

      return NextResponse.json({
        message: 'Payment verified and funds held in escrow'
      });
    } else {
      // Update payment status to failed
      await db.collection('payments').updateOne(
        { paystackReference: reference },
        {
          $set: {
            status: 'failed',
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 