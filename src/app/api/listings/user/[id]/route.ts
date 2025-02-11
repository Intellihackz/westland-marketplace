import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("unimarket");

    // Validate user ID
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const userId = new ObjectId(params.id);

    // Get user's listings
    const listings = await db.collection('listings')
      .find({
        'seller._id': userId,
        status: { $in: ['active', 'sold'] }  // Only get active and sold listings
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Format dates and IDs for client
    const formattedListings = listings.map(listing => ({
      ...listing,
      _id: listing._id.toString(),
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      seller: {
        ...listing.seller,
        _id: listing.seller._id.toString()
      }
    }));

    return NextResponse.json({ listings: formattedListings });
  } catch (error) {
    console.error('Failed to fetch user listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
} 