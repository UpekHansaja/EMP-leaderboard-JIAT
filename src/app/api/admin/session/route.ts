import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminCookieValue } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const isAuthenticated = verifyAdminCookieValue(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  return NextResponse.json({ isAuthenticated });
}
