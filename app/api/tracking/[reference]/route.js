import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { initializeDatabase } from "../../../../lib/server/database";

function publicDelivery(delivery) {
  const { codeLivraison, coordonneesLivraison, ...safe } = delivery;
  return { ...safe, client: { nom: safe.client?.nom, prenom: safe.client?.prenom, adresse: safe.client?.adresse } };
}

export async function GET(_request, { params }) {
  const { reference } = await params;
  const db = await initializeDatabase();
  const delivery = await db.collection("livraisons").findOne({ publicTrackingToken: reference, suiviPublic: true });
  if (!delivery) return NextResponse.json({ error: "Lien indisponible." }, { status: 404 });
  const [seller, courier] = await Promise.all([
    db.collection("vendeurs").findOne({ _id: delivery.vendeurId }, { projection: { raisonSociale: 1 } }),
    delivery.livreurId ? db.collection("livreurs").findOne({ _id: delivery.livreurId }, { projection: { nom: 1, partagePositionActif: 1, positionActualiseeLe: 1 } }) : null,
  ]);
  const liveTracking = Boolean(courier?.partagePositionActif && Date.now() - new Date(courier?.positionActualiseeLe || 0).getTime() < 5 * 60 * 1000);
  return NextResponse.json({ livraison: publicDelivery(delivery), vendeur: seller, livreur: courier ? { nom: courier.nom, liveTracking } : null }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request, { params }) {
  const { reference } = await params;
  const body = await request.json().catch(() => null);
  const note = Number(body?.note);
  const commentaire = String(body?.commentaire || "").trim();
  if (!Number.isInteger(note) || note < 1 || note > 5 || commentaire.length < 3 || commentaire.length > 500)
    return NextResponse.json({ error: "Note ou avis invalide." }, { status: 400 });
  const db = await initializeDatabase();
  const delivery = await db.collection("livraisons").findOne({ publicTrackingToken: reference, suiviPublic: true, statut: "LIVREE" });
  if (!delivery?.livreurId) return NextResponse.json({ error: "Livraison non évaluable." }, { status: 404 });
  try {
    await db.collection("evaluations").insertOne({
      _id: `eval_${randomUUID()}`, livraisonId: delivery._id, livreurId: delivery.livreurId,
      vendeurId: delivery.vendeurId, auteurType: "client", cibleType: "livreur",
      auteurCompteId: null, note, commentaire, dateCreation: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) return NextResponse.json({ error: "Un avis a déjà été envoyé." }, { status: 409 });
    throw error;
  }
}
