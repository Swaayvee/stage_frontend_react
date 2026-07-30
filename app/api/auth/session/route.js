import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/server/jwt";

export async function GET(request) {
  const cookieStore = await cookies();
  const expectedRole = new URL(request.url).searchParams.get("role");
  const allowedRoles = ["vendeur", "livreur", "manager", "super_manager"];
  if (!allowedRoles.includes(expectedRole))
    return NextResponse.json({ authenticated: false }, { status: 400 });
  const payload = verifyAccessToken(cookieStore.get(`relayflow_access_${expectedRole}`)?.value);
  if (!payload) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({
    authenticated: true,
    accountId: payload.sub,
    role: payload.role,
  });
}
