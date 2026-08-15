import mongoose from "mongoose";

const { Schema } = mongoose;

const AffiliateProductSchema = new Schema(
  {
    // ─── 1. Identity & Content ─────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
    description: { type: String, default: "" },
    brandName: { type: String, trim: true, maxlength: 100, index: true },

    // ─── 2. Editorial & Trust (New Additions) ──────────────
    expertScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    }, // Jaise screenshot me 4.8/5 ya 9.2/10 dikhana ho [cite: 13]

    ribbonText: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    }, // "EDITOR'S CHOICE", "BEST ERGONOMICS", ya "HOT DEAL" ke liye [cite: 16, 20, 32]

    pros: [{ type: String, trim: true, maxlength: 150 }], // [cite: 26, 27, 28]
    cons: [{ type: String, trim: true, maxlength: 150 }], // [cite: 29, 30]

    bottomLine: { type: String, trim: true, maxlength: 300 }, // Expert ki final raye
    awardBadge: { type: String, trim: true, maxlength: 80 },

    // ─── 3. Media ──────────────────────────────────────────
    images: [
      {
        url: { type: String, required: true, trim: true },
        alt: { type: String, trim: true, maxlength: 150 },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // ─── 4. Specifications ─────────────────────────────────
    specifications: { type: Map, of: String, default: {} },
    highlights: [{ type: String, trim: true, maxlength: 120 }],

    // ─── 5. Pricing & Affiliate (Trust Updated) ────────────
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: null, min: 0 },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
      index: true,
    },
    currency: { type: String, default: "USD", uppercase: true },
    affiliateLink: { type: String, required: true, trim: true },
    ctaText: { type: String, default: "View Deal", trim: true },

    lastVerifiedAt: {
      type: Date,
      default: Date.now,
    }, // "Verified Deals" aur "Updated Monthly" logic ke liye [cite: 21, 22]

    // ─── 6. Social Proof ───────────────────────────────────
    rating: { type: Number, default: null, min: 1, max: 5, index: true },
    reviewCount: { type: Number, default: 0, min: 0 },

    // ─── 7. Relations ──────────────────────────────────────
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      default: null,
      index: true,
    },

    // ─── 8. Frontend Layout Controls (Crucial for Hybrid) ──
    displayVariant: {
      type: String,
      enum: [
        "standard",
        "featured_horizontal",
        "compact_grid",
        "hero_spotlight",
      ],
      default: "standard",
      index: true,
    }, // Ye decide karega ke card Page 1 jaisa bada hoga ya Page 2 jaisa grid

    isTopPick: { type: Boolean, default: false, index: true },
    isTrending: { type: Boolean, default: false, index: true },
    isHotDeal: { type: Boolean, default: false, index: true },
    showInCategoryPage: { type: Boolean, default: true, index: true },

    sortOrder: { type: Number, default: 100, index: true },

    // ─── 9. SEO ───────────────────────────────────────────
    seoTitle: { type: String, maxlength: 70 },
    seoDescription: { type: String, maxlength: 160 },
  },
  { timestamps: true },
);

// ─── Middleware Logic ──────────────────────────────────────

AffiliateProductSchema.pre("save", function () {
  if (this.slug) {
    this.slug = String(this.slug).trim().toLowerCase();
  }

  if (this.originalPrice && this.price < this.originalPrice) {
    this.discountPercentage = Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100,
    );
    this.isHotDeal = this.discountPercentage >= 15;
  } else {
    this.discountPercentage = 0;
  }

  if (this.isTopPick) {
    this.displayVariant = "hero_spotlight";
  } else if (this.isHotDeal && this.discountPercentage > 30) {
    this.displayVariant = "featured_horizontal";
  }
});

export default mongoose.models.AffiliateProduct ||
  mongoose.model("AffiliateProduct", AffiliateProductSchema);
