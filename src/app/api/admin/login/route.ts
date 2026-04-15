import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminCookieValue,
  isValidAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const username = typeof body?.username === "string" ? body.username : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!isValidAdminCredentials(username, password)) {
    return NextResponse.json({ message: "Invalid admin credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ message: "Login successful." });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminCookieValue(), adminCookieOptions);
  return response;
}
