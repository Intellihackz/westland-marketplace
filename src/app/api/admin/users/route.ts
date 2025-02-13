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
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || 'all';

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role !== 'all') {
      query.role = role;
    }

    // Get total count
    const total = await db.collection('users').countDocuments(query);

    // Get users with pagination
    const users = await db.collection('users')
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'listings',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$seller._id', '$$userId']
                  }
                }
              }
            ],
            as: 'userListings'
          }
        },
        {
          $project: {
            name: 1,
            email: 1,
            role: 1,
            createdAt: 1,
            listings: { $size: '$userListings' }
          }
        },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ])
      .toArray();

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
} 