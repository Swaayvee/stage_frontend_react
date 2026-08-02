import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ROUTE_TO_ROLE } from "../../../lib/domain";
import { verifyAccessToken } from "../../../lib/server/jwt";
import {
  decidePendingAccount,
  registerPendingAccount,
} from "../../../lib/server/registrationRegistry";
import {
  applyBusinessRegistrationDecision,
  removeApplicationDocuments,
  storeApplicationDocuments,
  upsertBusinessRegistration,
} from "../../../lib/server/database";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeProfile(profile, role) {
  if (!profile || typeof profile !== "object") return null;
  const common = {
    nom: String(profile.nom || "").slice(0, 120),
    telephone: String(profile.telephone || "").slice(0, 30),
    adresse: String(profile.adresse || "").slice(0, 220),
    ville: String(profile.ville || "").slice(0, 100),
    departement: String(profile.departement || "").slice(0, 100),
    codePostal: String(profile.codePostal || "").slice(0, 12),
    codeCommune: String(profile.codeCommune || "").slice(0, 20),
    codeDepartement: String(profile.codeDepartement || "").slice(0, 8),
    profil: Object.fromEntries(
      Object.entries(profile.profil && typeof profile.profil === "object" ? profile.profil : {})
        .slice(0, 40)
        .map(([key, value]) => [String(key).slice(0, 100), String(value).slice(0, 500)])
    ),
    documents: Array.isArray(profile.documents)
      ? profile.documents.slice(0, 10).map((document) => ({
          nom: String(document?.nom || "document").slice(0, 180),
          type: String(document?.type || "application/octet-stream").slice(0, 100),
          taille: Math.max(0, Math.min(Number(document?.taille || 0), 10_000_000)),
          url: String(document?.url || "").slice(0, 500),
        }))
      : [],
  };
  return role === "vendeur"
    ? { ...common, raisonSociale: String(profile.raisonSociale || "").slice(0, 160), typeCommerce: String(profile.typeCommerce || "").slice(0, 80) }
    : { ...common, typeVehicule: String(profile.typeVehicule || "").slice(0, 80) };
}

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
    const applicationId = String(body.applicationId);
    const sanitizedProfile = sanitizeProfile(body.profile, role);
    const documents = await storeApplicationDocuments(applicationId, body.profile?.documents || []);
    const storedProfile = { ...sanitizedProfile, documents };
    try {
      await registerPendingAccount({
        applicationId,
        accountId: String(body.accountId),
        email: String(body.email).slice(0, 254),
        password: String(body.password).slice(0, 128),
        role,
        assignedManagerAccountIds: Array.isArray(body.assignedManagerAccountIds)
          ? body.assignedManagerAccountIds.map(String)
          : [],
        profile: storedProfile,
      });
      await upsertBusinessRegistration({
        accountId: String(body.accountId), applicationId,
        email: String(body.email), role, profile: storedProfile,
        managerIds: Array.isArray(body.managerIds) ? body.managerIds.map(String) : [],
      });
    } catch (error) {
      await removeApplicationDocuments(applicationId);
      throw error;
    }
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
    await applyBusinessRegistrationDecision(
      String(body.applicationId || ""), body.decision, actor.sub, String(body.commentaire || "")
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
}
