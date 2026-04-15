import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { TeamModel } from "@/models/Team";
import { ADMIN_COOKIE_NAME, verifyAdminCookieValue } from "@/lib/admin-auth";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  try {
    const isAdmin = verifyAdminCookieValue(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
    if (!isAdmin) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const { teamId } = await context.params;
    if (!Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ message: "Invalid team id." }, { status: 400 });
    }

    await connectToDatabase();

    const deletedTeam = await TeamModel.findByIdAndDelete(teamId);
    if (!deletedTeam) {
      return NextResponse.json({ message: "Team not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Team deleted successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete team.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
