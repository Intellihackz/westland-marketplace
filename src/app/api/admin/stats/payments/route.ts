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

    // Get payment stats
    const stats = await db.collection('payments').aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          totalPlatformFees: { $sum: '$platformFee' },
          totalSellerRevenue: { $sum: '$sellerAmount' },
          paymentsPending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          paymentsHeld: {
            $sum: { $cond: [{ $eq: ['$status', 'held'] }, 1, 0] }
          },
          paymentsCompleted: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          paymentsRefunded: {
            $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
          },
          paymentsFailed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          avgTransactionValue: { $avg: '$amount' }
        }
      }
    ]).toArray();

    // Get monthly revenue for the past 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await db.collection('payments').aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          status: { $in: ['completed', 'held'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          platformFees: { $sum: '$platformFee' },
          sellerRevenue: { $sum: '$sellerAmount' },
          transactions: { $sum: 1 },
          avgValue: { $avg: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]).toArray();

    // Get daily revenue for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await db.collection('payments').aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $in: ['completed', 'held'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]).toArray();

    // Get payment stats by category
    const categoryStats = await db.collection('payments').aggregate([
      {
        $lookup: {
          from: 'listings',
          let: { listingId: '$listingId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$listingId' }] }
              }
            }
          ],
          as: 'listing'
        }
      },
      {
        $unwind: '$listing'
      },
      {
        $group: {
          _id: '$listing.category',
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          avgValue: { $avg: '$amount' }
        }
      },
      {
        $sort: { revenue: -1 }
      }
    ]).toArray();

    const defaultStats = {
      totalSales: 0,
      totalRevenue: 0,
      totalPlatformFees: 0,
      totalSellerRevenue: 0,
      paymentsPending: 0,
      paymentsHeld: 0,
      paymentsCompleted: 0,
      paymentsRefunded: 0,
      paymentsFailed: 0,
      avgTransactionValue: 0
    };

    const finalStats = {
      ...defaultStats,
      ...(stats[0] || {}),
      monthlyRevenue,
      dailyRevenue,
      paymentCategoryStats: categoryStats
    };

    return NextResponse.json(finalStats);
  } catch (error) {
    console.error('Failed to fetch payment stats:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
} 