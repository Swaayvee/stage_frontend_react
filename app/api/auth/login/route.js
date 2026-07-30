import { NextResponse } from "next/server";
import { createSeedState } from "../../../../lib/seedData";
import { ROUTE_TO_ROLE } from "../../../../lib/domain";
import { createAccessToken } from "../../../../lib/server/jwt";
import { authenticateRegisteredAccount } from "../../../../lib/server/registrationRegistry";

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const expectedRole = ROUTE_TO_ROLE[body.routeRole];
  const email = body.email.trim().toLowerCase().slice(0, 254);
  let account = createSeedState().comptes.find(
    (item) => item.email.toLowerCase() === email && item.statutCompte === "actif"
  );
  if (!account) {
    const registered = await authenticateRegisteredAccount(email, body.password, expectedRole);
    if (registered) {
      account = {
        _id: registered.accountId,
        email: registered.email,
        role: registered.role,
        statutCompte: registered.status,
        motDePasseHash: body.password,
      };
    }
  }
  if (!account || account.motDePasseHash !== body.password || account.role !== expectedRole) {
    return NextResponse.json({ error: "Identifiants ou espace incorrects." }, { status: 401 });
  }
  const token = createAccessToken({ sub: account._id, role: account.role });
  const response = NextResponse.json({ accountId: account._id, role: account.role });
  response.cookies.set(`relayflow_access_${account.role}`, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });
  return response;
}
