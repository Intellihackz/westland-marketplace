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
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("unimarket");

    // Get the auth token to determine if this is the user's own profile
    const token = cookies().get('auth-token')?.value;
    const isOwnProfile = token ? 
      (jwt.verify(token, JWT_SECRET) as { userId: string }).userId === params.id 
      : false;

    // Define which fields to return based on whether it's the user's own profile
    const projection = isOwnProfile
      ? { password: 0 } // Exclude only password for own profile
      : {
          password: 0,
          email: 0,
          phone: 0, // Hide private information for other users
        };

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(params.id) },
      { projection }
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
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : new Date().toISOString()
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error("Get user error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      // Continue with public profile view if token is invalid
      return NextResponse.json(
        { error: "Invalid token, proceeding with public view" },
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