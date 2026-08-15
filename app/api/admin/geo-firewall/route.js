import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import GeoFirewall from "@/app/models/geoFirewall";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page")) || 1);
    const limit = Math.max(1, parseInt(searchParams.get("limit")) || 20);
    const status = searchParams.get("status");
    const blockType = searchParams.get("blockType");
    const search = searchParams.get("search");

    const query = {};
    if (status && ["active", "inactive"].includes(status))
      query.status = status;
    if (blockType) query.blockType = blockType;

    if (search) {
      // Prevent regex DOS attacks by escaping special characters
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { ruleName: { $regex: safeSearch, $options: "i" } },
        { value: { $regex: safeSearch, $options: "i" } },
      ];
    }

    // Populate hata diya hai taake User Schema ka error na aaye
    const rulesRaw = await GeoFirewall.find(query)
      .sort({ status: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ─── DUMMY ADMIN INJECTION ───
    // Frontend ko lagay ga ke user data backend se hi aaya hai
    const rules = rulesRaw.map((rule) => ({
      ...rule,
      updatedBy: {
        _id: "dummy_admin_id",
        name: "Admin (Dummy)",
        email: "admin@sociantech.com",
      },
    }));

    const total = await GeoFirewall.countDocuments(query);

    return NextResponse.json(
      {
        success: true,
        data: { rules, total, page, totalPages: Math.ceil(total / limit) },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[GET_FIREWALL_ADMIN_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error while fetching rules." },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Basic required field validation
    if (!body.ruleName || !body.blockType || !body.value) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: ruleName, blockType, or value.",
        },
        { status: 400 },
      );
    }

    // Hum updatedBy ko intentionally null set kar rahe hain taake
    // Mongoose isey invalid ObjectId samajh kar crash na kare.
    const newRule = new GeoFirewall({
      ...body,
      updatedBy: null,
    });

    await newRule.save();

    return NextResponse.json(
      { success: true, message: "Firewall rule created.", data: newRule },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST_FIREWALL_ADMIN_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create rule." },
      { status: 400 },
    );
  }
}

export async function DELETE(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "No rule IDs provided for deletion." },
        { status: 400 },
      );
    }

    // Delete all matching IDs
    const result = await GeoFirewall.deleteMany({
      _id: { $in: body.ids },
    });

    return NextResponse.json(
      { success: true, message: `Deleted ${result.deletedCount} rules.` },
      { status: 200 },
    );
  } catch (error) {
    console.error("[DELETE_FIREWALL_ADMIN_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete rules." },
      { status: 500 },
    );
  }
}
