
import { SignJWT, jwtVerify } from "jose";

const SESSION_DURATION_SECONDS = 12 * 60 * 60;
const SESSION_ISSUER = "admin-portal";
const SESSION_AUDIENCE = "admin-panel";

export const ADMIN_SESSION_COOKIE = "admin_token";

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SESSION_SECRET must contain at least 32 characters."
    );
  }

  return new TextEncoder().encode(secret);
}

/**
 * Create a signed admin session.
 *
 * The session expires exactly 12 hours after creation.
 * It does not automatically renew.
 */
export async function createAdminSession(user) {
  const userId = String(user._id || user.id || "");

  if (!userId || !user.role) {
    throw new Error("Valid user ID and role are required.");
  }

  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    role: String(user.role),
  })
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setSubject(userId)
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_DURATION_SECONDS)
    .sign(getSessionSecret());
}

/**
 * Verify a signed admin session.
 *
 * Returns null for missing, invalid, tampered,
 * or expired tokens.
 */
export async function verifyAdminSession(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      getSessionSecret(),
      {
        algorithms: ["HS256"],
        issuer: SESSION_ISSUER,
        audience: SESSION_AUDIENCE,
        clockTolerance: 0,
      }
    );

    if (
      !payload.sub ||
      typeof payload.role !== "string" ||
      !Number.isInteger(payload.iat) ||
      !Number.isInteger(payload.exp) ||
      payload.exp - payload.iat !== SESSION_DURATION_SECONDS
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role,
      issuedAt: payload.iat,
      expiresAt: payload.exp,
    };
  } catch {
    return null;
  }
}

export const ADMIN_SESSION_MAX_AGE =
  SESSION_DURATION_SECONDS;
