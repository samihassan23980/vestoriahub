import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(); // .lean() for performance since we only read data

    const total = await User.countDocuments(query);

    return NextResponse.json(
      { users, total, page, totalPages: Math.ceil(total / limit) },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /admin/users Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users." },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    // Ensure email is unique before attempting to save
    const existingUser = await User.findOne({
      email: body.email.toLowerCase().trim(),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 409 },
      );
    }

    // Create user. The UserSchema.pre("save") hook will automatically hash the password.
    const newUser = new User({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role || "editor",
      status: body.status || "active",
      access: body.access || {},
      emailVerified: true, // CMS-created users can bypass email verification
    });

    await newUser.save();

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return NextResponse.json(
      { message: "User created successfully.", user: userResponse },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /admin/users Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user." },
      { status: 500 },
    );
  }
}
