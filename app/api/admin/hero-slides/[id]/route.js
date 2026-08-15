import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";
import HeroSlide from "@/app/models/slider";

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

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid hero slide id." },
        { status: 400 },
      );
    }

    const slide = await HeroSlide.findById(id).lean({ virtuals: true });

    if (!slide) {
      return NextResponse.json(
        { error: "Hero slide not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ slide }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/hero-slides/[id] Error:", error);

    return NextResponse.json(
      { error: "Failed to fetch hero slide." },
      { status: 500 },
    );
  }
}

export async function PUT(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid hero slide id." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const payload = normalizeHeroSlidePayload(body);

    const slide = await HeroSlide.findById(id);

    if (!slide) {
      return NextResponse.json(
        { error: "Hero slide not found." },
        { status: 404 },
      );
    }

    Object.assign(slide, payload);

    await slide.save();

    return NextResponse.json(
      {
        message: "Hero slide updated successfully.",
        slide,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/admin/hero-slides/[id] Error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to update hero slide.",
      },
      { status: 400 },
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid hero slide id." },
        { status: 400 },
      );
    }

    const body = await req.json();

    const slide = await HeroSlide.findById(id);

    if (!slide) {
      return NextResponse.json(
        { error: "Hero slide not found." },
        { status: 404 },
      );
    }

    Object.assign(slide, body);

    await slide.save();

    return NextResponse.json(
      {
        message: "Hero slide updated successfully.",
        slide,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH /api/admin/hero-slides/[id] Error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to update hero slide.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid hero slide id." },
        { status: 400 },
      );
    }

    const deletedSlide = await HeroSlide.findByIdAndDelete(id);

    if (!deletedSlide) {
      return NextResponse.json(
        { error: "Hero slide not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Hero slide deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /api/admin/hero-slides/[id] Error:", error);

    return NextResponse.json(
      { error: "Failed to delete hero slide." },
      { status: 500 },
    );
  }
}
