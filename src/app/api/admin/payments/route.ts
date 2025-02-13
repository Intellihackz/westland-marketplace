import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

const adminEmails = ['admin@westland.edu', 'zephyrdev@duck.com'];
const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
  try {
    // Get auth token from cookie
    const token = cookies().get('auth-token')?.value;
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("unimarket");

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const adminUser = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.userId)
    });

    if (!adminUser || !adminEmails.includes(adminUser.email)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status') || 'all';

    // Build query
    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }

    // Get total count
    const total = await db.collection('payments').countDocuments(query);

    // Get payments with pagination
    const payments = await db.collection('payments')
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'listings',
            let: { listingId: '$listingId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$listingId' }]
                  }
                }
              }
            ],
            as: 'listingDetails'
          }
        },
        {
          $lookup: {
            from: 'users',
            let: { buyerId: '$buyerId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$buyerId' }]
                  }
                }
              }
            ],
            as: 'buyerDetails'
          }
        },
        {
          $lookup: {
            from: 'users',
            let: { sellerId: '$sellerId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$sellerId' }]
                  }
                }
              }
            ],
            as: 'sellerDetails'
          }
        },
        {
          $project: {
            _id: 1,
            amount: 1,
            platformFee: 1,
            sellerAmount: 1,
            status: 1,
            paystackReference: 1,
            createdAt: 1,
            updatedAt: 1,
            listing: {
              $arrayElemAt: ['$listingDetails', 0]
            },
            buyer: {
              $arrayElemAt: ['$buyerDetails', 0]
            },
            seller: {
              $arrayElemAt: ['$sellerDetails', 0]
            }
          }
        },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ])
      .toArray();

    return NextResponse.json({
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
} 