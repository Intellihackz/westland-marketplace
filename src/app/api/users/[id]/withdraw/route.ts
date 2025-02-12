import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { initiateTransfer } from "@/lib/paystack";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(
  req: NextRequest,
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
    
    // Verify user is withdrawing from their own account
    if (decoded.userId !== params.id) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const { amount, bankDetails } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!bankDetails?.accountName || !bankDetails?.accountNumber || !bankDetails?.bankName) {
      return NextResponse.json(
        { error: "Missing bank details" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("unimarket");

    // Get user's available balance
    const result = await db.collection("payments").aggregate([
      {
        $match: {
          sellerId: new ObjectId(params.id),
          status: "released"
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$amount" }
        }
      }
    ]).toArray();

    const totalSales = result[0]?.totalSales || 0;

    // Get total withdrawals
    const withdrawalsResult = await db.collection("withdrawals").aggregate([
      {
        $match: {
          userId: new ObjectId(params.id),
          status: { $in: ["pending", "completed"] }
        }
      },
      {
        $group: {
          _id: null,
          totalWithdrawn: { $sum: "$amount" }
        }
      }
    ]).toArray();

    const totalWithdrawn = withdrawalsResult[0]?.totalWithdrawn || 0;
    const availableBalance = totalSales - totalWithdrawn;

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create withdrawal record
    const withdrawal = {
      userId: new ObjectId(params.id),
      amount,
      bankDetails,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const { insertedId } = await db.collection("withdrawals").insertOne(withdrawal);

    // Initiate transfer with Paystack
    try {
      await initiateTransfer(amount, bankDetails, insertedId.toString());
      
      return NextResponse.json({
        message: "Withdrawal request submitted successfully"
      });
    } catch (error) {
      // If transfer initiation fails, mark withdrawal as failed
      await db.collection("withdrawals").updateOne(
        { _id: insertedId },
        { 
          $set: { 
            status: "failed",
            error: error instanceof Error ? error.message : "Transfer initiation failed",
            updatedAt: new Date()
          } 
        }
      );

      throw error;
    }
  } catch (error) {
    console.error("Withdrawal error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process withdrawal" },
      { status: 500 }
    );
  }
} 