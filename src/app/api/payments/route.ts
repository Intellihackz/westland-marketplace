import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { nanoid } from 'nanoid';
import clientPromise from '@/lib/mongodb';
import { initializeTransaction } from '@/lib/paystack';

const JWT_SECRET = process.env.JWT_SECRET!;

// POST /api/payments - Initialize payment and create escrow
export async function POST(req: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { listingId } = await req.json();

    if (!listingId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('unimarket');

    // Get listing and buyer details
    const [listing, buyer] = await Promise.all([
      db.collection('listings').findOne({
        _id: new ObjectId(listingId),
        status: 'active'
      }),
      db.collection('users').findOne({
        _id: new ObjectId(decoded.userId)
      })
    ]);

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found or not available' },
        { status: 404 }
      );
    }

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      );
    }

    // Check if buyer is not the seller
    if (listing.seller._id.toString() === decoded.userId) {
      return NextResponse.json(
        { error: 'You cannot buy your own listing' },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = `PAY-${nanoid()}`;

    // Initialize Paystack transaction
    const paystackResponse = await initializeTransaction(
      buyer.email,
      listing.price,
      reference,
      {
        listingId,
        buyerId: decoded.userId,
        sellerId: listing.seller._id.toString()
      }
    );

    // Create escrow payment record
    const escrowPayment = {
      listingId: new ObjectId(listingId),
      buyerId: new ObjectId(decoded.userId),
      sellerId: new ObjectId(listing.seller._id),
      amount: listing.price,
      paystackReference: reference,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('payments').insertOne(escrowPayment);

    return NextResponse.json({
      authorization_url: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}

// GET /api/payments - Get user's payments
export async function GET(req: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const userId = new ObjectId(decoded.userId);
    const client = await clientPromise;
    const db = client.db('unimarket');

    // Get all payments where user is either buyer or seller
    const payments = await db.collection('payments')
      .aggregate([
        {
          $match: {
            $or: [
              { buyerId: userId },
              { sellerId: userId }
            ]
          }
        },
        {
          $lookup: {
            from: 'listings',
            localField: 'listingId',
            foreignField: '_id',
            as: 'listing'
          }
        },
        {
          $unwind: '$listing'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'buyerId',
            foreignField: '_id',
            as: 'buyer'
          }
        },
        {
          $unwind: '$buyer'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'sellerId',
            foreignField: '_id',
            as: 'seller'
          }
        },
        {
          $unwind: '$seller'
        },
        {
          $project: {
            _id: 1,
            amount: 1,
            status: 1,
            paystackReference: 1,
            createdAt: 1,
            updatedAt: 1,
            listing: {
              _id: '$listing._id',
              title: '$listing.title',
              image: { $arrayElemAt: ['$listing.images', 0] }
            },
            buyer: {
              _id: '$buyer._id',
              name: '$buyer.name',
              email: '$buyer.email'
            },
            seller: {
              _id: '$seller._id',
              name: '$seller.name',
              email: '$seller.email'
            }
          }
        }
      ])
      .toArray();

    // Format ObjectIds and dates for client
    const formattedPayments = payments.map(payment => ({
      ...payment,
      _id: payment._id.toString(),
      listing: {
        ...payment.listing,
        _id: payment.listing._id.toString()
      },
      buyer: {
        ...payment.buyer,
        _id: payment.buyer._id.toString()
      },
      seller: {
        ...payment.seller,
        _id: payment.seller._id.toString()
      },
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString()
    }));

    return NextResponse.json({ payments: formattedPayments });
  } catch (error) {
    console.error('Get payments error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get payments' },
      { status: 500 }
    );
  }
} 