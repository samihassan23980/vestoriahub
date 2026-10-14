
import ActivityLog from "@/app/models/activityLog";

const ALLOWED_CHANGES = {
  store: new Set([
    "officialUrl",
    "tracking.trackingLink",
  ]),
  coupon: new Set([
    "code",
    "trackingLink",
  ]),
  blog: new Set(),
};

const ALLOWED_ACTIONS = new Set([
  "created",
  "updated",
  "deleted",
  "published",
  "unpublished",
]);

function asString(value) {
  return value == null ? "" : String(value);
}

function getNestedValue(object, path) {
  return path
    .split(".")
    .reduce(
      (value, key) => value?.[key],
      object
    );
}

export function buildActivityChanges(
  module,
  before,
  after
) {
  const fields = ALLOWED_CHANGES[module];

  if (!fields) {
    throw new Error(
      `Unsupported activity module: ${module}`
    );
  }

  const changes = [];

  for (const field of fields) {
    const oldValue = asString(
      getNestedValue(before, field)
    );

    const newValue = asString(
      getNestedValue(after, field)
    );

    if (oldValue !== newValue) {
      changes.push({
        field,
        oldValue,
        newValue,
      });
    }
  }

  return changes;
}

export async function recordActivity({
  actor,
  module,
  action,
  target,
  before = null,
  after = null,
}) {
  if (!actor?._id) {
    throw new Error(
      "Authenticated employee is required."
    );
  }

  if (!ALLOWED_CHANGES[module]) {
    throw new Error(
      `Unsupported activity module: ${module}`
    );
  }

  if (!ALLOWED_ACTIONS.has(action)) {
    throw new Error(
      `Unsupported activity action: ${action}`
    );
  }

  if (!target?.name) {
    throw new Error(
      "Activity target name is required."
    );
  }

  const changes =
    action === "updated"
      ? buildActivityChanges(
          module,
          before,
          after
        )
      : [];

  return ActivityLog.create({
    actorId: actor._id,
    actorName:
      actor.name ||
      actor.email ||
      "Unknown Employee",
    actorEmail: actor.email || "",
    actorRole: actor.role || "",

    module,
    action,

    targetId: target._id || null,
    targetName: target.name,
    targetSlug: target.slug || "",
    targetUrl: target.url || "",

    changes,
    occurredAt: new Date(),
  });
}
