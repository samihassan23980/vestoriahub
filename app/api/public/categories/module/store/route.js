import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Category from "@/app/models/category";

// 🔥 ISR: Cache this API response for 60 seconds
export const revalidate = 60;
export const dynamic = "force-dynamic";
// Hardcoded Module Type for this specific route
const MODULE_TYPE = "store";

function buildCategoryTree(categories) {
  const map = new Map();
  const roots = [];

  categories.forEach((cat) => {
    map.set(cat._id.toString(), { ...cat, children: [] });
  });

  categories.forEach((cat) => {
    const node = map.get(cat._id.toString());
    if (cat.parentId) {
      const parent = map.get(cat.parentId.toString());
      if (parent) parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const tree = searchParams.get("tree") === "true";
    const level = searchParams.get("level");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Build Query specifically for "blog"
    const query = {
      status: "active",
      type: MODULE_TYPE,
    };

    if (level !== null && level !== undefined) {
      query.level = Number(level);
    }

    const projection =
      "name slug icon type level parentId sortOrder image uiConfig.themeColor";

    const categories = await Category.find(query)
      .select(projection)
      .sort({ sortOrder: 1, name: 1 })
      .limit(limit)
      .lean();

    let responseData = categories;

    if (tree && level === null) {
      responseData = buildCategoryTree(categories);
    }

    return NextResponse.json(
      {
        success: true,
        module: MODULE_TYPE,
        count: responseData.length,
        data: responseData,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error(
      `GET /api/public/categories/module/${MODULE_TYPE} Error:`,
      error,
    );
    return NextResponse.json(
      { success: false, error: `Failed to load ${MODULE_TYPE} categories.` },
      { status: 500 },
    );
  }
}
