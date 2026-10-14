
import mongoose from "mongoose";

// ============================================================
// CONFIGURATION
// ============================================================

// Retain activity logs for 60 days.
// 60 days = 5,184,000 seconds.
const ACTIVITY_RETENTION_SECONDS = 60 * 24 * 60 * 60;

// ============================================================
// CHANGE SCHEMA
// ============================================================

const ChangeSchema = new mongoose.Schema(
  {
    field: {
      type: String,
      required: true,
      trim: true,
    },

    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// ACTIVITY LOG SCHEMA
// ============================================================

const ActivityLogSchema = new mongoose.Schema(
  {
    // --------------------------------------------------------
    // EMPLOYEE ID
    // --------------------------------------------------------

    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Employee snapshot survives account deletion or renaming.
    actorName: {
      type: String,
      required: true,
      trim: true,
    },

    actorEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    actorRole: {
      type: String,
      default: "",
      trim: true,
    },

    // --------------------------------------------------------
    // MODULE
    // --------------------------------------------------------

    module: {
      type: String,
      enum: ["store", "coupon", "blog"],
      required: true,
    },

    // --------------------------------------------------------
    // ACTION
    // --------------------------------------------------------

    action: {
      type: String,
      enum: [
        "created",
        "updated",
        "deleted",
        "published",
        "unpublished",
      ],
      required: true,
    },

    // --------------------------------------------------------
    // TARGET DETAILS
    // --------------------------------------------------------

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    targetName: {
      type: String,
      required: true,
      trim: true,
    },

    targetSlug: {
      type: String,
      default: "",
      trim: true,
    },

    targetUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // --------------------------------------------------------
    // FIELD CHANGES
    // --------------------------------------------------------

    changes: {
      type: [ChangeSchema],
      default: [],
    },

    // --------------------------------------------------------
    // ACTIVITY TIMESTAMP
    // --------------------------------------------------------

    occurredAt: {
      type: Date,
      default: Date.now,
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
    collection: "activity_logs",
    versionKey: false,
  }
);

// ============================================================
// INDEX 1: AUTOMATIC 60-DAY DELETION
// ============================================================
//
// MongoDB TTL index.
//
// Records expire 60 days after occurredAt.
//
// Important:
// TTL deletion is asynchronous. Expired documents may remain
// briefly until MongoDB's TTL monitor removes them.
//
// ============================================================

ActivityLogSchema.index(
  {
    occurredAt: 1,
  },
  {
    name: "activity_auto_delete_60_days",
    expireAfterSeconds: ACTIVITY_RETENTION_SECONDS,
  }
);

// ============================================================
// INDEX 2: GLOBAL ACTIVITY HISTORY
// ============================================================
//
// Supports:
// - Recent activities
// - Cursor pagination
// - Date sorting
//
// ============================================================

ActivityLogSchema.index(
  {
    occurredAt: -1,
    _id: -1,
  },
  {
    name: "activity_recent_history",
  }
);

// ============================================================
// INDEX 3: EMPLOYEE ACTIVITY HISTORY
// ============================================================
//
// Supports:
// /admin/activity-logs/[id]
//
// ============================================================

ActivityLogSchema.index(
  {
    actorId: 1,
    occurredAt: -1,
    _id: -1,
  },
  {
    name: "activity_employee_history",
  }
);

// ============================================================
// INDEX 4: EMPLOYEE + MODULE
// ============================================================
//
// Example:
// Employee A -> Coupon activities
//
// ============================================================

ActivityLogSchema.index(
  {
    actorId: 1,
    module: 1,
    occurredAt: -1,
    _id: -1,
  },
  {
    name: "activity_employee_module",
  }
);

// ============================================================
// INDEX 5: EMPLOYEE + ACTION
// ============================================================
//
// Example:
// Employee A -> Deleted activities
//
// ============================================================

ActivityLogSchema.index(
  {
    actorId: 1,
    action: 1,
    occurredAt: -1,
    _id: -1,
  },
  {
    name: "activity_employee_action",
  }
);

// ============================================================
// INDEX 6: GLOBAL MODULE + ACTION
// ============================================================
//
// Supports:
// - Store updates
// - Coupon deletions
// - Blog publishing
//
// ============================================================

ActivityLogSchema.index(
  {
    module: 1,
    action: 1,
    occurredAt: -1,
    _id: -1,
  },
  {
    name: "activity_module_action",
  }
);

// ============================================================
// MODEL EXPORT
// ============================================================

export default mongoose.models.ActivityLog ||
  mongoose.model("ActivityLog", ActivityLogSchema);
