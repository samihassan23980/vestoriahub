
import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/app/lib/mongodb";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from "@/app/lib/authSession";

import User from "@/app/models/user";
import ActivityLog from "@/app/models/activityLog";

export const dynamic = "force-dynamic";

const ALLOWED_MODULES = new Set([
  "store",
  "coupon",
  "blog",
]);

const ALLOWED_ACTIONS = new Set([
  "created",
  "updated",
  "deleted",
  "published",
  "unpublished",
]);

// Restrict employee-wide activity visibility.
const VIEW_ROLES = new Set([
  "admin",
  "manager",
]);

function errorResponse(message, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function getDateRange(searchParams) {
  const period =
    searchParams.get("period") || "today";

  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "7days") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === "custom") {
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(from || "") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(to || "")
    ) {
      throw new Error(
        "Custom range requires valid from and to dates."
      );
    }

    const parsedStart = parseDate(
      `${from}T00:00:00.000Z`
    );

    const parsedEnd = parseDate(
      `${to}T23:59:59.999Z`
    );

    if (!parsedStart || !parsedEnd) {
      throw new Error(
        "Invalid custom date range."
      );
    }

    if (parsedStart > parsedEnd) {
      throw new Error(
        "Start date cannot be after end date."
      );
    }

    return {
      start: parsedStart,
      end: parsedEnd,
    };
  } else {
    throw new Error(
      "Invalid activity period."
    );
  }

  return { start, end };
}

async function authenticate(req) {
  const token = req.cookies.get(
    ADMIN_SESSION_COOKIE
  )?.value;

  if (!token) {
    return {
      error: errorResponse(
        "Authentication required.",
        401
      ),
    };
  }

  const session =
    await verifyAdminSession(token);

  if (
    !session?.userId ||
    !mongoose.Types.ObjectId.isValid(
      session.userId
    )
  ) {
    return {
      error: errorResponse(
        "Invalid or expired session.",
        401
      ),
    };
  }

  const user = await User.findById(
    session.userId
  )
    .select("_id name email role status")
    .lean();

  if (!user || user.status === "disabled") {
    return {
      error: errorResponse(
        "Account unavailable.",
        401
      ),
    };
  }

  if (user.role !== session.role) {
    return {
      error: errorResponse(
        "Permissions changed. Sign in again.",
        401
      ),
    };
  }

  if (!VIEW_ROLES.has(user.role)) {
    return {
      error: errorResponse(
        "Access denied.",
        403
      ),
    };
  }

  return { user };
}

export async function GET(req) {
  try {
    await connectDB();

    const auth = await authenticate(req);

    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(
      req.url
    );

    let dateRange;

    try {
      dateRange = getDateRange(
        searchParams
      );
    } catch (error) {
      return errorResponse(
        error.message,
        400
      );
    }

    const page = Math.max(
      1,
      parseInt(
        searchParams.get("page") || "1",
        10
      ) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        parseInt(
          searchParams.get("limit") || "20",
          10
        ) || 20
      )
    );

    const module =
      searchParams.get("module") || "all";

    const action =
      searchParams.get("action") || "all";

    const employeeId =
      searchParams.get("employeeId") || "";

    if (
      module !== "all" &&
      !ALLOWED_MODULES.has(module)
    ) {
      return errorResponse(
        "Invalid module.",
        400
      );
    }

    if (
      action !== "all" &&
      !ALLOWED_ACTIONS.has(action)
    ) {
      return errorResponse(
        "Invalid action.",
        400
      );
    }

    if (
      employeeId &&
      !mongoose.Types.ObjectId.isValid(
        employeeId
      )
    ) {
      return errorResponse(
        "Invalid employee ID.",
        400
      );
    }

    const baseMatch = {
      occurredAt: {
        $gte: dateRange.start,
        $lte: dateRange.end,
      },
    };

    if (module !== "all") {
      baseMatch.module = module;
    }

    if (action !== "all") {
      baseMatch.action = action;
    }

    if (employeeId) {
      baseMatch.actorId =
        new mongoose.Types.ObjectId(
          employeeId
        );
    }

    const skip = (page - 1) * limit;

    const [
      logs,
      total,
      moduleStats,
      employeeStats,
      actionStats,
    ] = await Promise.all([
      ActivityLog.find(baseMatch)
        .sort({
          occurredAt: -1,
          _id: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      ActivityLog.countDocuments(
        baseMatch
      ),

      ActivityLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: "$module",
            count: { $sum: 1 },
          },
        },
      ]),

      ActivityLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              actorId: "$actorId",
              actorName: "$actorName",
              actorEmail: "$actorEmail",
            },

            total: { $sum: 1 },

            stores: {
              $sum: {
                $cond: [
                  { $eq: ["$module", "store"] },
                  1,
                  0,
                ],
              },
            },

            coupons: {
              $sum: {
                $cond: [
                  { $eq: ["$module", "coupon"] },
                  1,
                  0,
                ],
              },
            },

            blogs: {
              $sum: {
                $cond: [
                  { $eq: ["$module", "blog"] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { total: -1 } },
      ]),

      ActivityLog.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const moduleCounts = {
      store: 0,
      coupon: 0,
      blog: 0,
    };

    for (const item of moduleStats) {
      if (item._id in moduleCounts) {
        moduleCounts[item._id] =
          item.count;
      }
    }

    const actionCounts = {
      created: 0,
      updated: 0,
      deleted: 0,
      published: 0,
      unpublished: 0,
    };

    for (const item of actionStats) {
      if (item._id in actionCounts) {
        actionCounts[item._id] =
          item.count;
      }
    }

    const employees = employeeStats.map(
      (item) => ({
        employeeId:
          item._id.actorId
            ? String(item._id.actorId)
            : "",

        name:
          item._id.actorName ||
          "Unknown Employee",

        email:
          item._id.actorEmail || "",

        stores: item.stores,
        coupons: item.coupons,
        blogs: item.blogs,
        total: item.total,
      })
    );

    return NextResponse.json({
      success: true,

      logs,

      summary: {
        total,
        modules: moduleCounts,
        actions: actionCounts,
      },

      employees,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(
          1,
          Math.ceil(total / limit)
        ),
      },

      dateRange: {
        from:
          dateRange.start.toISOString(),
        to:
          dateRange.end.toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "GET activity logs:",
      error
    );

    return errorResponse(
      "Failed to load activity logs.",
      500
    );
  }
}
