import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { TeamModel } from "@/models/Team";
import { ADMIN_COOKIE_NAME, verifyAdminCookieValue } from "@/lib/admin-auth";

const REQUIRED_PERSON_FIELDS = ["fullName", "nic", "contactNo", "email"] as const;

function isValidPerson(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return REQUIRED_PERSON_FIELDS.every((field) => {
    const value = (payload as Record<string, unknown>)[field];
    return typeof value === "string" && value.trim().length > 0;
  });
}

export async function PUT(
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
    if (
      !body ||
      typeof body !== "object" ||
      typeof body.teamName !== "string" ||
      typeof body.teamLogo !== "string" ||
      typeof body.teamSlogan !== "string" ||
      !isValidPerson(body.leader) ||
      !Array.isArray(body.members) ||
      body.members.length > 7 ||
      !body.members.every(isValidPerson)
    ) {
      return NextResponse.json({ message: "Invalid team payload. Team must contain leader + up to 7 members." }, { status: 400 });
    }

    await connectToDatabase();

    const updatedTeam = await TeamModel.findByIdAndUpdate(
      teamId,
      {
        teamName: body.teamName.trim(),
        teamLogo: body.teamLogo,
        teamSlogan: body.teamSlogan.trim(),
        leader: body.leader,
        members: body.members,
      },
      { new: true, runValidators: true }
    );

    if (!updatedTeam) {
      return NextResponse.json({ message: "Team not found." }, { status: 404 });
    }

    return NextResponse.json(updatedTeam);
  } catch (error) {
    const isDuplicateName =
      error instanceof Error &&
      "code" in error &&
      (error as Error & { code?: number }).code === 11000;

    const errorMessage = error instanceof Error ? error.message : "Failed to update team.";
    return NextResponse.json(
      { message: isDuplicateName ? "A team with this name already exists." : errorMessage },
      { status: isDuplicateName ? 409 : 500 }
    );
  }
}

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
