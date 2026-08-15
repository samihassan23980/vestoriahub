/**
 * @model User
 * @description Admin and editor user accounts for the Sociantech CMS.
 * Authentication is credential-based (email + password). JWTs are issued
 * on login. This schema manages identity, permissions, and account security.
 *
 * Security model:
 *  - Passwords are bcrypt-hashed (cost factor 12) before storage.
 *  - Password is excluded from all queries by default (select: false).
 *  - Brute-force protection via loginAttempts + lockoutUntil.
 *  - Password reset uses a time-limited hashed token (not the plain token).
 *  - Email verification blocks CMS access until confirmed.
 *
 * Audit fixes applied:
 *  - resetPasswordToken + resetPasswordExpiry added (password reset flow)
 *  - loginAttempts + lockoutUntil added (brute-force attack protection)
 *  - emailVerified + emailVerifyToken added (email confirmation before access)
 *  - lastLoginAt added (security auditing, inactive account detection)
 *  - role enum extended with "super_admin" (platform owner with full access)
 *  - avatarUrl URL format validation added
 *  - bcrypt cost factor increased from 10 → 12 (better security vs performance balance)
 *  - comparePassword instance method added (encapsulates auth logic in model)
 *  - isLockedOut instance method added (readable lockout check)
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum consecutive failed login attempts before account lockout */
const MAX_LOGIN_ATTEMPTS = 5;

/** Account lockout duration: 30 minutes in milliseconds */
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidUrl(str) {
  if (!str) return true; // Optional — empty string = not set = valid
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema(
  {
    // ── 1. Identity ───────────────────────────────────────────────────────

    // Full display name (used in admin panel, audit trails, blog author bylines)
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    // Login email — must be unique, stored lowercase
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 255,
    },

    /**
     * bcrypt-hashed password. Cost factor 12 (2^12 = 4096 iterations).
     * select: false = NEVER returned in queries unless explicitly requested:
     *   User.findById(id).select("+password")
     * Never return or log this field.
     */
    password: {
      type: String,
      required: true,
      select: false,
    },

    // URL to profile avatar image (Cloudinary, Gravatar, etc.)
    avatarUrl: {
      type: String,
      default: "",
      validate: {
        validator: isValidUrl,
        message: "avatarUrl must be a valid http/https URL.",
      },
    },

    // ── 2. Role & Permissions ─────────────────────────────────────────────

    /**
     * User role — controls what sections of the admin panel are accessible.
     *
     * "super_admin" — full platform control (settings, users, all content)
     * "admin"       — manages all content and stores; cannot manage users
     * "editor"      — creates/edits blogs and coupons; no admin settings
     */
    role: {
      type: String,
      enum: ["super_admin", "admin", "editor"],
      default: "editor",
      index: true,
    },

    /**
     * Granular feature access flags.
     * Used when role-based access is too coarse — e.g. an editor who
     * should specifically be able to view analytics.
     */
    access: {
      // Can log into the admin panel at /admin (checked in Next.js middleware)
      canAccessAdmin: { type: Boolean, default: false },

      // Can view the analytics dashboard and event reports
      canViewAnalytics: { type: Boolean, default: false },

      // Can manage stores and affiliate networks (not just coupons/blogs)
      canManageStores: { type: Boolean, default: false },
    },

    // ── 3. Account Status ─────────────────────────────────────────────────

    /**
     * "active"   = fully functional account.
     * "disabled" = manually deactivated by super_admin (cannot log in).
     */
    status: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
      index: true,
    },

    /**
     * True after the user confirms their email address.
     * New accounts must verify before accessing the admin panel.
     * Token is stored in emailVerifyToken; cleared after verification.
     */
    emailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Hashed email verification token sent to the user's inbox.
     * Store the HASH here; send the raw token in the email URL.
     * On verify: hash the received token, compare with this stored hash.
     * Cleared (set to null) after successful verification.
     */
    emailVerifyToken: {
      type: String,
      default: null,
      select: false, // Never expose token in query results
    },

    // ── 4. Password Reset ─────────────────────────────────────────────────

    /**
     * Hashed password reset token. Same pattern as emailVerifyToken:
     * Store the hash, send the raw token in the reset-password email link.
     * On reset: hash received token, compare with this, update password.
     * Cleared after successful password reset.
     */
    resetPasswordToken: {
      type: String,
      default: null,
      select: false, // Never expose token in query results
    },

    /**
     * Expiry datetime for the reset token.
     * Tokens expire after 1 hour to limit the window for token interception.
     * Always check this before accepting a reset token.
     */
    resetPasswordExpiry: {
      type: Date,
      default: null,
    },

    // ── 5. Brute-force Protection ─────────────────────────────────────────

    /**
     * Consecutive failed login attempts since last successful login.
     * Reset to 0 on successful login.
     * When this reaches MAX_LOGIN_ATTEMPTS, lockoutUntil is set.
     */
    loginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    /**
     * Account lockout expiry. While Date.now() < lockoutUntil, all login
     * attempts are rejected regardless of credentials.
     * Duration: LOCKOUT_DURATION_MS (30 minutes).
     * null = not currently locked out.
     * Use the isLockedOut() instance method to check this cleanly.
     */
    lockoutUntil: {
      type: Date,
      default: null,
      index: true,
    },

    // ── 6. Activity Tracking ──────────────────────────────────────────────

    /**
     * Timestamp of the last successful login.
     * Use cases:
     *  - Security dashboard: "last seen X days ago"
     *  - Inactive account detection: flag accounts not logged in for 90+ days
     *  - Suspicious activity: login from unusual timezone/time
     */
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// ─── Pre-save: Password Hashing ───────────────────────────────────────────────

UserSchema.pre("save", async function () {
  // Only hash when password field changes (avoid re-hashing an already-hashed value)
  if (!this.isModified("password")) return;

  try {
    // Cost factor 12: ~250ms per hash on modern hardware (good balance)
    // Cost factor 10 (original) is considered too low by 2024 standards
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

/**
 * Compare a plaintext password candidate against the stored bcrypt hash.
 * Usage: const isMatch = await user.comparePassword(candidatePassword)
 * Requires password to be selected: User.findById(id).select("+password")
 */
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check whether this account is currently locked out.
 * Returns true if lockoutUntil is set and is still in the future.
 * Usage: if (user.isLockedOut()) return res.status(423).json(...)
 */
UserSchema.methods.isLockedOut = function () {
  return !!(this.lockoutUntil && this.lockoutUntil > new Date());
};

/**
 * Record a failed login attempt. Locks the account if MAX_LOGIN_ATTEMPTS reached.
 * Always call save() after this method.
 * Usage: await user.recordFailedLogin(); await user.save();
 */
UserSchema.methods.recordFailedLogin = function () {
  this.loginAttempts = (this.loginAttempts || 0) + 1;

  if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
  }
};

/**
 * Reset login attempt counters after a successful login.
 * Also updates lastLoginAt.
 * Always call save() after this method.
 */
UserSchema.methods.recordSuccessfulLogin = function () {
  this.loginAttempts = 0;
  this.lockoutUntil = null;
  this.lastLoginAt = new Date();
};

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Admin panel user listing: filter by role and status
UserSchema.index({ role: 1, status: 1 });

// Security audit: find recently locked-out accounts
UserSchema.index({ lockoutUntil: 1 });

// Inactive account detection
UserSchema.index({ lastLoginAt: 1 });

// ─── Exports ──────────────────────────────────────────────────────────────────

export { MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MS };
export default mongoose.models.User || mongoose.model("User", UserSchema);
