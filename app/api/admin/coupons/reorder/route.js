import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import Coupon from "@/app/models/coupon";
import { connectDB } from "@/app/lib/mongodb";

export async function PATCH(req) {
  try {
    await connectDB();
    const { items, storeSlug } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid payload. 'items' array required." },
        { status: 400 }
      );
    }

    // Bulk Write for fast sequential index update
    const bulkOperations = items.map((item, index) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { sortOrder: index + 1 } },
      },
    }));

    await Coupon.bulkWrite(bulkOperations);

    // Revalidate public page caches
    revalidateTag("stores");
    if (storeSlug) {
      revalidateTag(`store-${storeSlug}`);
    }

    return NextResponse.json(
      { message: "Coupon sorting updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /admin/coupons/reorder Error:", error);
    return NextResponse.json(
      { error: "Failed to reorder coupons." },
      { status: 500 }
    );
  }
}