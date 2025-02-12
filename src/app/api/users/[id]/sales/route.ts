import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

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

    // Get all released payments where user is the seller
    const result = await db.collection("payments").aggregate([
      {
        $match: {
          sellerId: new ObjectId(params.id),
          status: "released"  // Only count completed sales
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$amount" },
          completedSales: { $sum: 1 }
        }
      }
    ]).toArray();

    const salesData = result[0] || { totalSales: 0, completedSales: 0 };

    // Get pending payments (held in escrow)
    const pendingResult = await db.collection("payments").aggregate([
      {
        $match: {
          sellerId: new ObjectId(params.id),
          status: "held"  // Payments in escrow
        }
      },
      {
        $group: {
          _id: null,
          pendingAmount: { $sum: "$amount" },
          pendingSales: { $sum: 1 }
        }
      }
    ]).toArray();

    const pendingData = pendingResult[0] || { pendingAmount: 0, pendingSales: 0 };

    return NextResponse.json({
      totalSales: salesData.totalSales,
      completedSales: salesData.completedSales,
      pendingAmount: pendingData.pendingAmount,
      pendingSales: pendingData.pendingSales
    });
  } catch (error) {
    console.error("Get sales error:", error);
    return NextResponse.json(
      { error: "Failed to get sales data" },
      { status: 500 }
    );
  }
} 