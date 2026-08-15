import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import LegalPage from "@/app/models/legalPage";

// ─── GET ALL PAGES ──────────────────────────────────────────────────────────
export async function GET(req) {
  try {
    await connectDB();
    const pages = await LegalPage.find({})
      .select("-content")
      .sort({ createdAt: -1 });
    return NextResponse.json({ pages }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

// ─── POST NEW PAGE (Yeh function missing tha) ───────────────────────────────
// ─── POST NEW PAGE ──────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Header se adminId lein
    let adminId = req.headers.get("x-user-id");

    /**
     * DUMMY ADMIN FIX:
     * Mongoose ko ObjectId chahiye hoti hai. Agar adminId valid hex string nahi hai,
     * toh hum usse null kar denge taake validation fail na ho.
     */
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(adminId);

    const newPage = new LegalPage({
      ...body,
      // Agar valid ID hai toh use karein, warna null (since auth abhi final nahi hai)
      updatedBy: isValidObjectId ? adminId : null,
    });

    await newPage.save();

    return NextResponse.json(
      { message: "Legal page created successfully.", page: newPage },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST Error:", error);

    // Duplicate Slug Error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A page with this slug already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create page." },
      { status: 400 },
    );
  }
}
