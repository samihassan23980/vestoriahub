import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import LegalPage from "@/app/models/legalPage";

/**
 * @route   GET /api/public/legal-links
 * @desc    Fetch published legal pages (Core & Custom) for Footer navigation.
 *          Small payload, high-speed delivery with stale-while-revalidate caching.
 */
export async function GET() {
  try {
    // 1. Establish Database Connection
    await connectDB();

    /**
     * 2. Fetch Published Pages
     * - select('title slug type'): Hum sirf zaroori fields mangwa rahe hain.
     * - lean(): Mongoose overhead ko hatata hai for faster response.
     */
    const pages = await LegalPage.find({ status: "published" })
      .select("title slug type -_id") // _id remove kar diya bundle size kam karne ke liye
      .sort({ type: 1 }) // System pages (types like about, privacy) ko priority sorting mil sakti hai
      .lean();

    /**
     * 3. Response Strategy:
     * Hum Array hi return karenge taake Footer component .map() aur .find()
     * dono asani se kar sake (For both Core and Custom pages).
     */
    return NextResponse.json(pages, {
      status: 200,
      headers: {
        // Cache management: 1 hr public cache, background revalidation
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Public Legal API Failure:", error);
    return NextResponse.json(
      { error: "Content currently unavailable." },
      { status: 500 },
    );
  }
}
