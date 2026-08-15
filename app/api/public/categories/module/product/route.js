import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import Category from "@/app/models/category";

// Next.js Route Config: Dynamic route for searchParams
export const dynamic = "force-dynamic";

// Module Type definition
const MODULE_TYPE = "product";

function buildCategoryTree(categories) {
  const map = new Map();
  const roots = [];

  // Step 1: Map all nodes
  categories.forEach((cat) => {
    map.set(cat._id.toString(), { ...cat, children: [] });
  });

  // Step 2: Connect parent-child references
  categories.forEach((cat) => {
    const node = map.get(cat._id.toString());
    if (cat.parentId) {
      const parent = map.get(cat.parentId.toString());
      if (parent) {
        parent.children.push(node);
      } else {
        // Fallback: If parent is inactive or excluded by query, treat as root
        roots.push(node);
      }
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

    const isTreeRequested = searchParams.get("tree") === "true";
    const levelParam = searchParams.get("level");
    const limitParam = searchParams.get("limit");

    // Default limit: tree request ke waqt pagination avoid karein taake internal branches na toot'tein
    const limit = limitParam ? parseInt(limitParam, 10) : isTreeRequested ? 1000 : 100;

    // Build Query
    const query = {
      status: "active",
      type: MODULE_TYPE,
    };

    // Strict level checking
    if (levelParam !== null && levelParam !== undefined && levelParam !== "") {
      query.level = Number(levelParam);
    }

    const projection =
      "name slug icon type level parentId ancestors sortOrder image uiConfig.themeColor";

    const categories = await Category.find(query)
      .select(projection)
      .sort({ level: 1, sortOrder: 1, name: 1 })
      .limit(limit)
      .lean();

    // Map _id to string for clean serialization
    const normalizedCategories = categories.map((cat) => ({
      ...cat,
      _id: cat._id.toString(),
      parentId: cat.parentId ? cat.parentId.toString() : null,
    }));

    let responseData = normalizedCategories;

    // Tree transformation executes when tree=true and level filter is NOT applied
    if (isTreeRequested && levelParam === null) {
      responseData = buildCategoryTree(normalizedCategories);
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
      }
    );
  } catch (error) {
    console.error(
      `GET /api/public/categories/module/${MODULE_TYPE} Error:`,
      error
    );
    return NextResponse.json(
      { success: false, error: `Failed to load ${MODULE_TYPE} categories.` },
      { status: 500 }
    );
  }
}