
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

const ALLOWED_ROLES = new Set(["admin", "manager"]);

function failure(message, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

async function authenticate(req) {
  const token = req.cookies.get(
    ADMIN_SESSION_COOKIE
  )?.value;

  if (!token) return failure("Login required.", 401);

  const session = await verifyAdminSession(token);

  if (
    !session?.userId ||
    !mongoose.isValidObjectId(session.userId)
  ) {
    return failure("Invalid session.", 401);
  }

  const user = await User.findById(session.userId)
    .select("role status")
    .lean();

  if (!user || user.status === "disabled") {
    return failure("Account unavailable.", 403);
  }

  if (user.role !== session.role) {
    return failure("Session permissions changed.", 401);
  }

  if (!ALLOWED_ROLES.has(user.role)) {
    return failure("Access denied.", 403);
  }

  return null;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  try {
    await connectDB();

    const authError = await authenticate(req);

    if (authError) return authError;

    const { searchParams } = new URL(req.url);

    const query = (searchParams.get("q") || "")
      .trim()
      .slice(0, 100);

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
      });
    }

    const regex = new RegExp(escapeRegex(query), "i");

    const results = await ActivityLog.aggregate([
      {
        $match: {
          targetId: { $type: "objectId" },
          $or: [
            { targetName: regex },
            { targetSlug: regex },
          ],
        },
      },
      {
        $sort: {
          occurredAt: -1,
          _id: -1,
        },
      },
      {
        $group: {
          _id: {
            module: "$module",
            targetId: "$targetId",
          },
          name: { $first: "$targetName" },
          slug: { $first: "$targetSlug" },
          lastActivity: { $first: "$occurredAt" },
        },
      },
      {
        $sort: {
          lastActivity: -1,
        },
      },
      { $limit: 12 },
      {
        $project: {
          _id: 0,
          module: "$_id.module",
          targetId: {
            $toString: "$_id.targetId",
          },
          name: 1,
          slug: 1,
          lastActivity: 1,
        },
      },
    ]).allowDiskUse(true);

    return NextResponse.json(
      { success: true, results },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error("Activity search error:", error);

    return failure("Unable to search activity.", 500);
  }
}
