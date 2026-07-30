import { NextResponse } from "next/server";
import { syncAcceptedDevelopmentAccount } from "../../../../lib/server/registrationRegistry";

export async function POST(request) {
  if (process.env.NODE_ENV === "production")
    return NextResponse.json({ error: "Route indisponible." }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (
    !body ||
    !["vendeur", "livreur"].includes(body.role) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    typeof body.accountId !== "string"
  ) {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
  try {
    await syncAcceptedDevelopmentAccount(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
}
