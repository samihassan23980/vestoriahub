/**
 * @model HeroSlide
 * @description Enterprise-grade Homepage Hero Banner Slider for DealVerse.
 * Supports Video/Image dual options, advanced geo-targeting, campaign tracking,
 * dynamic overlays, and device-specific rendering constraints.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// ─── Helpers & Validators ─────────────────────────────────────────────────────

function isValidUrl(str) {
  if (!str) return true;
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

/** Reusable CTA Button Schema */
const CtaSchema = new Schema(
  {
    label: { type: String, trim: true, maxlength: 40 },
    url: {
      type: String,
      trim: true,
      validate: [
        isValidUrl,
        "Must be a valid URL or relative path (e.g., /store/amazon)",
      ],
    },
    // "primary" = Solid #FF6B35, "secondary" = Outlined #2D2380, "ghost" = Transparent
    style: {
      type: String,
      enum: ["primary", "secondary", "ghost"],
      default: "primary",
    },
    // Optional icon name from lucide-react (e.g., "ArrowRight", "Tag")
    icon: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const HeroSlideSchema = new Schema(
  {
    // ── 1. Admin Identity & Analytics ─────────────────────────────────────

    internalName: {
      type: String,
      required: [true, "Internal name is required for admin reference"],
      trim: true,
      maxlength: 100,
    },
    campaignRef: {
      type: String,
      trim: true,
      description: "UTM campaign ID for marketing analytics tracking",
    },

    // ── 2. Slide Architecture & Styling ───────────────────────────────────

    slideType: {
      type: String,
      enum: ["image_only", "text_overlay", "full_cta"],
      required: true,
      index: true,
    },

    design: {
      alignment: {
        type: String,
        enum: ["left", "center", "right"],
        default: "left",
      },
      // "dark" = text is white (bg is dark), "light" = text is dark (bg is light)
      theme: { type: String, enum: ["dark", "light"], default: "dark" },

      // Ensures text is readable over busy images or videos
      overlay: {
        active: { type: Boolean, default: false },
        color: { type: String, default: "#1A1340" }, // Midnight Ink default
        opacity: { type: Number, min: 0, max: 1, default: 0.5 }, // e.g., 0.5 = 50%
      },
    },

    // ── 3. Dual Media Engine (Video + Image) ──────────────────────────────

    media: {
      mediaType: {
        type: String,
        enum: ["image", "video"],
        required: true,
        default: "image",
      },

      // Assets for Desktop
      desktopUrl: { type: String, required: true, trim: true },

      // Assets for Mobile (Portrait)
      mobileUrl: { type: String, trim: true, default: "" },

      // Fallback poster images (Crucial for video processing times or mobile data savers)
      posterUrl: { type: String, trim: true, default: "" },

      // Accessibility & Global Link
      altText: { type: String, trim: true, required: true, maxlength: 150 },
      globalLink: { type: String, trim: true, default: "" },

      // Video Specific Settings
      videoSettings: {
        autoPlay: { type: Boolean, default: true },
        loop: { type: Boolean, default: true },
        muted: { type: Boolean, default: true },
      },
    },

    // ── 4. Typography Content ─────────────────────────────────────────────

    content: {
      badge: { type: String, trim: true, default: "", maxlength: 30 },
      heading: { type: String, trim: true, default: "", maxlength: 80 },
      subheading: { type: String, trim: true, default: "", maxlength: 160 },

      // Highlight a specific word in the heading with Brand Gold (#F4A836)
      highlightWord: { type: String, trim: true, default: "" },
    },

    // ── 5. Call to Actions (CTAs) ─────────────────────────────────────────

    buttons: {
      primary: { type: CtaSchema, default: null },
      secondary: { type: CtaSchema, default: null },
    },

    // ── 6. Advanced Targeting ─────────────────────────────────────────────

    targeting: {
      // Empty array [] = GLOBAL. Otherwise ['US', 'PK', 'UK']
      countries: [
        {
          type: String,
          trim: true,
          uppercase: true,
          minlength: 2,
          maxlength: 3,
        },
      ],
      // Sometimes a banner is explicitly designed for the mobile app
      deviceVisibility: {
        type: String,
        enum: ["all", "desktop_only", "mobile_only"],
        default: "all",
      },
    },

    // ── 7. Lifecycle & Scheduling ─────────────────────────────────────────

    status: {
      type: String,
      enum: ["draft", "active", "inactive", "scheduled"],
      default: "draft",
      index: true,
    },

    schedule: {
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      // Optional: Store timezone to trigger flash sales precisely local time
      timezone: { type: String, default: "UTC" },
    },

    // ── 8. Ordering ───────────────────────────────────────────────────────

    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true },
);

// ─── Validation Hooks (Synchronous, NO next() used) ───────────────────────────

HeroSlideSchema.pre("validate", function () {
  // 1. Array Normalization for Countries
  if (this.targeting?.countries?.length > 0) {
    this.targeting.countries = this.targeting.countries.map((c) =>
      c.trim().toUpperCase(),
    );
  }

  // 2. Date Logic Safety (Using direct throw instead of next)
  if (this.schedule?.startDate && this.schedule?.endDate) {
    if (this.schedule.startDate >= this.schedule.endDate) {
      throw new Error("Schedule endDate must be strictly after startDate.");
    }
  }

  // 3. Automated Status Shifting
  if (this.status === "active" && this.schedule?.startDate) {
    const now = new Date();
    if (this.schedule.startDate > now) {
      this.status = "scheduled";
    }
  }

  // 4. Video Validation (Direct throw)
  if (this.media.mediaType === "video" && !this.media.posterUrl) {
    // Agar video ke waqt poster laazmi chahiye to uncomment karein:
    // throw new Error("A posterUrl fallback image is required when using video media.");
  }
});

// ─── Virtuals ─────────────────────────────────────────────────────────────────

// Determine if the slide is CURRENTLY live based on dates + status
HeroSlideSchema.virtual("isLive").get(function () {
  if (this.status !== "active" && this.status !== "scheduled") return false;

  const now = new Date();
  if (this.schedule?.startDate && now < this.schedule.startDate) return false;
  if (this.schedule?.endDate && now > this.schedule.endDate) return false;

  return true;
});

// Ensure virtuals are included in JSON responses
HeroSlideSchema.set("toJSON", { virtuals: true });
HeroSlideSchema.set("toObject", { virtuals: true });

// ─── Indexes for High Performance ─────────────────────────────────────────────

// Optimized for: "Find live slides for User's Country, sorted by order"
HeroSlideSchema.index({ status: 1, "targeting.countries": 1, sortOrder: 1 });
HeroSlideSchema.index({ "schedule.endDate": 1 }, { expireAfterSeconds: 0 }); // Optional: auto-purge expired slides if desired

// ─── Export ───────────────────────────────────────────────────────────────────

export default mongoose.models.HeroSlide ||
  mongoose.model("HeroSlide", HeroSlideSchema);
