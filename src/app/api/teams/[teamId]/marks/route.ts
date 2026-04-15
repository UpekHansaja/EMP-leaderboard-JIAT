import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { TeamModel } from "@/models/Team";
import { ADMIN_COOKIE_NAME, verifyAdminCookieValue } from "@/lib/admin-auth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> }
) {
  const isAdmin = verifyAdminCookieValue(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  if (!isAdmin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { teamId } = await context.params;
  if (!Types.ObjectId.isValid(teamId)) {
    return NextResponse.json({ message: "Invalid team id." }, { status: 400 });
  }

  const body = await request.json();
  const teamMark = Number(body?.teamMark);
  if (!Number.isFinite(teamMark) || teamMark < 0 || teamMark > 100) {
    return NextResponse.json({ message: "Team mark must be between 0 and 100." }, { status: 400 });
  }

  await connectToDatabase();

  const updated = await TeamModel.findByIdAndUpdate(
    teamId,
    { teamMark },
    { new: true, runValidators: true }
  );
  if (!updated) {
    return NextResponse.json({ message: "Team not found." }, { status: 404 });
  }

  return NextResponse.json(updated);
}
