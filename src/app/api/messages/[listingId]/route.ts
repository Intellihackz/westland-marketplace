import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

const JWT_SECRET = process.env.JWT_SECRET!;

// GET /api/messages/[listingId] - Get messages for a specific listing
export async function GET(
  req: NextRequest,
  { params }: { params: { listingId: string } }
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
    const userId = new ObjectId(decoded.userId);
    const listingId = new ObjectId(params.listingId);

    const client = await clientPromise;
    const db = client.db('unimarket');

    // Get all messages for this listing where user is either sender or receiver
    const messages = await db.collection('messages')
      .aggregate([
        {
          $match: {
            listingId,
            $or: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        },
        {
          $sort: { createdAt: 1 }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'senderId',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $unwind: '$sender'
        },
        {
          $lookup: {
            from: 'users',
            localField: 'receiverId',
            foreignField: '_id',
            as: 'receiver'
          }
        },
        {
          $unwind: '$receiver'
        },
        {
          $project: {
            _id: 1,
            content: 1,
            createdAt: 1,
            read: 1,
            sender: {
              _id: '$sender._id',
              name: '$sender.name',
              avatar: '$sender.avatar'
            },
            receiver: {
              _id: '$receiver._id',
              name: '$receiver.name',
              avatar: '$receiver.avatar'
            }
          }
        }
      ])
      .toArray();

    // Mark messages as read where the current user is the receiver
    await db.collection('messages').updateMany(
      {
        listingId,
        receiverId: userId,
        read: false
      },
      {
        $set: { read: true }
      }
    );

    // Format ObjectIds and dates for client
    const formattedMessages = messages.map(msg => ({
      ...msg,
      _id: msg._id.toString(),
      sender: {
        ...msg.sender,
        _id: msg.sender._id.toString()
      },
      receiver: {
        ...msg.receiver,
        _id: msg.receiver._id.toString()
      },
      createdAt: msg.createdAt.toISOString()
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
} 