import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET!;

// POST /api/messages - Send a new message
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
    const { listingId, sellerId, message } = await req.json();

    if (!listingId || !sellerId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('unimarket');

    // Verify listing exists and is active
    const listing = await db.collection('listings').findOne({
      _id: new ObjectId(listingId),
      status: 'active'
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found or not available' },
        { status: 404 }
      );
    }

    // Create message
    const newMessage = {
      listingId: new ObjectId(listingId),
      senderId: new ObjectId(decoded.userId),
      receiverId: new ObjectId(sellerId),
      content: message,
      createdAt: new Date(),
      read: false
    };

    const result = await db.collection('messages').insertOne(newMessage);

    return NextResponse.json({
      message: 'Message sent successfully',
      messageId: result.insertedId
    });
  } catch (error) {
    console.error('Send message error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET /api/messages - Get user's conversations
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

    // Get all messages where user is either sender or receiver
    const messages = await db.collection('messages')
      .aggregate([
        {
          $match: {
            $or: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: '$listingId',
            listingId: { $first: '$listingId' },
            lastMessage: {
              $first: {
                content: '$content',
                createdAt: '$createdAt',
                senderId: '$senderId'
              }
            },
            messages: { $push: '$$ROOT' }
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
            localField: 'messages.senderId',
            foreignField: '_id',
            as: 'senders'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'messages.receiverId',
            foreignField: '_id',
            as: 'receivers'
          }
        },
        {
          $project: {
            _id: 1,
            listingId: 1,
            listing: {
              _id: '$listing._id',
              title: '$listing.title',
              image: { $arrayElemAt: ['$listing.images', 0] },
              price: '$listing.price',
              status: '$listing.status'
            },
            participants: {
              $setUnion: [
                {
                  $map: {
                    input: '$senders',
                    as: 'sender',
                    in: {
                      _id: '$$sender._id',
                      name: '$$sender.name',
                      avatar: '$$sender.avatar'
                    }
                  }
                },
                {
                  $map: {
                    input: '$receivers',
                    as: 'receiver',
                    in: {
                      _id: '$$receiver._id',
                      name: '$$receiver.name',
                      avatar: '$$receiver.avatar'
                    }
                  }
                }
              ]
            },
            lastMessage: 1,
            unreadCount: {
              $size: {
                $filter: {
                  input: '$messages',
                  as: 'msg',
                  cond: {
                    $and: [
                      { $eq: ['$$msg.receiverId', userId] },
                      { $eq: ['$$msg.read', false] }
                    ]
                  }
                }
              }
            }
          }
        }
      ])
      .toArray();

    // Format ObjectIds and dates for client
    const formattedConversations = messages.map(conv => ({
      ...conv,
      _id: conv._id.toString(),
      listingId: conv.listingId.toString(),
      listing: {
        ...conv.listing,
        _id: conv.listing._id.toString()
      },
      participants: conv.participants.map((p: { _id: ObjectId; name: string; avatar?: string }) => ({
        ...p,
        _id: p._id.toString()
      })),
      lastMessage: {
        ...conv.lastMessage,
        senderId: conv.lastMessage.senderId.toString(),
        createdAt: conv.lastMessage.createdAt.toISOString()
      }
    }));

    return NextResponse.json({ conversations: formattedConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get conversations' },
      { status: 500 }
    );
  }
} 