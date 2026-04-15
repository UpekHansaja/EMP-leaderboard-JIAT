import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TeamModel } from "@/models/Team";

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

export async function GET() {
  try {
    await connectToDatabase();
    const teams = await TeamModel.find({}).sort({ teamMark: -1, createdAt: 1 }).lean();
    return NextResponse.json(teams);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load teams.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      typeof body.teamName !== "string" ||
      typeof body.teamLogo !== "string" ||
      typeof body.teamSlogan !== "string" ||
      !isValidPerson(body.leader) ||
      !Array.isArray(body.members) ||
      body.members.length !== 8 ||
      !body.members.every(isValidPerson)
    ) {
      return NextResponse.json({ message: "Invalid team payload." }, { status: 400 });
    }

    await connectToDatabase();

    const createdTeam = await TeamModel.create({
      teamName: body.teamName.trim(),
      teamLogo: body.teamLogo,
      teamSlogan: body.teamSlogan.trim(),
      leader: body.leader,
      members: body.members,
      teamMark: 0,
    });

    return NextResponse.json(createdTeam, { status: 201 });
  } catch (error) {
    const isDuplicateName =
      error instanceof Error &&
      "code" in error &&
      (error as Error & { code?: number }).code === 11000;

    return NextResponse.json(
      { message: isDuplicateName ? "A team with this name already exists." : "Failed to register team." },
      { status: isDuplicateName ? 409 : 500 }
    );
  }
}
