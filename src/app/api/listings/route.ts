import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    // Verify authentication
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

    // Get user
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(decoded.userId) }
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { title, description, price, category, condition, images, tags } = await req.json();

    // Validate input
    if (!title || !description || !price || !category || !condition || !images?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate platform fee (1%)
    const platformFeePercentage = 0.01;
    const maxPlatformFee = 1000; // Maximum platform fee capped at ₦1000
    const calculatedFee = price * platformFeePercentage;
    const platformFee = Math.min(calculatedFee, maxPlatformFee); // Cap the fee at ₦1000
    const sellerAmount = price - platformFee;

    // Create listing
    const result = await db.collection("listings").insertOne({
      title,
      description,
      price,
      platformFee,
      sellerAmount,
      category,
      condition,
      images,
      tags: tags || [],
      seller: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Track platform fee
    await db.collection("platform_fees").insertOne({
      listingId: result.insertedId,
      sellerId: user._id,
      amount: platformFee,
      status: 'pending', // Will be updated to 'collected' when the item is sold
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      message: "Listing created successfully",
      listingId: result.insertedId,
    });
  } catch (error) {
    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const query = searchParams.get('query');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const client = await clientPromise;
    const db = client.db("unimarket");

    // Build query
    const filter: any = { status: 'active' };
    if (category) filter.category = category;
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ];
    }

    // Get listings
    const listings = await db.collection("listings")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await db.collection("listings").countDocuments(filter);

    return NextResponse.json({
      listings,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get listings error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 