import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { filterStateForActor, loadBusinessState } from "../../../../lib/server/database";
import { verifyAccessToken } from "../../../../lib/server/jwt";

export async function GET(request) {
  const cookieStore = await cookies();
  const roles = ["vendeur", "livreur", "manager", "super_manager"];
  const requestedRole = request.headers.get("x-relayflow-role");
  if (!roles.includes(requestedRole))
    return NextResponse.json({ error: "Rôle de session requis." }, { status: 400 });
  const actor = verifyAccessToken(cookieStore.get(`relayflow_access_${requestedRole}`)?.value);
  if (actor?.role !== requestedRole)
    return NextResponse.json({ error: "Session incohérente." }, { status: 401 });
  if (!actor) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  try {
    const state = filterStateForActor(await loadBusinessState(), actor);
    if (!state) return NextResponse.json({ error: "Compte inactif ou rôle invalide." }, { status: 403 });
    return NextResponse.json({ state }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Base de données indisponible." }, { status: 503 });
  }
}
