/* app/api/admin/sliders/route.js */
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import HeroSlide from "@/app/models/slider";

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

function toBoolean(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeCountries(countries) {
  if (!Array.isArray(countries)) return [];

  return countries
    .filter(Boolean)
    .map((country) => String(country).trim().toUpperCase())
    .filter((country) => country.length >= 2 && country.length <= 3);
}

function normalizeCta(button = null) {
  if (!button) return null;

  return {
    label: button.label || "",
    url: button.url || "",
    style: button.style || "primary",
    icon: button.icon || "",
  };
}

function normalizeHeroSlidePayload(body = {}) {
  return {
    internalName: body.internalName,
    campaignRef: body.campaignRef || "",

    slideType: body.slideType,

    design: {
      alignment: body.design?.alignment || "left",
      theme: body.design?.theme || "dark",
      overlay: {
        active: Boolean(body.design?.overlay?.active),
        color: body.design?.overlay?.color || "#1A1340",
        opacity:
          body.design?.overlay?.opacity === "" ||
          body.design?.overlay?.opacity == null
            ? 0.5
            : Number(body.design.overlay.opacity),
      },
    },

    media: {
      mediaType: body.media?.mediaType || "image",
      desktopUrl: body.media?.desktopUrl,
      mobileUrl: body.media?.mobileUrl || "",
      posterUrl: body.media?.posterUrl || "",
      altText: body.media?.altText,
      globalLink: body.media?.globalLink || "",
      videoSettings: {
        autoPlay: body.media?.videoSettings?.autoPlay ?? true,
        loop: body.media?.videoSettings?.loop ?? true,
        muted: body.media?.videoSettings?.muted ?? true,
      },
    },

    content: {
      badge: body.content?.badge || "",
      heading: body.content?.heading || "",
      subheading: body.content?.subheading || "",
      highlightWord: body.content?.highlightWord || "",
    },

    buttons: {
      primary: normalizeCta(body.buttons?.primary),
      secondary: normalizeCta(body.buttons?.secondary),
    },

    targeting: {
      countries: normalizeCountries(body.targeting?.countries),
      deviceVisibility: body.targeting?.deviceVisibility || "all",
    },

    status: body.status || "draft",

    schedule: {
      startDate: normalizeDate(body.schedule?.startDate),
      endDate: normalizeDate(body.schedule?.endDate),
      timezone: body.schedule?.timezone || "UTC",
    },

    sortOrder:
      body.sortOrder === "" || body.sortOrder == null
        ? 0
        : Number(body.sortOrder),
  };
}

function buildHeroSlideQuery(searchParams) {
  const query = {};

  const status = searchParams.get("status");
  const slideType = searchParams.get("slideType");
  const mediaType = searchParams.get("mediaType");
  const theme = searchParams.get("theme");
  const alignment = searchParams.get("alignment");
  const deviceVisibility = searchParams.get("deviceVisibility");
  const country = searchParams.get("country");
  const live = toBoolean(searchParams.get("live"));
  const search = searchParams.get("search");

  if (status) query.status = status;
  if (slideType) query.slideType = slideType;
  if (mediaType) query["media.mediaType"] = mediaType;
  if (theme) query["design.theme"] = theme;
  if (alignment) query["design.alignment"] = alignment;
  if (deviceVisibility) query["targeting.deviceVisibility"] = deviceVisibility;

  if (country) {
    const countryCode = country.toUpperCase();

    query.$or = [
      { "targeting.countries": { $size: 0 } },
      { "targeting.countries": countryCode },
    ];
  }

  if (live === true) {
    const now = new Date();

    query.status = { $in: ["active", "scheduled"] };

    query.$and = [
      {
        $or: [
          { "schedule.startDate": null },
          { "schedule.startDate": { $lte: now } },
        ],
      },
      {
        $or: [
          { "schedule.endDate": null },
          { "schedule.endDate": { $gte: now } },
        ],
      },
    ];
  }

  if (search) {
    const searchQuery = [
      { internalName: { $regex: search, $options: "i" } },
      { campaignRef: { $regex: search, $options: "i" } },
      { "content.badge": { $regex: search, $options: "i" } },
      { "content.heading": { $regex: search, $options: "i" } },
      { "content.subheading": { $regex: search, $options: "i" } },
      { "media.altText": { $regex: search, $options: "i" } },
    ];

    if (query.$or) {
      query.$and = query.$and || [];
      query.$and.push({ $or: query.$or });
      query.$and.push({ $or: searchQuery });
      delete query.$or;
    } else {
      query.$or = searchQuery;
    }
  }

  return query;
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = toNumber(searchParams.get("page"), 1);
    const limit = Math.min(toNumber(searchParams.get("limit"), 10), 100);
    const skip = (page - 1) * limit;

    const query = buildHeroSlideQuery(searchParams);

    const [slides, total] = await Promise.all([
      HeroSlide.find(query)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true }),

      HeroSlide.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        slides,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /admin/sliders Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch hero slides." },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const payload = normalizeHeroSlidePayload(body);

    const slide = await HeroSlide.create(payload);

    return NextResponse.json(
      {
        message: "Hero slide created successfully.",
        slide,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /admin/sliders Error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to create hero slide.",
      },
      { status: 400 },
    );
  }
}
