import { NextResponse } from "next/server";
import { connectDB } from "@/app/lib/mongodb";
import GeoFirewall from "@/app/models/geoFirewall";

export async function PUT(req, { params }) {
  try {
    await connectDB();
    const body = await req.json();

    const adminId = req.headers.get("x-user-id");

    const rule = await GeoFirewall.findById(params.id);
    if (!rule) {
      return NextResponse.json(
        { error: "Firewall rule not found." },
        { status: 404 },
      );
    }

    Object.assign(rule, body);

    if (adminId) {
      rule.updatedBy = adminId;
    }

    // .save() ensures the data cleaning hooks run again if the admin changed the scope or action
    await rule.save();

    return NextResponse.json(
      { message: "Firewall rule updated successfully.", rule },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /admin/geo-firewall/[id] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update firewall rule." },
      { status: 400 },
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const deletedRule = await GeoFirewall.findByIdAndDelete(params.id);

    if (!deletedRule) {
      return NextResponse.json(
        { error: "Firewall rule not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Firewall rule deleted successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE /admin/geo-firewall/[id] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete firewall rule." },
      { status: 500 },
    );
  }
}
