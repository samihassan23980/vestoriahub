
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

const PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

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

// Only authorized management roles can inspect
// other employees' activity.
const VIEW_ROLES = new Set([
  "admin",
  "manager",
]);

function errorResponse(message, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseDate(value, endOfDay = false) {
  if (!value) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function encodeCursor(log) {
  return Buffer.from(
    JSON.stringify({
      date: new Date(log.occurredAt).toISOString(),
      id: String(log._id),
    })
  ).toString("base64url");
}

function decodeCursor(value) {
  if (!value || value.length > 512) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    );

    const date = new Date(parsed.date);

    if (
      !validId(parsed.id) ||
      Number.isNaN(date.getTime())
    ) {
      return null;
    }

    return {
      date,
      id: new mongoose.Types.ObjectId(parsed.id),
    };
  } catch {
    return null;
  }
}

async function authenticate(req) {
  const token = req.cookies.get(
    ADMIN_SESSION_COOKIE
  )?.value;

  if (!token) {
    return {
      error: errorResponse("Authentication required.", 401),
    };
  }

  const session = await verifyAdminSession(token);

  if (!session?.userId || !validId(session.userId)) {
    return {
      error: errorResponse("Invalid session.", 401),
    };
  }

  const user = await User.findById(session.userId)
    .select("_id name email role status")
    .lean();

  if (!user || user.status === "disabled") {
    return {
      error: errorResponse("Account unavailable.", 403),
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
        "You do not have permission to view employee activity.",
        403
      ),
    };
  }

  return { user };
}

export async function GET(req, { params }) {
  try {
    await connectDB();

    const auth = await authenticate(req);

    if (auth.error) return auth.error;

    const { id } = await params;

    if (!validId(id)) {
      return errorResponse("Invalid employee ID.");
    }

    const employee = await User.findById(id)
      .select("_id name email role status")
      .lean();

    if (!employee) {
      return errorResponse("Employee not found.", 404);
    }

    const { searchParams } = new URL(req.url);

    const moduleFilter =
      searchParams.get("module") || "all";

    const actionFilter =
      searchParams.get("action") || "all";

    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const cursorParam = searchParams.get("cursor");

    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(
        1,
        Number.parseInt(
          searchParams.get("limit") || String(PAGE_SIZE),
          10
        ) || PAGE_SIZE
      )
    );

    if (
      moduleFilter !== "all" &&
      !ALLOWED_MODULES.has(moduleFilter)
    ) {
      return errorResponse("Invalid module filter.");
    }

    if (
      actionFilter !== "all" &&
      !ALLOWED_ACTIONS.has(actionFilter)
    ) {
      return errorResponse("Invalid action filter.");
    }

    const fromDate = from ? parseDate(from) : null;
    const toDate = to ? parseDate(to, true) : null;

    if (
      (from && !fromDate) ||
      (to && !toDate) ||
      (fromDate && toDate && fromDate > toDate)
    ) {
      return errorResponse("Invalid date range.");
    }

    const employeeObjectId =
      new mongoose.Types.ObjectId(id);

    const baseFilter = {
      actorId: employeeObjectId,
    };

    if (moduleFilter !== "all") {
      baseFilter.module = moduleFilter;
    }

    if (actionFilter !== "all") {
      baseFilter.action = actionFilter;
    }

    if (fromDate || toDate) {
      baseFilter.occurredAt = {};

      if (fromDate) {
        baseFilter.occurredAt.$gte = fromDate;
      }

      if (toDate) {
        baseFilter.occurredAt.$lte = toDate;
      }
    }

    // Cursor applies only to the history query.
    // Statistics always reflect the complete filtered range.
    const historyFilter = { ...baseFilter };

    if (cursorParam) {
      const cursor = decodeCursor(cursorParam);

      if (!cursor) {
        return errorResponse("Invalid activity cursor.");
      }

      historyFilter.$or = [
        {
          occurredAt: { $lt: cursor.date },
        },
        {
          occurredAt: cursor.date,
          _id: { $lt: cursor.id },
        },
      ];
    }

    const [rows, stats] = await Promise.all([
      ActivityLog.find(historyFilter)
        .select(
          "_id actorId actorName actorEmail actorRole module action targetId targetName targetSlug targetUrl changes occurredAt"
        )
        .sort({ occurredAt: -1, _id: -1 })
        .limit(limit + 1)
        .lean(),

      ActivityLog.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: {
              module: "$module",
              action: "$action",
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const hasMore = rows.length > limit;
    const logs = rows.slice(0, limit);

    const summary = {
      total: 0,
      modules: {
        store: 0,
        coupon: 0,
        blog: 0,
      },
      actions: {},
    };

    for (const item of stats) {
      const count = item.count || 0;

      summary.total += count;

      if (
        Object.prototype.hasOwnProperty.call(
          summary.modules,
          item._id.module
        )
      ) {
        summary.modules[item._id.module] += count;
      }

      const action = item._id.action;

      if (action) {
        summary.actions[action] =
          (summary.actions[action] || 0) + count;
      }
    }

    return NextResponse.json(
      {
        success: true,
        employee,
        summary,
        logs,
        hasMore,
        nextCursor:
          hasMore && logs.length
            ? encodeCursor(logs[logs.length - 1])
            : null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Employee Activity API Error:",
      error
    );

    return errorResponse(
      "Failed to load employee activity.",
      500
    );
  }
}
