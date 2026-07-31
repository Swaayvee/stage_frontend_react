import { NextResponse } from "next/server";

export async function POST(request) {
  const response = NextResponse.json({ ok: true });
  const allowedRoles = ["vendeur", "livreur", "manager", "super_manager"];
  allowedRoles.forEach((role) => {
    response.cookies.set(`relayflow_access_${role}`, "", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  });
  return response;
}
