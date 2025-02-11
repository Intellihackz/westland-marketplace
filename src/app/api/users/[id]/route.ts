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
    const token = cookies().get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const client = await clientPromise;
    const db = client.db("unimarket");

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(params.id) },
      { projection: { password: 0 } } // Exclude password
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Format the user data for the client
    const formattedUser = {
      ...user,
      _id: user._id.toString(),
      // Ensure dates exist and are in ISO format, or use current date as fallback
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : new Date().toISOString()
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Get user error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
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
    if (decoded.userId !== params.id) {
      return NextResponse.json(
        { error: "Not authorized to update this profile" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("unimarket");

    const updates = await req.json();
    const allowedUpdates = [
      'name',
      'avatar',
      'phone',
      'bio'
    ];

    // Filter out any fields that aren't allowed to be updated
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedUpdates.includes(key))
    );

    // Add timestamps
    const now = new Date();
    const updateResult = await db.collection("users").updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: {
          ...filteredUpdates,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      }
    );

    if (!updateResult.matchedCount) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get updated user data
    const updatedUser = await db.collection("users").findOne(
      { _id: new ObjectId(params.id) },
      { projection: { password: 0 } }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to fetch updated user data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        ...updatedUser,
        _id: updatedUser._id.toString(),
        createdAt: updatedUser.createdAt ? new Date(updatedUser.createdAt).toISOString() : now.toISOString(),
        updatedAt: updatedUser.updatedAt ? new Date(updatedUser.updatedAt).toISOString() : now.toISOString()
      }
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
} 