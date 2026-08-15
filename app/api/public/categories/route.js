import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Category from "@/app/models/category";
export const dynamic = "force-dynamic";
// 🔥 ISR: Cache this API response for 60 seconds (Super Fast for Public Navbars)
export const revalidate = 60;

/**
 * Helper function to convert flat category array into a Nested Tree Structure
 * Ideal for Navbars, Dropdowns, and Sidebars.
 */
function buildCategoryTree(categories) {
  const map = new Map();
  const roots = [];

  // Initialize mapping with empty children arrays
  categories.forEach((cat) => {
    map.set(cat._id.toString(), { ...cat, children: [] });
  });

  // Build the hierarchy
  categories.forEach((cat) => {
    const node = map.get(cat._id.toString());
    if (cat.parentId) {
      const parent = map.get(cat.parentId.toString());
      if (parent) {
        parent.children.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * GET /api/public/categories
 *
 * Query Params:
 * - type: 'blog' | 'store' | 'product' | 'general'
 * - tree: 'true' (returns nested structure instead of flat array)
 * - level: 0 | 1 | 2
 */
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");
    const tree = searchParams.get("tree") === "true";
    const level = searchParams.get("level");

    // Only fetch ACTIVE categories for the public frontend
    const query = { status: "active" };

    // Filter by specific module if requested
    if (type) {
      query.type = type;
    }

    // Filter by specific level if requested
    if (level !== null && level !== undefined) {
      query.level = Number(level);
    }

    // 🔥 Ultra-lean projection: Only fetch what the frontend actually needs
    const projection =
      "name slug icon type level parentId sortOrder uiConfig.themeColor";

    const categories = await Category.find(query)
      .select(projection)
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // If frontend requested a tree structure (e.g., for Navbars)
    if (tree) {
      const categoryTree = buildCategoryTree(categories);
      return NextResponse.json(
        { success: true, data: categoryTree },
        { status: 200 },
      );
    }

    // Default: Return flat array
    return NextResponse.json(
      { success: true, data: categories },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/public/categories Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load categories." },
      { status: 500 },
    );
  }
}
