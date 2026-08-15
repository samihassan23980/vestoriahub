/* app/api/admin/coupons/[id]/route.js */
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache"; // ✅ Imported revalidateTag
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Coupon from "@/app/models/coupon";

function normalizeCouponPayload(body = {}) {
  return {
    title: body.title,
    subtitle: body.subtitle || "",
    terms: body.terms || "",

    trackingLink: body.trackingLink,

    type: body.type,
    codeType: body.codeType,
    code: body.code || "",

    discountType: body.discountType,
    discountValue: Number(body.discountValue ?? 0),
    maxDiscountCap:
      body.maxDiscountCap === "" || body.maxDiscountCap == null
        ? null
        : Number(body.maxDiscountCap),
    minOrderValue: Number(body.minOrderValue ?? 0),

    expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
    status: body.status || "active",

    isVerified: Boolean(body.isVerified),
    verifiedAt: body.isVerified
      ? body.verifiedAt
        ? new Date(body.verifiedAt)
        : undefined
      : null,

    isExclusive: Boolean(body.isExclusive),
    countryCode: body.countryCode || "GLOBAL",

    sortOrder:
      body.sortOrder === "" || body.sortOrder == null
        ? 1000
        : Number(body.sortOrder),

    isPinned: Boolean(body.isPinned),

    storeId: body.storeId,
    categoryId: body.categoryId,

    secondaryCategoryIds: Array.isArray(body.secondaryCategoryIds)
      ? body.secondaryCategoryIds.filter(Boolean)
      : [],
  };
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid coupon ID." },
        { status: 400 },
      );
    }

    const coupon = await Coupon.findById(id)
      .populate("storeId", "name slug")
      .populate("categoryId", "name slug")
      .populate("secondaryCategoryIds", "name slug")
      .lean();

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    return NextResponse.json({ coupon }, { status: 200 });
  } catch (error) {
    console.error("GET /admin/coupons/[id] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch coupon." },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid coupon ID." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const payload = normalizeCouponPayload(body);

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    Object.assign(coupon, payload);

    await coupon.save();

    const updatedCoupon = await Coupon.findById(id)
      .populate("storeId", "name slug")
      .populate("categoryId", "name slug")
      .populate("secondaryCategoryIds", "name slug")
      .lean();

    // ✅ Clear the cache so public pages show the edited coupon instantly
    revalidateTag("stores");
    if (updatedCoupon.storeId?.slug) {
      revalidateTag(`store-${updatedCoupon.storeId.slug}`);
    }

    return NextResponse.json(
      {
        message: "Coupon updated successfully.",
        coupon: updatedCoupon,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /admin/coupons/[id] Error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to update coupon.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid coupon ID." },
        { status: 400 },
      );
    }

    // Populate storeId so we can get the slug for cache revalidation before deleting
    const deletedCoupon = await Coupon.findByIdAndDelete(id).populate("storeId", "slug");

    if (!deletedCoupon) {
      return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    }

    // ✅ Clear the cache so the deleted coupon disappears from public pages instantly
    revalidateTag("stores");
    if (deletedCoupon.storeId?.slug) {
      revalidateTag(`store-${deletedCoupon.storeId.slug}`);
    }

    return NextResponse.json(
      { message: "Coupon deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /admin/coupons/[id] Error:", error);

    return NextResponse.json(
      { error: "Failed to delete coupon." },
      { status: 500 },
    );
  }
}