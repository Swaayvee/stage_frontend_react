import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ROUTE_TO_ROLE } from "../../../lib/domain";
import { verifyAccessToken } from "../../../lib/server/jwt";
import {
  decidePendingAccount,
  registerPendingAccount,
} from "../../../lib/server/registrationRegistry";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const role = ROUTE_TO_ROLE[body?.routeRole];
  if (
    !body ||
    !["vendeur", "livreur"].includes(role) ||
    !emailPattern.test(String(body.email || "")) ||
    String(body.password || "").length < 10 ||
    !String(body.applicationId || "") ||
    !String(body.accountId || "")
  ) {
    return NextResponse.json({ error: "Données d'inscription invalides." }, { status: 400 });
  }
  try {
    await registerPendingAccount({
      applicationId: String(body.applicationId),
      accountId: String(body.accountId),
      email: String(body.email).slice(0, 254),
      password: String(body.password).slice(0, 128),
      role,
      assignedManagerAccountIds: Array.isArray(body.assignedManagerAccountIds)
        ? body.assignedManagerAccountIds.map(String)
        : [],
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
}

export async function PATCH(request) {
  const cookieStore = await cookies();
  const actor = verifyAccessToken(cookieStore.get("relayflow_access_manager")?.value);
  if (!actor || actor.role !== "manager")
    return NextResponse.json({ error: "Action réservée aux managers." }, { status: 403 });
  const body = await request.json().catch(() => null);
  if (!body || !["acceptee", "rejetee"].includes(body.decision))
    return NextResponse.json({ error: "Décision invalide." }, { status: 400 });
  try {
    await decidePendingAccount(String(body.applicationId || ""), actor.sub, body.decision);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
}
