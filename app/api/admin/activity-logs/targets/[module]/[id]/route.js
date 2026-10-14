
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

const MODULES = new Set(["store", "coupon", "blog"]);
const ROLES = new Set(["admin", "manager"]);
const LIMIT = 30;

function fail(message, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

async function authenticate(req) {
  const token = req.cookies.get(
    ADMIN_SESSION_COOKIE
  )?.value;

  if (!token) return fail("Login required.", 401);

  const session = await verifyAdminSession(token);

  if (
    !session?.userId ||
    !mongoose.isValidObjectId(session.userId)
  ) {
    return fail("Invalid session.", 401);
  }

  const user = await User.findById(session.userId)
    .select("role status")
    .lean();

  if (!user || user.status === "disabled") {
    return fail("Account unavailable.", 403);
  }

  if (user.role !== session.role) {
    return fail("Session permissions changed.", 401);
  }

  if (!ROLES.has(user.role)) {
    return fail("Access denied.", 403);
  }

  return null;
}

function decodeCursor(value) {
  try {
    if (!value || value.length > 512) return null;

    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    );

    const date = new Date(parsed.date);

    if (
      Number.isNaN(date.getTime()) ||
      !mongoose.isValidObjectId(parsed.id)
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

function encodeCursor(log) {
  return Buffer.from(
    JSON.stringify({
      date: new Date(log.occurredAt).toISOString(),
      id: String(log._id),
    })
  ).toString("base64url");
}

export async function GET(req, { params }) {
  try {
    await connectDB();

    const authError = await authenticate(req);

    if (authError) return authError;

    const { module, id } = await params;

    if (
      !MODULES.has(module) ||
      !mongoose.isValidObjectId(id)
    ) {
      return fail("Invalid activity target.");
    }

    const { searchParams } = new URL(req.url);

    const action = searchParams.get("action") || "all";
    const cursorValue = searchParams.get("cursor");

    const allowedActions = new Set([
      "all",
      "created",
      "updated",
      "deleted",
      "published",
      "unpublished",
    ]);

    if (!allowedActions.has(action)) {
      return fail("Invalid action filter.");
    }

    const filter = {
      module,
      targetId: new mongoose.Types.ObjectId(id),
    };

    if (action !== "all") {
      filter.action = action;
    }

    const cursor = cursorValue
      ? decodeCursor(cursorValue)
      : null;

    if (cursorValue && !cursor) {
      return fail("Invalid cursor.");
    }

    const historyFilter = { ...filter };

    if (cursor) {
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

    const [rows, summary, latest] = await Promise.all([
      ActivityLog.find(historyFilter)
        .select(
          "actorId actorName actorEmail actorRole module action targetId targetName targetSlug targetUrl changes occurredAt"
        )
        .sort({ occurredAt: -1, _id: -1 })
        .limit(LIMIT + 1)
        .lean(),

      ActivityLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
          },
        },
      ]),

      ActivityLog.findOne({
        module,
        targetId: new mongoose.Types.ObjectId(id),
      })
        .sort({ occurredAt: -1, _id: -1 })
        .select("targetName targetSlug targetUrl")
        .lean(),
    ]);

    const hasMore = rows.length > LIMIT;
    const logs = rows.slice(0, LIMIT);

    const actions = {};
    let total = 0;

    for (const item of summary) {
      actions[item._id] = item.count;
      total += item.count;
    }

    return NextResponse.json(
      {
        success: true,
        target: {
          id,
          module,
          name: latest?.targetName || "Activity Target",
          slug: latest?.targetSlug || "",
          url: latest?.targetUrl || "",
        },
        summary: { total, actions },
        logs,
        hasMore,
        nextCursor:
          hasMore && logs.length
            ? encodeCursor(logs[logs.length - 1])
            : null,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Target history error:", error);

    return fail("Unable to load target history.", 500);
  }
}
