import { clearAuthCookies } from "@/utils/auth/cookies";

export const runtime = "nodejs";

/** Clears the auth cookies. No upstream call is required. */
export async function POST() {
  await clearAuthCookies();
  return Response.json({ success: true, message: "Signed out" });
}
