/* app/api/admin/coupons/route.js */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import Coupon from "@/app/models/coupon";

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function normalizeCouponPayload(body = {}) {
  const payload = {
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
        : new Date()
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

  return payload;
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = toNumber(searchParams.get("page"), 1);
    const limit = Math.min(toNumber(searchParams.get("limit"), 10), 100);

    const storeId = searchParams.get("storeId");
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const codeType = searchParams.get("codeType");
    const discountType = searchParams.get("discountType");
    const countryCode = searchParams.get("countryCode");
    const isVerified = searchParams.get("isVerified");
    const isExclusive = searchParams.get("isExclusive");
    const isPinned = searchParams.get("isPinned");
    const search = searchParams.get("search");

    const query = {};

    if (storeId && mongoose.Types.ObjectId.isValid(storeId)) {
      query.storeId = storeId;
    }

    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.categoryId = categoryId;
    }

    if (status) query.status = status;
    if (type) query.type = type;
    if (codeType) query.codeType = codeType;
    if (discountType) query.discountType = discountType;
    if (countryCode) query.countryCode = countryCode.toUpperCase();

    if (isVerified === "true") query.isVerified = true;
    if (isVerified === "false") query.isVerified = false;

    if (isExclusive === "true") query.isExclusive = true;
    if (isExclusive === "false") query.isExclusive = false;

    if (isPinned === "true") query.isPinned = true;
    if (isPinned === "false") query.isPinned = false;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subtitle: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { terms: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate("storeId", "name slug")
        .populate("categoryId", "name slug")
        .populate("secondaryCategoryIds", "name slug")
        .sort({ isPinned: -1, sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Coupon.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        coupons,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /admin/coupons Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch coupons." },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const payload = normalizeCouponPayload(body);

    const coupon = await Coupon.create(payload);

    return NextResponse.json(
      {
        message: "Coupon created successfully.",
        coupon,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /admin/coupons Error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to create coupon.",
      },
      { status: 400 },
    );
  }
}
