import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { TeamModel } from "@/models/Team";
import { ADMIN_COOKIE_NAME, verifyAdminCookieValue } from "@/lib/admin-auth";

export async function PATCH(
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

    const body = await request.json();
    const markDelta = Number(body?.markDelta);
    if (!Number.isFinite(markDelta)) {
      return NextResponse.json({ message: "Mark adjustment must be a number." }, { status: 400 });
    }

    await connectToDatabase();

    const updated = await TeamModel.findByIdAndUpdate(
      teamId,
      { 
        $inc: { teamMark: markDelta },
        $push: { markLogs: { delta: markDelta, timestamp: new Date() } }
      },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ message: "Team not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update team marks.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
