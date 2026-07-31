import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import * as store from "../../../../lib/store";
import { filterStateForActor, loadBusinessState, saveBusinessState } from "../../../../lib/server/database";
import { verifyAccessToken } from "../../../../lib/server/jwt";
import { registerInternalManagerAccount, updateRegisteredPassword } from "../../../../lib/server/registrationRegistry";

const permissions = {
  vendeur: new Set(["createLivraison", "assignCourier", "decideDeliveryCandidate", "createSignalement", "sendIssueMessage", "markIssueMessagesRead", "submitEvaluation", "proposerPartenariat", "revoquerPartenariat", "updateProfile", "markNotificationRead", "markAllNotificationsRead"]),
  livreur: new Set(["acceptOffer", "refuseOffer", "confirmRetrait", "confirmLivraison", "markEchec", "createSignalement", "sendIssueMessage", "markIssueMessagesRead", "submitSellerEvaluation", "setStatutOperationnel", "accepterPartenariat", "rejeterPartenariat", "updateProfile", "updateLivreurCoords", "stopLivreurLocationSharing", "updateLivreurPreferences", "markNotificationRead", "markAllNotificationsRead"]),
  manager: new Set(["sendIssueMessage", "markIssueMessagesRead", "traiterSignalement", "suspendreCompte", "genererFacture", "genererBonPaiement", "marquerFacturePayee", "marquerBonPaye", "updateProfile", "markNotificationRead", "markAllNotificationsRead"]),
  super_manager: new Set(["sendIssueMessage", "markIssueMessagesRead", "traiterSignalement", "suspendreCompte", "reactiverCompte", "inviterGestionnaire", "genererFacture", "genererBonPaiement", "marquerFacturePayee", "marquerBonPaye", "updateProfile", "markNotificationRead", "markAllNotificationsRead"]),
};

const actorFirst = new Set([
  "createLivraison", "assignCourier", "decideDeliveryCandidate", "createSignalement",
  "sendIssueMessage", "markIssueMessagesRead", "proposerPartenariat", "revoquerPartenariat",
  "acceptOffer", "refuseOffer", "confirmRetrait", "confirmLivraison", "markEchec",
  "setStatutOperationnel", "accepterPartenariat", "rejeterPartenariat", "updateProfile",
  "updateLivreurCoords", "stopLivreurLocationSharing", "updateLivreurPreferences",
  "suspendreCompte", "inviterGestionnaire", "genererFacture",
  "genererBonPaiement", "marquerFacturePayee", "marquerBonPaye",
]);

let commandQueue = Promise.resolve();

function runSerialized(operation) {
  const next = commandQueue.then(operation);
  commandQueue = next.catch(() => {});
  return next;
}

export async function POST(request) {
  const raw = await request.text();
  if (raw.length > 64_000) return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
  const body = (() => { try { return JSON.parse(raw); } catch { return null; } })();
  if (!body || typeof body.action !== "string" || !Array.isArray(body.args))
    return NextResponse.json({ error: "Commande invalide." }, { status: 400 });

  const cookieStore = await cookies();
  const roles = Object.keys(permissions);
  const requestedRole = request.headers.get("x-relayflow-role");
  if (!roles.includes(requestedRole))
    return NextResponse.json({ error: "Rôle de session requis." }, { status: 400 });
  const actor = verifyAccessToken(cookieStore.get(`relayflow_access_${requestedRole}`)?.value);
  if (actor?.role !== requestedRole)
    return NextResponse.json({ error: "Session incohérente." }, { status: 401 });
  if (!actor) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  if (!permissions[actor.role]?.has(body.action))
    return NextResponse.json({ error: "Action interdite pour ce rôle." }, { status: 403 });

  try {
    return await runSerialized(async () => {
      const fullState = await loadBusinessState();
      const account = fullState.comptes.find((item) => item._id === actor.sub);
      if (!account || account.role !== actor.role || account.statutCompte !== "actif")
        return NextResponse.json({ error: "Compte inactif ou rôle incohérent." }, { status: 403 });
      store.replaceStateFromServer(fullState);
      const args = structuredClone(body.args).slice(0, 8);
      if (actorFirst.has(body.action)) args[0] = actor.sub;
      if (body.action === "submitSellerEvaluation") args[0] = { ...(args[0] || {}), auteurCompteId: actor.sub };
      if (body.action === "submitEvaluation") args[0] = { ...(args[0] || {}), auteurType: "vendeur", auteurCompteId: actor.sub };
      if (body.action === "traiterSignalement") args[1] = actor.sub;
      if (body.action === "markAllNotificationsRead") args[0] = actor.sub;
      if (body.action === "markNotificationRead") {
        const notification = fullState.notifications.find((item) => item._id === args[0]);
        if (notification?.compteId !== actor.sub) return NextResponse.json({ error: "Notification interdite." }, { status: 403 });
      }
      if (body.action === "reactiverCompte" && actor.role !== "super_manager")
        return NextResponse.json({ error: "Action réservée au Super Manager." }, { status: 403 });
      const requestedPassword = body.action === "updateProfile" ? args[1]?.password : null;
      if (body.action === "updateProfile" && args[1]) {
        args[1] = { ...args[1] };
        delete args[1].password;
      }
      const action = store.actions[body.action];
      if (typeof action !== "function") return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
      const result = action(...args);
      if (result?.ok === false) return NextResponse.json({ error: result.error || "Action refusée." }, { status: 422 });
      const updated = store.getState();
      if (requestedPassword) await updateRegisteredPassword(actor.sub, requestedPassword, account);
      if (body.action === "inviterGestionnaire") {
        const invitation = body.args[1] || {};
        const newAccount = updated.comptes.find((item) => item.email === String(invitation.email || "").trim().toLowerCase());
        const manager = updated.gestionnaires.find((item) => item.compteId === newAccount?._id);
        if (!newAccount || !manager) throw new Error("Manager créé mais profil introuvable.");
        await registerInternalManagerAccount({
          accountId: newAccount._id, email: newAccount.email, password: invitation.password,
          profile: { juridiction: manager.juridiction },
        });
      }
      await saveBusinessState(updated);
      return NextResponse.json({ result: result ?? { ok: true }, state: filterStateForActor(updated, actor) });
    });
  } catch {
    return NextResponse.json({ error: "La commande n'a pas pu être enregistrée dans MongoDB." }, { status: 503 });
  }
}
