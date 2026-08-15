import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import LegalPage from "@/app/models/legalPage";
import { revalidatePath } from "next/cache";

/**
 * @route   GET /api/admin/legal/[id]
 * @desc    Get a single page data for the editor (Yeh missing tha)
 */

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    // FIX: Populate ko remove kar diya hai kyunke User model abhi registered nahi hai
    const legalPage = await LegalPage.findById(id);

    if (!legalPage) {
      return NextResponse.json(
        { error: "Legal page not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(legalPage, { status: 200 });
  } catch (error) {
    console.error("GET Single Page Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

/**
 * @route   PUT /api/admin/legal/[id]
 * @desc    Update an existing legal/static page
 */
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const adminId = req.headers.get("x-user-id");

    const legalPage = await LegalPage.findById(id);
    if (!legalPage) {
      return NextResponse.json(
        { error: "Legal page not found." },
        { status: 404 },
      );
    }

    // ─── 1. PROTECTION LOGIC ───────────────────────────────────────────
    if (legalPage.isSystemPage) {
      delete body.slug;
      delete body.type;
      delete body.isSystemPage;
    }

    // ─── 2. DUMMY ADMIN CHECK ──────────────────────────────────────────
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(adminId);

    // ─── 3. UPDATE EXECUTION ──────────────────────────────────────────
    Object.assign(legalPage, body);

    if (isValidObjectId) {
      legalPage.updatedBy = adminId;
    }

    await legalPage.save();

    // ─── 4. CACHE PURGING ──────────────────────────────────────────────
    revalidatePath(`/legal/${legalPage.slug}`);
    revalidatePath("/legal");

    return NextResponse.json(
      { message: "Legal page updated successfully.", page: legalPage },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update legal page." },
      { status: 400 },
    );
  }
}

/**
 * @route   DELETE /api/admin/legal/[id]
 * @desc    Securely delete non-system pages.
 */
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const legalPage = await LegalPage.findById(id);

    if (!legalPage) {
      return NextResponse.json(
        { error: "Legal page not found." },
        { status: 404 },
      );
    }

    if (legalPage.isSystemPage) {
      return NextResponse.json(
        { error: "Action Forbidden: This is a system-critical page." },
        { status: 403 },
      );
    }

    await legalPage.deleteOne();
    revalidatePath("/legal");

    return NextResponse.json(
      { message: "Legal page deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
