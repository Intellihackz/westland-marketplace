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
    const category = url.searchParams.get('category') || 'all';
    const search = url.searchParams.get('search') || '';

    // Build query
    const query: any = {};
    if (status !== 'all') {
      query.status = status;
    }
    if (category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Get total count
    const total = await db.collection('listings').countDocuments(query);

    // Get listings with pagination
    const listings = await db.collection('listings')
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
} 