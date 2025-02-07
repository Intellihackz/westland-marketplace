import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("unimarket");

    const listing = await db.collection("listings").findOne({
      _id: new ObjectId(params.id)
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error("Get listing error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = cookies().get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const client = await clientPromise;
    const db = client.db("unimarket");

    // Get the listing and verify ownership
    const listing = await db.collection("listings").findOne({
      _id: new ObjectId(params.id)
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    if (listing.seller._id.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Not authorized to edit this listing" },
        { status: 403 }
      );
    }

    const updates = await req.json();
    const allowedUpdates = [
      'title',
      'description',
      'price',
      'category',
      'condition',
      'images',
      'tags'
    ];

    // Filter out any fields that aren't allowed to be updated
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedUpdates.includes(key))
    );

    // Update the listing
    await db.collection("listings").updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: {
          ...filteredUpdates,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ message: "Listing updated successfully" });
  } catch (error) {
    console.error("Update listing error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 