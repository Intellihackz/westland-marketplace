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

    // Get total users count and role distribution
    const userStats = await db.collection('users').aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          admins: {
            $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
          },
          regularUsers: {
            $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] }
          }
        }
      }
    ]).toArray();

    // Get new users in different time periods
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [lastDay, lastWeek, lastMonth] = await Promise.all([
      db.collection('users').countDocuments({
        createdAt: { $gte: oneDayAgo }
      }),
      db.collection('users').countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      }),
      db.collection('users').countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      })
    ]);

    // Get daily new users for the past 30 days
    const dailyNewUsers = await db.collection('users').aggregate([
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
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]).toArray();

    // Get user activity stats
    const activityStats = await db.collection('users').aggregate([
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
          as: 'listings'
        }
      },
      {
        $lookup: {
          from: 'payments',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$buyerId', { $toString: '$$userId' }]
                }
              }
            }
          ],
          as: 'purchases'
        }
      },
      {
        $group: {
          _id: null,
          totalSellers: {
            $sum: { $cond: [{ $gt: [{ $size: '$listings' }, 0] }, 1, 0] }
          },
          totalBuyers: {
            $sum: { $cond: [{ $gt: [{ $size: '$purchases' }, 0] }, 1, 0] }
          },
          activeSellers: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: '$listings',
                          as: 'listing',
                          cond: {
                            $gte: ['$$listing.createdAt', thirtyDaysAgo]
                          }
                        }
                      }
                    },
                    0
                  ]
                },
                1,
                0
              ]
            }
          },
          activeBuyers: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: '$purchases',
                          as: 'purchase',
                          cond: {
                            $gte: ['$$purchase.createdAt', thirtyDaysAgo]
                          }
                        }
                      }
                    },
                    0
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]).toArray();

    // Get top sellers
    const topSellers = await db.collection('users').aggregate([
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
          as: 'listings'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          listingCount: { $size: '$listings' }
        }
      },
      {
        $match: {
          listingCount: { $gt: 0 }
        }
      },
      {
        $sort: { listingCount: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray();

    const defaultStats = {
      total: 0,
      admins: 0,
      regularUsers: 0
    };

    return NextResponse.json({
      ...defaultStats,
      ...(userStats[0] || {}),
      growth: {
        lastDay,
        lastWeek,
        lastMonth
      },
      dailyNewUsers,
      activityStats: activityStats[0] || {
        totalSellers: 0,
        totalBuyers: 0,
        activeSellers: 0,
        activeBuyers: 0
      },
      topSellers
    });
  } catch (error) {
    console.error('Failed to fetch user stats:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
} 