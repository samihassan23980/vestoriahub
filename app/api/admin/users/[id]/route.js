import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const body = await req.json();

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Update allowed fields (Do not update password here, that requires a specific flow)
    if (body.name) user.name = body.name;
    if (body.role) user.role = body.role;
    if (body.status) user.status = body.status;
    if (body.avatarUrl !== undefined) user.avatarUrl = body.avatarUrl;

    // Update access flags if provided
    if (body.access) {
      user.access = { ...user.access, ...body.access };
    }

    await user.save();

    return NextResponse.json(
      { message: "User updated successfully.", user },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /admin/users/[id] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user." },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    // Schema logic: We "soft-disable" instead of hard delete to preserve audit trails.
    // E.g., if this user created stores/blogs, deleting them would break "createdBy" refs.
    const user = await User.findByIdAndUpdate(
      params.id,
      { status: "disabled" },
      { new: true },
    );

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User account has been disabled." },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /admin/users/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to disable user." },
      { status: 500 },
    );
  }
}
