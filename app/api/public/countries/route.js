/* app/api/public/countries/route.js */

import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Country from "@/app/models/country";

export const revalidate = 86400;

function jsonResponse(data, status = 200, headers = {}) {
  return NextResponse.json(data, {
    status,
    headers,
  });
}

/**
 * GET /api/public/countries
 *
 * Public use:
 * - Country dropdown
 * - Geo filter chips
 * - Currency display metadata
 *
 * Returns only active countries.
 */
export async function GET() {
  try {
    await connectDB();

    const countries = await Country.find({ status: "active" })
      .select({
        _id: 1,
        code: 1,
        name: 1,
        flag: 1,
        isPopular: 1,
        sortOrder: 1,
        currencyCode: 1,
        currencySymbol: 1,
        timezone: 1,
      })
      .sort({
        isPopular: -1,
        sortOrder: 1,
        name: 1,
      })
      .lean();

    return jsonResponse(
      {
        success: true,
        data: {
          countries,
          total: countries.length,
        },
      },
      200,
      {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    );
  } catch (error) {
    console.error("GET /api/public/countries error:", error);

    return jsonResponse(
      {
        success: false,
        error: "Failed to fetch countries.",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      500,
      {
        "Cache-Control": "no-store",
      },
    );
  }
}
