const COOKIE_NAME = "leadboard_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8;
const AUTH_COOKIE_VALUE = "authenticated";

function getAdminUsername() {
  return process.env.ADMIN_USERNAME || "";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

export function isValidAdminCredentials(username: string, password: string) {
  return username === getAdminUsername() && password === getAdminPassword();
}

export function createAdminCookieValue() {
  return AUTH_COOKIE_VALUE;
}

export function verifyAdminCookieValue(cookieValue: string | undefined) {
  return cookieValue === AUTH_COOKIE_VALUE;
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
