import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import AmazonDeal from "@/app/models/amazonDeal";

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const body = await req.json();

    const deal = await AmazonDeal.findById(params.id);
    if (!deal) {
      return NextResponse.json(
        { error: "Amazon deal not found." },
        { status: 404 },
      );
    }

    Object.assign(deal, body);

    // Important: Using .save() here ensures the pre-save hook runs.
    // If originalPrice or dealPrice was changed in 'body', the hook will
    // recalculate 'discountPercentage' automatically before saving to DB.
    await deal.save();

    return NextResponse.json(
      { message: "Amazon deal updated successfully.", deal },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /admin/amazon-deals/[id] Error:", error);

    if (error.code === 11000) {
      if (error.keyPattern?.slug)
        return NextResponse.json(
          { error: "URL slug must be unique." },
          { status: 409 },
        );
      if (error.keyPattern?.asin)
        return NextResponse.json(
          { error: "A deal with this ASIN already exists." },
          { status: 409 },
        );
    }

    return NextResponse.json(
      { error: error.message || "Failed to update Amazon deal." },
      { status: 400 },
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const deletedDeal = await AmazonDeal.findByIdAndDelete(params.id);

    if (!deletedDeal) {
      return NextResponse.json(
        { error: "Amazon deal not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Amazon deal deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /admin/amazon-deals/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete Amazon deal." },
      { status: 500 },
    );
  }
}
