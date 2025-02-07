import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(
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

    // Get listing and check if it's available
    const listing = await db.collection("listings").findOne({
      _id: new ObjectId(params.id),
      status: 'active'
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found or not available" },
        { status: 404 }
      );
    }

    // Check if buyer is not the seller
    if (listing.seller._id.toString() === decoded.userId) {
      return NextResponse.json(
        { error: "You cannot buy your own listing" },
        { status: 400 }
      );
    }

    // Update listing status
    await db.collection("listings").updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          status: 'sold',
          buyer: {
            _id: new ObjectId(decoded.userId),
            purchasedAt: new Date()
          }
        } 
      }
    );

    return NextResponse.json({ message: "Purchase successful" });
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 