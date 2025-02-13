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
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.userId)
    });

    if (!user || !adminEmails.includes(user.email)) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get total and active listings count
    const [total, active, sold, pending] = await Promise.all([
      db.collection('listings').countDocuments(),
      db.collection('listings').countDocuments({ status: 'active' }),
      db.collection('listings').countDocuments({ status: 'sold' }),
      db.collection('listings').countDocuments({ status: 'pending' })
    ]);

    // Get listings by category with detailed stats
    const categoryStats = await db.collection('listings').aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          sold: {
            $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] }
          },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalValue: { $sum: '$price' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    // Get condition distribution
    const conditionStats = await db.collection('listings').aggregate([
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();

    // Get price ranges distribution
    const priceRanges = [
      { range: '0-5000', min: 0, max: 5000 },
      { range: '5001-10000', min: 5001, max: 10000 },
      { range: '10001-20000', min: 10001, max: 20000 },
      { range: '20001-50000', min: 20001, max: 50000 },
      { range: '50000+', min: 50001, max: Infinity }
    ];

    const priceRangeStats = await Promise.all(
      priceRanges.map(async ({ range, min, max }) => {
        const query = max === Infinity
          ? { price: { $gte: min } }
          : { price: { $gte: min, $lte: max } };
        
        const count = await db.collection('listings').countDocuments(query);
        return { range, count };
      })
    );

    // Get daily new listings for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyNewListings = await db.collection('listings').aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          totalValue: { $sum: '$price' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]).toArray();

    // Get average time to sell
    const timeToSellStats = await db.collection('listings').aggregate([
      {
        $match: {
          status: 'sold',
          soldAt: { $exists: true },
          createdAt: { $exists: true }
        }
      },
      {
        $project: {
          timeToSell: {
            $divide: [
              { $subtract: ['$soldAt', '$createdAt'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTimeToSell: { $avg: '$timeToSell' },
          minTimeToSell: { $min: '$timeToSell' },
          maxTimeToSell: { $max: '$timeToSell' }
        }
      }
    ]).toArray();

    // Get popular tags
    const popularTags = await db.collection('listings').aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray();

    // Calculate overall price stats
    const priceStats = await db.collection('listings').aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalValue: { $sum: '$price' }
        }
      }
    ]).toArray();

    return NextResponse.json({
      total,
      active,
      sold,
      pending,
      listingCategoryStats: categoryStats,
      conditionStats,
      priceRangeStats,
      dailyNewListings,
      timeToSellStats: timeToSellStats[0] || {
        avgTimeToSell: 0,
        minTimeToSell: 0,
        maxTimeToSell: 0
      },
      popularTags,
      priceStats: priceStats[0] || {
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        totalValue: 0
      }
    });
  } catch (error) {
    console.error('Failed to fetch listing stats:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
} 