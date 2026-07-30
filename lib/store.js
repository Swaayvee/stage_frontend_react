import { createSeedState } from "./seedData";
import {
  canTransition,
  courierCoversDelivery,
  inJurisdiction,
  ROLES,
  ROUTE_TO_ROLE,
  TARIF_ABONNEMENT_MENSUEL,
  TARIF_LIVRAISON_UNITAIRE,
  economieLivraison,
} from "./domain";

const STORAGE_KEY = "relayflow_store_v2";
const SESSION_KEY = "relayflow_session";

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

let state = null;
const listeners = new Set();

function normalizeRole(role) {
  if (role === "gestionnaire") return "manager";
  if (role === "super_gestionnaire") return "super_manager";
  return role;
}

function migrateStateRoles(currentState) {
  if (!currentState?.comptes) return currentState;
  currentState.evaluations = currentState.evaluations || [];
  currentState.applications = currentState.applications || [];
  currentState.offresLivraison = currentState.offresLivraison || [];
  currentState.messagesIncidents = currentState.messagesIncidents || [];
  currentState.comptes.forEach((compte) => {
    compte.role = normalizeRole(compte.role);
  });
  currentState.meta = currentState.meta || {};
  if ((currentState.meta.seedVersion || 0) < 3) {
    const seed = createSeedState();
    [
      "comptes",
      "vendeurs",
      "livreurs",
      "livraisons",
      "applications",
      "messagesIncidents",
    ].forEach((collectionName) => {
      const existing = new Set(
        (currentState[collectionName] || []).map((item) => item._id)
      );
      (seed[collectionName] || []).forEach((item) => {
        if (!existing.has(item._id)) currentState[collectionName].push(item);
      });
    });
    currentState.meta.deliverySeq = Math.max(
      Number(currentState.meta.deliverySeq || 0),
      Number(seed.meta.deliverySeq || 0)
    );
    currentState.meta.seedVersion = 3;
  }
  if ((currentState.meta.seedVersion || 0) < 4) {
    const seed = createSeedState();
    (seed.applications || []).forEach((seedApplication) => {
      const existingApplication = currentState.applications.find(
        (application) => application._id === seedApplication._id
      );
      if (existingApplication) {
        existingApplication.documents = seedApplication.documents;
      }
    });
    currentState.meta.seedVersion = 4;
  }
  if ((currentState.meta.seedVersion || 0) < 5) {
    const seed = createSeedState();
    currentState.livraisons.forEach((delivery) => {
      if (!delivery.economie) {
        delivery.economie = {
          ...economieLivraison(delivery.modePriseEnCharge),
          calculeeLe: delivery.dateSoumission || nowIso(),
        };
      }
    });
    ["factures", "bonsPaiement"].forEach((collectionName) => {
      (seed[collectionName] || []).forEach((seedRecord) => {
        const currentRecord = currentState[collectionName].find(
          (record) => record._id === seedRecord._id
        );
        if (currentRecord) Object.assign(currentRecord, seedRecord);
      });
      currentState[collectionName].forEach((record) => {
        if (!record.lignes) {
          record.lignes = [{
            type: collectionName === "factures" ? "abonnement" : "livraison",
            libelle: collectionName === "factures"
              ? "Montant historique avant détail"
              : "Rémunération historique avant détail",
            quantite: 1,
            prixUnitaire: record.montant ?? record.montantTotal ?? 0,
            montant: record.montant ?? record.montantTotal ?? 0,
          }];
        }
      });
    });
    currentState.meta.seedVersion = 5;
  }
  if ((currentState.meta.seedVersion || 0) < 6) {
    const seed = createSeedState();
    const seedDeliveries = new Map(seed.livraisons.map((item) => [item._id, item]));
    currentState.livraisons.forEach((delivery) => {
      const seedDelivery = seedDeliveries.get(delivery._id);
      if (delivery._id.startsWith("hist_del_") && seedDelivery) {
        delivery.dateReceptionPrevue = seedDelivery.dateReceptionPrevue;
      }
    });
    const seenTrackingNumbers = new Set();
    currentState.livraisons.forEach((delivery) => {
      if (!seenTrackingNumbers.has(delivery.numeroSuivi)) {
        seenTrackingNumbers.add(delivery.numeroSuivi);
        return;
      }
      currentState.meta.deliverySeq = Number(currentState.meta.deliverySeq || 56) + 1;
      delivery.numeroSuivi = `RF-2026-${String(currentState.meta.deliverySeq).padStart(3, "0")}`;
      seenTrackingNumbers.add(delivery.numeroSuivi);
    });
    const seedAccounts = new Map(seed.comptes.map((item) => [item._id, item]));
    currentState.comptes.forEach((account) => {
      if (!account.motDePasseHash && seedAccounts.get(account._id)?.motDePasseHash) {
        account.motDePasseHash = seedAccounts.get(account._id).motDePasseHash;
      }
    });
    currentState.livreurs.forEach((courier) => {
      courier.rayonRechercheKm = Number(courier.rayonRechercheKm || 5);
    });
    currentState.gestionnaires.forEach((manager) => {
      const seedManager = seed.gestionnaires.find((item) => item._id === manager._id);
      if (seedManager) {
        manager.nom = manager.nom || seedManager.nom;
        manager.telephone = manager.telephone || seedManager.telephone;
      }
    });
    currentState.meta.seedVersion = 6;
  }
  if ((currentState.meta.seedVersion || 0) < 7) {
    const seed = createSeedState();
    const refreshSeedRecords = (collectionName, shouldRefresh = () => true) => {
      currentState[collectionName] = currentState[collectionName] || [];
      (seed[collectionName] || []).filter(shouldRefresh).forEach((seedRecord) => {
        const currentRecord = currentState[collectionName].find(
          (record) => record._id === seedRecord._id
        );
        if (currentRecord) Object.assign(currentRecord, clone(seedRecord));
        else currentState[collectionName].push(clone(seedRecord));
      });
    };
    refreshSeedRecords("livraisons", (delivery) =>
      delivery._id.startsWith("del") || delivery._id.startsWith("hist_del_")
    );
    refreshSeedRecords("signalements");
    refreshSeedRecords("messagesIncidents");
    refreshSeedRecords("factures");
    refreshSeedRecords("bonsPaiement");
    refreshSeedRecords("notifications", (notification) => notification._id === "not1");
    currentState.meta.seedVersion = 7;
  }
  if ((currentState.meta.seedVersion || 0) < 8) {
    const seed = createSeedState();
    ["factures", "bonsPaiement"].forEach((collectionName) => {
      (seed[collectionName] || []).forEach((seedRecord) => {
        const currentRecord = currentState[collectionName]?.find(
          (record) => record._id === seedRecord._id
        );
        if (currentRecord) Object.assign(currentRecord, clone(seedRecord));
      });
    });
    currentState.meta.seedVersion = 8;
  }
  return currentState;
}

function emit() {
  listeners.forEach((fn) => fn(getState()));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  if (!state) loadState();
  return state;
}

export function loadState() {
  if (typeof window === "undefined") {
    if (!state) state = createSeedState();
    return state;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state = migrateStateRoles(raw ? JSON.parse(raw) : createSeedState());
  } catch {
    state = createSeedState();
  }
  return state;
}

function persist() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  emit();
}

export function resetDemoData() {
  state = createSeedState();
  persist();
}

/* ─── Session (JWT simulé côté client) ─── */

export function getSession() {
  if (typeof window === "undefined") return null;
  try {
    const legacy = localStorage.getItem(SESSION_KEY);
    const raw = sessionStorage.getItem(SESSION_KEY) || legacy;
    if (!raw) return null;
    if (legacy && !sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, legacy);
      localStorage.removeItem(SESSION_KEY);
    }
    const session = JSON.parse(raw);
    session.role = normalizeRole(session.role);
    session.routeRole = ROLES[session.role] || session.routeRole;
    if (session.exp && Date.now() > session.exp) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function setSession(compte) {
  const routeRole = ROLES[compte.role];
  const session = {
    compteId: compte._id,
    email: compte.email,
    role: compte.role,
    routeRole,
    token: btoa(JSON.stringify({ sub: compte._id, role: compte.role, iat: Date.now() })),
    exp: Date.now() + 8 * 60 * 60 * 1000,
  };
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    compte.derniereConnexion = nowIso();
    persist();
  }
  return session;
}

export function logout() {
  if (typeof window !== "undefined") sessionStorage.removeItem(SESSION_KEY);
}

export function login(email, password, expectedRouteRole) {
  loadState();
  const compte = state.comptes.find(
    (c) => c.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (!compte) return { ok: false, error: "E-mail ou mot de passe incorrect." };
  if (compte.statutCompte === "suspendu")
    return { ok: false, error: "Compte suspendu. Contactez un manager." };
  if (compte.motDePasseHash !== password)
    return { ok: false, error: "E-mail ou mot de passe incorrect." };
  const routeRole = ROLES[compte.role];
  if (expectedRouteRole && routeRole !== expectedRouteRole)
    return { ok: false, error: "Ce compte n'a pas accès à cet espace." };
  if (compte.statutCompte === "invite" && compte.role !== "manager")
    return { ok: false, error: "Compte en attente d'activation." };
  const session = setSession(compte);
  return { ok: true, session };
}

export function establishSession(accountId, expectedRouteRole) {
  loadState();
  const compte = state.comptes.find((item) => item._id === accountId);
  if (!compte || compte.statutCompte !== "actif")
    return { ok: false, error: "Compte introuvable ou non activé." };
  const routeRole = ROLES[compte.role];
  if (expectedRouteRole && routeRole !== expectedRouteRole)
    return { ok: false, error: "Ce compte n'a pas accès à cet espace." };
  return { ok: true, session: setSession(compte) };
}

export function loginDemo(expectedRouteRole) {
  loadState();
  const roleKey = ROUTE_TO_ROLE[expectedRouteRole];
  const compte = state.comptes.find((c) => c.role === roleKey && c.statutCompte === "actif");
  if (!compte) return { ok: false, error: "Aucun compte démo." };
  return { ok: true, session: setSession(compte) };
}

export function registerVendeur(payload) {
  loadState();
  if (state.comptes.some((c) => c.email === payload.email))
    return { ok: false, error: "Cet e-mail est déjà utilisé." };
  const compteId = uid("cmp");
  const vendeurId = uid("ven");
  state.comptes.push({
    _id: compteId,
    email: payload.email,
    motDePasseHash: payload.password,
    role: "vendeur",
    statutCompte: "actif",
    dateCreation: nowIso(),
  });
  state.vendeurs.push({
    _id: vendeurId,
    compteId,
    raisonSociale: payload.raisonSociale,
    telephone: payload.telephone,
    adresse: payload.adresse,
    ville: payload.ville,
    departement: payload.departement,
    dateCreation: nowIso(),
  });
  state.abonnements.push({
    _id: uid("abo"),
    vendeurId,
    montantMensuel: TARIF_ABONNEMENT_MENSUEL,
    statut: "actif",
    dateDebut: nowIso(),
    dateFin: null,
  });
  persist();
  return { ok: true, compteId };
}

export function registerLivreur(payload) {
  loadState();
  if (state.comptes.some((c) => c.email === payload.email))
    return { ok: false, error: "Cet e-mail est déjà utilisé." };
  const compteId = uid("cmp");
  state.comptes.push({
    _id: compteId,
    email: payload.email,
    motDePasseHash: payload.password,
    role: "livreur",
    statutCompte: "actif",
    dateCreation: nowIso(),
  });
  state.livreurs.push({
    _id: uid("liv"),
    compteId,
    nom: payload.nom,
    adresse: payload.adresse,
    ville: payload.ville,
    departement: payload.departement,
    typeVehicule: payload.typeVehicule,
    statutOperationnel: "disponible",
    coordonnees: null,
    zonesCouvertes: [{
      ville: payload.ville,
      departement: payload.departement,
      codePostal: payload.codePostal || "",
      codeCommune: payload.codeCommune || "",
      codeDepartement: payload.codeDepartement || "",
      coordonnees: payload.coordonnees || null,
    }],
  });
  persist();
  return { ok: true, compteId };
}

/* ─── Helpers entités ─── */

export function findCompte(id) {
  return getState().comptes.find((c) => c._id === id);
}

export function profileForCompte(compteId) {
  const s = getState();
  const c = findCompte(compteId);
  if (!c) return null;
  if (c.role === "vendeur")
    return { type: "vendeur", ...s.vendeurs.find((v) => v.compteId === compteId) };
  if (c.role === "livreur")
    return { type: "livreur", ...s.livreurs.find((l) => l.compteId === compteId) };
  if (c.role === "manager")
    return { type: "manager", ...s.gestionnaires.find((g) => g.compteId === compteId) };
  return { type: "super_manager" };
}

export function displayNameForCompte(compteId) {
  const p = profileForCompte(compteId);
  if (!p) return "Utilisateur";
  if (p.type === "vendeur") return p.raisonSociale;
  if (p.type === "livreur") return p.nom;
  if (p.type === "manager") return "Manager";
  return "Super Manager";
}

function pushNotification(compteId, type, titre, contenu, lienRessource) {
  state.notifications.unshift({
    _id: uid("not"),
    compteId,
    type,
    titre,
    contenu,
    lienRessource,
    lu: false,
    dateEnvoi: nowIso(),
  });
}

function issueParticipantAccountIds(issue) {
  const participants = new Set();
  if (issue?.auteurId) participants.add(issue.auteurId);
  const delivery = issue?.livraisonId
    ? state.livraisons.find((item) => item._id === issue.livraisonId)
    : null;
  const seller = delivery
    ? state.vendeurs.find((item) => item._id === delivery.vendeurId)
    : null;
  const courier = delivery?.livreurId
    ? state.livreurs.find((item) => item._id === delivery.livreurId)
    : null;
  if (seller?.compteId) participants.add(seller.compteId);
  if (courier?.compteId) participants.add(courier.compteId);
  return [...participants].filter((accountId) => {
    const role = state.comptes.find((account) => account._id === accountId)?.role;
    return role === "vendeur" || role === "livreur";
  });
}

function canManageIssue(account, issue) {
  if (account?.role === "super_manager") return true;
  if (account?.role !== "manager") return false;
  const manager = state.gestionnaires.find((item) => item.compteId === account._id);
  if (!manager) return false;
  if (issue.gestionnaireAssigneId === manager._id) return true;
  return issueParticipantAccountIds(issue).some((accountId) =>
    inJurisdiction(profileForCompte(accountId), manager.juridiction)
  );
}

export function sendIssueMessage(senderCompteId, signalementId, recipientCompteIds, content) {
  loadState();
  const sender = state.comptes.find((account) => account._id === senderCompteId);
  const issue = state.signalements.find(
    (item) => item._id === signalementId || item.ref === signalementId
  );
  const cleanContent = String(content || "").trim();
  if (!sender || !issue) return { ok: false, error: "Conversation introuvable." };
  if (cleanContent.length < 2 || cleanContent.length > 1000)
    return { ok: false, error: "Le message doit contenir entre 2 et 1 000 caractères." };

  const participants = issueParticipantAccountIds(issue);
  const assignedManager = state.gestionnaires.find(
    (item) => item._id === issue.gestionnaireAssigneId
  );
  const managerRecipients = [
    assignedManager?.compteId,
    ...state.comptes
      .filter((account) => account.role === "super_manager")
      .map((account) => account._id),
  ].filter(Boolean);
  const senderCanManage = canManageIssue(sender, issue);
  if (!senderCanManage && !participants.includes(senderCompteId))
    return { ok: false, error: "Vous ne participez pas à ce dossier." };

  const allowedRecipients = senderCanManage ? participants : managerRecipients;
  const recipients = [...new Set(Array.isArray(recipientCompteIds) ? recipientCompteIds : [])]
    .filter((accountId) => allowedRecipients.includes(accountId))
    .filter((accountId) => accountId !== senderCompteId);
  if (!recipients.length)
    return { ok: false, error: "Sélectionnez au moins un destinataire autorisé." };

  const message = {
    _id: uid("msg"),
    signalementId: issue._id,
    expediteurCompteId: senderCompteId,
    destinataireCompteIds: recipients,
    contenu: cleanContent,
    dateCreation: nowIso(),
    luParCompteIds: [senderCompteId],
  };
  state.messagesIncidents.unshift(message);
  if (senderCanManage && issue.statut === "ouvert") {
    issue.statut = "en_traitement";
    issue.historique = issue.historique || [];
    issue.historique.push({
      statut: "en_traitement",
      acteurId: senderCompteId,
      quand: nowIso(),
      commentaire: "Prise de contact avec les parties concernées.",
    });
  }
  recipients.forEach((accountId) => {
    const role = state.comptes.find((account) => account._id === accountId)?.role;
    const routeRole = ROLES[role];
    const link = role === "manager" || role === "super_manager"
      ? `/${routeRole}/issues/${issue.ref || issue._id}`
      : `/${routeRole}/messages`;
    pushNotification(
      accountId,
      "message_recu",
      `Nouveau message · ${issue.ref || issue._id}`,
      cleanContent.slice(0, 140),
      link
    );
  });
  persist();
  return { ok: true, message };
}

export function markIssueMessagesRead(compteId, signalementId) {
  loadState();
  let changed = false;
  state.messagesIncidents
    .filter(
      (message) =>
        message.signalementId === signalementId &&
        message.destinataireCompteIds?.includes(compteId)
    )
    .forEach((message) => {
      message.luParCompteIds = message.luParCompteIds || [];
      if (!message.luParCompteIds.includes(compteId)) {
        message.luParCompteIds.push(compteId);
        changed = true;
      }
    });
  if (changed) persist();
  return { ok: true };
}

function transitionLivraison(livraison, nouveauStatut, parQui, commentaire = "") {
  const ancien = livraison.statut;
  if (!canTransition(ancien, nouveauStatut)) {
    return { ok: false, error: `Transition interdite : ${ancien} → ${nouveauStatut}` };
  }
  livraison.statut = nouveauStatut;
  livraison.historique = livraison.historique || [];
  livraison.historique.push({
    ancienStatut: ancien,
    nouveauStatut,
    parQui,
    quand: nowIso(),
    commentaire,
  });
  const vendeur = state.vendeurs.find((v) => v._id === livraison.vendeurId);
  const vendeurCompte = vendeur && state.comptes.find((c) => c._id === vendeur.compteId);
  if (vendeurCompte) {
    pushNotification(
      vendeurCompte._id,
      "maj_etat_livraison",
      "Mise à jour livraison",
      `${livraison.numeroSuivi} : ${ancien} → ${nouveauStatut}`,
      "/merchant/deliveries"
    );
  }
  if (livraison.livreurId) {
    const liv = state.livreurs.find((l) => l._id === livraison.livreurId);
    if (liv) {
      pushNotification(
        liv.compteId,
        "maj_etat_livraison",
        "Mise à jour livraison",
        `${livraison.numeroSuivi} : ${ancien} → ${nouveauStatut}`,
        "/courier/deliveries"
      );
    }
  }
  return { ok: true };
}

export function createLivraison(vendeurCompteId, data) {
  loadState();
  const vendeur = state.vendeurs.find((v) => v.compteId === vendeurCompteId);
  if (!vendeur) return { ok: false, error: "Profil vendeur introuvable." };

  state.meta.deliverySeq += 1;
  const numeroSuivi = `RF-2026-${String(state.meta.deliverySeq).padStart(3, "0")}`;
  const mode = data.modePriseEnCharge;
  let statut = "SOUMISE";
  const historique = [];

  if (mode === "propre") {
    statut = "ACCEPTEE";
    historique.push({
      ancienStatut: "SOUMISE",
      nouveauStatut: "ACCEPTEE",
      parQui: vendeurCompteId,
      quand: nowIso(),
      commentaire: "Mode propre — pas de tour d'offre",
    });
  }

  const livraison = {
    _id: uid("del"),
    numeroSuivi,
    vendeurId: vendeur._id,
    modePriseEnCharge: mode,
    livreurId: null,
    client: {
      nom: data.clientNom,
      prenom: data.clientPrenom,
      telephone: data.clientTelephone || "",
      adresse: data.adresseLivraison,
    },
    villeLivraison: data.villeLivraison || vendeur.ville,
    departementLivraison: data.departementLivraison || vendeur.departement,
    codePostalLivraison: data.codePostalLivraison || "",
    codeCommuneLivraison: data.codeCommuneLivraison || "",
    codeDepartementLivraison: data.codeDepartementLivraison || "",
    coordonneesLivraison: data.coordonneesLivraison || null,
    nomLivreurTexte: mode === "propre" ? data.nomLivreurTexte : undefined,
    descriptionContenu: data.descriptionContenu,
    suiviPublic: Boolean(data.suiviPublic),
    publicTrackingToken: data.suiviPublic ? uid("track") : null,
    poolAttribution:
      mode === "pool_plateforme"
        ? data.poolAttribution === "validation_vendeur"
          ? "validation_vendeur"
          : "automatique"
        : null,
    economie: {
      ...economieLivraison(mode),
      calculeeLe: nowIso(),
    },
    statut,
    dateSoumission: nowIso(),
    dateReceptionPrevue: data.dateReceptionPrevue,
    codeLivraison: Math.random().toString(36).slice(2, 8).toUpperCase(),
    tentatives: 1,
    historique,
  };

  state.livraisons.unshift(livraison);

  if (mode === "pool_plateforme") {
    state.livreurs.forEach((liv) => {
      if (liv.statutOperationnel !== "disponible") return;
      if (!courierCoversDelivery(liv, livraison)) return;
      pushNotification(
        liv.compteId,
        "maj_etat_livraison",
        "Nouvelle offre de livraison",
        `${numeroSuivi} · ${vendeur.raisonSociale}`,
        "/courier/available"
      );
    });
  }

  persist();
  return { ok: true, livraison };
}

export function acceptOffer(livreurRef, livraisonId) {
  loadState();
  const livreur = state.livreurs.find(
    (l) => l.compteId === livreurRef || l._id === livreurRef
  );
  if (!livreur) return { ok: false, error: "Profil livreur introuvable." };
  if (livreur.statutOperationnel !== "disponible")
    return { ok: false, error: "Passez en statut « disponible » pour accepter." };

  const livraison = state.livraisons.find((d) => d._id === livraisonId);
  if (!livraison) return { ok: false, error: "Livraison introuvable." };
  if (livraison.statut !== "SOUMISE")
    return { ok: false, error: "Cette livraison n'est plus disponible." };
  if (livraison.modePriseEnCharge !== "pool_plateforme")
    return { ok: false, error: "Une livraison d'équipe est attribuée par le commerçant." };
  if (!courierCoversDelivery(livreur, livraison))
    livraison.suggestionHorsZone = true;

  if (
    livraison.modePriseEnCharge === "pool_plateforme" &&
    livraison.poolAttribution === "validation_vendeur"
  ) {
    const existing = state.offresLivraison.find(
      (offer) => offer.livraisonId === livraisonId && offer.livreurId === livreur._id
    );
    if (existing) return { ok: false, error: "Vous avez déjà candidaté à cette livraison." };
    const offer = {
      _id: uid("off"),
      livraisonId,
      livreurId: livreur._id,
      statut: "en_attente",
      dateCreation: nowIso(),
    };
    state.offresLivraison.push(offer);
    const vendeur = state.vendeurs.find((item) => item._id === livraison.vendeurId);
    if (vendeur) {
      pushNotification(
        vendeur.compteId,
        "livraison_attribuee",
        "Nouvelle candidature de livreur",
        `${livraison.numeroSuivi} · ${livreur.nom}`,
        "/merchant/deliveries"
      );
    }
    persist();
    return { ok: true, candidature: true, offer };
  }

  livraison.livreurId = livreur._id;
  const r = transitionLivraison(livraison, "ACCEPTEE", livreur.compteId, "Offre acceptée");
  if (!r.ok) return r;
  persist();
  return { ok: true };
}

export function assignCourier(vendeurCompteId, livraisonId, livreurId) {
  loadState();
  const vendeur = state.vendeurs.find((item) => item.compteId === vendeurCompteId);
  const livraison = state.livraisons.find(
    (item) => item._id === livraisonId && item.vendeurId === vendeur?._id
  );
  const livreur = state.livreurs.find((item) => item._id === livreurId);
  if (!vendeur || !livraison) return { ok: false, error: "Livraison inaccessible." };
  if (!livreur || livreur.statutOperationnel !== "disponible")
    return { ok: false, error: "Ce livreur n'est pas disponible." };
  if (livraison.statut !== "SOUMISE")
    return { ok: false, error: "Cette livraison est déjà attribuée." };
  if (livraison.modePriseEnCharge === "pool_plateforme")
    return { ok: false, error: "En pool, choisissez uniquement parmi les livreurs candidats." };
  if (livraison.modePriseEnCharge !== "equipe")
    return { ok: false, error: "Cette livraison ne nécessite pas d'assignation d'équipe." };
  const activePartnership = state.partenariats.some(
    (partnership) =>
      partnership.vendeurId === vendeur._id &&
      partnership.livreurId === livreur._id &&
      partnership.statut === "actif"
  );
  if (!activePartnership)
    return { ok: false, error: "Ce livreur ne fait pas partie de votre équipe active." };
  if (!courierCoversDelivery(livreur, livraison))
    return { ok: false, error: "Ce livreur ne couvre pas la zone de livraison." };
  livraison.livreurId = livreur._id;
  const result = transitionLivraison(
    livraison,
    "ACCEPTEE",
    vendeurCompteId,
    `Assignation directe à ${livreur.nom}`
  );
  if (!result.ok) return result;
  pushNotification(
    livreur.compteId,
    "livraison_attribuee",
    "Une livraison vous a été attribuée",
    livraison.numeroSuivi,
    "/courier/deliveries"
  );
  persist();
  return { ok: true, livraison };
}

export function decideDeliveryCandidate(vendeurCompteId, offerId, decision) {
  loadState();
  const vendeur = state.vendeurs.find((item) => item.compteId === vendeurCompteId);
  const offer = state.offresLivraison.find((item) => item._id === offerId);
  const livraison = state.livraisons.find(
    (item) => item._id === offer?.livraisonId && item.vendeurId === vendeur?._id
  );
  const livreur = state.livreurs.find((item) => item._id === offer?.livreurId);
  if (!vendeur || !offer || !livraison || !livreur)
    return { ok: false, error: "Candidature inaccessible." };
  if (offer.statut !== "en_attente" || livraison.statut !== "SOUMISE")
    return { ok: false, error: "Cette candidature n'est plus disponible." };
  if (!["acceptee", "rejetee"].includes(decision))
    return { ok: false, error: "Décision invalide." };
  if (decision === "rejetee") {
    offer.statut = "rejetee";
    offer.dateDecision = nowIso();
    pushNotification(
      livreur.compteId,
      "information",
      "Candidature non retenue",
      livraison.numeroSuivi,
      "/courier/available"
    );
    persist();
    return { ok: true, offer };
  }
  if (livreur.statutOperationnel !== "disponible")
    return { ok: false, error: "Ce livreur n'est plus disponible." };
  livraison.livreurId = livreur._id;
  const transition = transitionLivraison(
    livraison,
    "ACCEPTEE",
    vendeurCompteId,
    `Candidature de ${livreur.nom} validée par le commerçant`
  );
  if (!transition.ok) return transition;
  offer.statut = "acceptee";
  offer.dateDecision = nowIso();
  state.offresLivraison
    .filter((item) => item.livraisonId === livraison._id && item._id !== offer._id)
    .forEach((item) => {
      if (item.statut === "en_attente") item.statut = "rejetee";
    });
  pushNotification(
    livreur.compteId,
    "livraison_attribuee",
    "Votre candidature est acceptée",
    livraison.numeroSuivi,
    "/courier/deliveries"
  );
  persist();
  return { ok: true, livraison, offer };
}

export function refuseOffer(livreurCompteId, livraisonId, motif) {
  loadState();
  if (!motif?.trim()) return { ok: false, error: "Motif obligatoire." };
  const livraison = state.livraisons.find((d) => d._id === livraisonId);
  if (!livraison) return { ok: false, error: "Livraison introuvable." };
  livraison.historique.push({
    ancienStatut: livraison.statut,
    nouveauStatut: "REFUSEE",
    parQui: livreurCompteId,
    quand: nowIso(),
    commentaire: motif,
  });
  persist();
  return { ok: true };
}

export function confirmRetrait(livreurCompteId, livraisonId) {
  loadState();
  const livraison = state.livraisons.find((d) => d._id === livraisonId);
  if (!livraison?.livreurId) return { ok: false, error: "Livraison non assignée." };
  const liv = state.livreurs.find((l) => l.compteId === livreurCompteId);
  if (liv?._id !== livraison.livreurId)
    return { ok: false, error: "Accès refusé à cette livraison." };
  const r = transitionLivraison(livraison, "RETIREE", livreurCompteId, "Retrait confirmé");
  if (!r.ok) return r;
  persist();
  return { ok: true };
}

export function confirmLivraison(livreurCompteId, livraisonId, { code, urlPreuve }) {
  loadState();
  const livraison = state.livraisons.find((d) => d._id === livraisonId);
  const liv = state.livreurs.find((l) => l.compteId === livreurCompteId);
  if (liv?._id !== livraison?.livreurId)
    return { ok: false, error: "Accès refusé." };
  if (code && code !== livraison.codeLivraison)
    return { ok: false, error: "Code de livraison incorrect." };
  if (!code && !urlPreuve)
    return { ok: false, error: "Code ou preuve photo requis." };
  if (urlPreuve) livraison.urlPreuve = urlPreuve;
  const r = transitionLivraison(livraison, "LIVREE", livreurCompteId, code ? "Code validé" : "Photo justificative");
  if (!r.ok) return r;
  persist();
  return { ok: true };
}

export function markEchec(livreurCompteId, livraisonId, motif) {
  loadState();
  if (!motif?.trim()) return { ok: false, error: "Motif obligatoire." };
  const livraison = state.livraisons.find((d) => d._id === livraisonId);
  const liv = state.livreurs.find((l) => l.compteId === livreurCompteId);
  if (liv?._id !== livraison?.livreurId) return { ok: false, error: "Accès refusé." };
  livraison.motifEchec = motif;
  const r = transitionLivraison(livraison, "ECHOUEE", livreurCompteId, motif);
  if (!r.ok) return r;
  persist();
  return { ok: true };
}

export function redistribuer(livraisonId, parQui) {
  loadState();
  const livraison = state.livraisons.find((d) => d._id === livraisonId);
  if (livraison?.statut !== "ECHOUEE")
    return { ok: false, error: "Seules les livraisons échouées peuvent être redistribuées." };
  livraison.livreurId = null;
  livraison.tentatives = (livraison.tentatives || 1) + 1;
  const r = transitionLivraison(livraison, "SOUMISE", parQui, "Redistribution — nouveau tour d'attribution");
  if (!r.ok) return r;
  persist();
  return { ok: true };
}

export function createSignalement(auteurId, data) {
  loadState();
  state.meta.signalementSeq += 1;
  const id = `SIG-${String(state.meta.signalementSeq).padStart(3, "0")}`;
  const profile = profileForCompte(auteurId);
  let gestionnaire = state.gestionnaires.find((g) =>
    inJurisdiction(profile, g.juridiction)
  );
  if (!gestionnaire) gestionnaire = state.gestionnaires[0];

  const sig = {
    _id: uid("sig"),
    ref: id,
    type: data.type,
    livraisonId: data.livraisonId || null,
    auteurId,
    gestionnaireAssigneId: gestionnaire?._id,
    description: data.description,
    statut: "ouvert",
    dateCreation: nowIso(),
    historique: [{ statut: "ouvert", acteurId: auteurId, quand: nowIso(), commentaire: data.description }],
  };
  state.signalements.unshift(sig);
  if (gestionnaire) {
    const gc = state.comptes.find((c) => c._id === gestionnaire.compteId);
    if (gc)
      pushNotification(
        gc._id,
        "urgence",
        "Nouveau signalement",
        `${id} · ${data.type}`,
        "/manager/issues"
      );
  }
  persist();
  return { ok: true, signalement: sig };
}

export function traiterSignalement(sigId, gestionnaireCompteId, decision, commentaire) {
  loadState();
  const sig = state.signalements.find((s) => s._id === sigId);
  if (!sig) return { ok: false, error: "Signalement introuvable." };
  const actor = state.comptes.find((item) => item._id === gestionnaireCompteId);
  const manager = state.gestionnaires.find((item) => item.compteId === gestionnaireCompteId);
  if (actor?.role === "manager" && sig.gestionnaireAssigneId !== manager?._id)
    return { ok: false, error: "Signalement hors de votre juridiction." };
  if (actor?.role === "super_manager" && sig.statut !== "escalade")
    return { ok: false, error: "Seuls les signalements escaladés peuvent être arbitrés." };
  if (!["manager", "super_manager"].includes(actor?.role))
    return { ok: false, error: "Action non autorisée." };
  if (decision === "escalade") {
    sig.statut = "escalade";
    state.comptes
      .filter((c) => c.role === "super_manager")
      .forEach((c) =>
        pushNotification(c._id, "urgence", "Signalement escaladé", sig.ref || sig._id, "/super_manager/issues")
      );
  } else {
    sig.statut = decision === "resolu" ? "resolu" : "rejete";
    sig.commentaireResolution = commentaire;
    sig.dateResolution = nowIso();
  }
  sig.historique.push({
    statut: sig.statut,
    acteurId: gestionnaireCompteId,
    quand: nowIso(),
    commentaire,
  });
  persist();
  return { ok: true };
}

export function submitApplication(payload) {
  loadState();
  const email = String(payload.email || "").trim().toLowerCase();
  const phone = String(payload.telephone || "").trim();
  const city = String(payload.ville || "").trim();
  const department = String(payload.departement || "").trim();
  const password = String(payload.password || "");
  if (!["vendeur", "livreur"].includes(payload.role))
    return { ok: false, error: "Profil d'inscription invalide." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: "Adresse e-mail invalide." };
  if (phone.replace(/\D/g, "").length !== 10)
    return { ok: false, error: "Le numéro de téléphone doit contenir 10 chiffres." };
  if (password.length < 10)
    return { ok: false, error: "Le mot de passe doit contenir au moins 10 caractères." };
  if (!city || !department)
    return { ok: false, error: "La ville et le département sont obligatoires." };
  if (
    state.comptes.some((account) => account.email.toLowerCase() === email) ||
    state.applications.some((application) => application.email === email && application.statut === "en_attente")
  ) return { ok: false, error: "Une demande ou un compte existe déjà pour cet e-mail." };

  const creatingManager = payload.createdByManagerCompteId
    ? state.gestionnaires.find((manager) => manager.compteId === payload.createdByManagerCompteId)
    : null;
  if (payload.createdByManagerCompteId && !creatingManager)
    return { ok: false, error: "Action réservée aux managers." };
  if (
    creatingManager &&
    !inJurisdiction(
      {
        ville: city,
        departement: department,
        codeCommune: String(payload.codeCommune || ""),
        codeDepartement: String(payload.codeDepartement || ""),
      },
      creatingManager.juridiction
    )
  ) return { ok: false, error: "Cet utilisateur se trouve en dehors de votre périmètre." };

  const cityManagers = state.gestionnaires.filter(
    (manager) =>
      manager.juridiction?.niveau === "ville" &&
      (
        (payload.codeCommune &&
          manager.juridiction?.code &&
          manager.juridiction.code === payload.codeCommune) ||
        manager.juridiction?.valeur
          ?.normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase() === city
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
      )
  );
  const assignedManagers = creatingManager
    ? [creatingManager]
    : cityManagers.length
      ? cityManagers
      : state.gestionnaires;
  const compteId = uid("cmp");
  const profilId = uid(payload.role === "vendeur" ? "ven" : "liv");
  state.comptes.push({
    _id: compteId,
    email,
    motDePasseHash: null,
    role: payload.role,
    statutCompte: "invite",
    dateCreation: nowIso(),
  });
  if (payload.role === "vendeur") {
    state.vendeurs.push({
      _id: profilId,
      compteId,
      raisonSociale: String(payload.raisonSociale || payload.nom || "").trim(),
      telephone: phone,
      adresse: String(payload.adresse || "").trim(),
      ville: city,
      departement: department,
      codeCommune: String(payload.codeCommune || ""),
      codeDepartement: String(payload.codeDepartement || ""),
      codePostal: String(payload.codePostal || ""),
      dateCreation: nowIso(),
    });
  } else {
    state.livreurs.push({
      _id: profilId,
      compteId,
      nom: String(payload.nom || "").trim(),
      telephone: phone,
      adresse: String(payload.adresse || "").trim(),
      ville: city,
      departement: department,
      codeCommune: String(payload.codeCommune || ""),
      codeDepartement: String(payload.codeDepartement || ""),
      codePostal: String(payload.codePostal || ""),
      typeVehicule: String(payload.typeVehicule || "").trim(),
      statutOperationnel: "indisponible",
      coordonnees: null,
      zonesCouvertes: [{
        ville: city,
        departement: department,
        codePostal: String(payload.codePostal || ""),
        codeCommune: String(payload.codeCommune || ""),
        codeDepartement: String(payload.codeDepartement || ""),
        coordonnees: payload.coordonnees || null,
      }],
    });
  }
  const application = {
    _id: uid("app"),
    reference: `APP-${String((state.applications?.length || 0) + 1).padStart(4, "0")}`,
    role: payload.role,
    nom: String(payload.nom || "").trim(),
    raisonSociale: String(payload.raisonSociale || "").trim(),
    email,
    telephone: phone,
    adresse: String(payload.adresse || "").trim(),
    ville: city,
    departement: department,
    codeCommune: String(payload.codeCommune || ""),
    codeDepartement: String(payload.codeDepartement || ""),
    codePostal: String(payload.codePostal || ""),
    typeVehicule: String(payload.typeVehicule || "").trim(),
    compteId,
    profilId,
    profil: payload.profil || {},
    documents: Array.isArray(payload.documents)
      ? payload.documents.map((document) => ({
          nom: String(document.nom || "").slice(0, 160),
          type: String(document.type || "").slice(0, 100),
          taille: Number(document.taille || 0),
        }))
      : [],
    statut: "en_attente",
    managerIds: assignedManagers.map((manager) => manager._id),
    fallbackTousManagers: !creatingManager && cityManagers.length === 0,
    creeParManagerCompteId: creatingManager?.compteId || null,
    dateCreation: nowIso(),
    historique: [{
      statut: "en_attente",
      acteurId: null,
      quand: nowIso(),
      commentaire: creatingManager
        ? "Compte créé directement par un manager."
        : cityManagers.length
          ? "Routée vers le manager de la ville."
          : "Aucun manager de ville : visible par tous les managers.",
    }],
  };
  state.applications.unshift(application);
  if (!creatingManager) {
    assignedManagers.forEach((manager) => {
      pushNotification(
        manager.compteId,
        "urgence",
        "Nouvelle demande d'inscription",
        `${application.reference} · ${application.role} · ${application.ville}`,
        "/manager/applications"
      );
    });
  }
  persist();
  return { ok: true, application };
}

export function decideApplication(managerCompteId, applicationId, decision, commentaire = "") {
  loadState();
  const manager = state.gestionnaires.find((item) => item.compteId === managerCompteId);
  const application = state.applications.find((item) => item._id === applicationId);
  if (!manager || !application || !application.managerIds.includes(manager._id))
    return { ok: false, error: "Demande inaccessible." };
  if (application.statut !== "en_attente")
    return { ok: false, error: "Cette demande a déjà été traitée." };
  if (!["acceptee", "rejetee"].includes(decision))
    return { ok: false, error: "Décision invalide." };
  application.statut = decision;
  application.traiteParManagerId = manager._id;
  application.dateDecision = nowIso();
  application.historique.push({
    statut: decision,
    acteurId: managerCompteId,
    quand: nowIso(),
    commentaire: String(commentaire || "").trim(),
  });
  const compte = state.comptes.find((item) => item._id === application.compteId);
  if (compte) compte.statutCompte = decision === "acceptee" ? "actif" : "suspendu";

  if (decision === "acceptee" && application.role === "vendeur") {
    const hasSubscription = state.abonnements.some(
      (subscription) => subscription.vendeurId === application.profilId
    );
    if (!hasSubscription) {
      state.abonnements.push({
        _id: uid("abo"),
        vendeurId: application.profilId,
        montantMensuel: TARIF_ABONNEMENT_MENSUEL,
        statut: "actif",
        dateDebut: nowIso(),
        dateFin: null,
      });
    }
  }
  if (decision === "acceptee" && application.role === "livreur") {
    const courier = state.livreurs.find((item) => item._id === application.profilId);
    if (courier) courier.statutOperationnel = "disponible";
  }
  if (compte) {
    pushNotification(
      compte._id,
      decision === "acceptee" ? "succes" : "information",
      decision === "acceptee" ? "Votre inscription est acceptée" : "Votre inscription est refusée",
      String(commentaire || "").trim() || application.reference,
      `/${ROLES[application.role]}/login`
    );
  }
  persist();
  return { ok: true, application };
}

export function rollbackApplication(applicationId) {
  loadState();
  const application = state.applications.find((item) => item._id === applicationId);
  if (!application || application.statut !== "en_attente") return { ok: false };
  state.applications = state.applications.filter((item) => item._id !== applicationId);
  state.comptes = state.comptes.filter((item) => item._id !== application.compteId);
  if (application.role === "vendeur")
    state.vendeurs = state.vendeurs.filter((item) => item._id !== application.profilId);
  else
    state.livreurs = state.livreurs.filter((item) => item._id !== application.profilId);
  persist();
  return { ok: true };
}

export function submitEvaluation(data) {
  loadState();
  const livraison = state.livraisons.find(
    (item) => item._id === data.livraisonId || item.numeroSuivi === data.numeroSuivi
  );
  if (!livraison || livraison.statut !== "LIVREE")
    return { ok: false, error: "Seule une livraison terminée peut être évaluée." };
  if (!livraison.livreurId)
    return { ok: false, error: "Aucun livreur ne peut être évalué pour cette livraison." };
  const note = Number(data.note);
  if (!Number.isInteger(note) || note < 1 || note > 5)
    return { ok: false, error: "La note doit être comprise entre 1 et 5." };
  const commentaire = String(data.commentaire || "").trim();
  if (commentaire.length < 3)
    return { ok: false, error: "Un avis écrit est obligatoire." };
  const auteurType = data.auteurType === "vendeur" ? "vendeur" : "client";
  const existing = state.evaluations.find(
    (item) => item.livraisonId === livraison._id && item.auteurType === auteurType
  );
  if (existing) return { ok: false, error: "Une évaluation a déjà été enregistrée." };
  const evaluation = {
    _id: uid("eval"),
    livraisonId: livraison._id,
    livreurId: livraison.livreurId,
    vendeurId: livraison.vendeurId,
    auteurType,
    cibleType: "livreur",
    auteurCompteId: auteurType === "vendeur" ? data.auteurCompteId : null,
    note,
    commentaire: commentaire.slice(0, 500),
    dateCreation: nowIso(),
  };
  state.evaluations.push(evaluation);
  persist();
  return { ok: true, evaluation };
}

export function submitSellerEvaluation(data) {
  loadState();
  const livraison = state.livraisons.find((item) => item._id === data.livraisonId);
  if (!livraison || livraison.statut !== "LIVREE")
    return { ok: false, error: "Seule une livraison terminée peut être évaluée." };
  const livreur = state.livreurs.find((item) => item.compteId === data.auteurCompteId);
  if (!livreur || livraison.livreurId !== livreur._id)
    return { ok: false, error: "Seul le livreur assigné peut noter ce commerçant." };
  const note = Number(data.note);
  if (!Number.isInteger(note) || note < 1 || note > 5)
    return { ok: false, error: "La note doit être comprise entre 1 et 5." };
  const commentaire = String(data.commentaire || "").trim();
  if (commentaire.length < 3)
    return { ok: false, error: "Un avis écrit est obligatoire." };
  const existing = state.evaluations.find(
    (item) =>
      item.livraisonId === livraison._id &&
      item.auteurType === "livreur" &&
      item.cibleType === "vendeur"
  );
  if (existing) return { ok: false, error: "Ce commerçant a déjà été évalué pour cette livraison." };
  const evaluation = {
    _id: uid("eval"),
    livraisonId: livraison._id,
    livreurId: livreur._id,
    vendeurId: livraison.vendeurId,
    auteurType: "livreur",
    cibleType: "vendeur",
    auteurCompteId: data.auteurCompteId,
    note,
    commentaire: commentaire.slice(0, 500),
    dateCreation: nowIso(),
  };
  state.evaluations.push(evaluation);
  persist();
  return { ok: true, evaluation };
}

export function proposerPartenariat(vendeurCompteId, livreurRef, message) {
  loadState();
  const vendeur = state.vendeurs.find((v) => v.compteId === vendeurCompteId);
  if (!vendeur) return { ok: false, error: "Vendeur introuvable." };
  const livreur = state.livreurs.find((l) => l._id === livreurRef);
  if (!livreur) return { ok: false, error: "Livreur introuvable." };
  const compteLivreur = state.comptes.find((item) => item._id === livreur.compteId);
  if (compteLivreur?.role !== "livreur" || compteLivreur.statutCompte !== "actif")
    return { ok: false, error: "Ce livreur n'a pas de compte actif." };
  const existing = state.partenariats.find(
    (partnership) =>
      partnership.vendeurId === vendeur._id &&
      partnership.livreurId === livreur._id &&
      ["actif", "en_attente"].includes(partnership.statut)
  );
  if (existing)
    return { ok: false, error: "Un partenariat existe déjà avec ce livreur." };
  const previous = state.partenariats.find(
    (partnership) =>
      partnership.vendeurId === vendeur._id &&
      partnership.livreurId === livreur._id
  );
  if (previous) {
    previous.statut = "en_attente";
    previous.dateCreation = nowIso();
    previous.dateDecision = null;
    previous.dateFin = null;
    previous.message = message;
    previous.motifRejet = "";
  } else {
    state.partenariats.push({
      _id: uid("part"),
      vendeurId: vendeur._id,
      livreurId: livreur._id,
      statut: "en_attente",
      dateCreation: nowIso(),
      message,
    });
  }
  pushNotification(
    livreur.compteId,
    "message_recu",
    "Demande de partenariat",
    vendeur.raisonSociale,
    "/courier/partnerships"
  );
  persist();
  return { ok: true };
}

export function revoquerPartenariat(vendeurCompteId, partenariatId) {
  loadState();
  const vendeur = state.vendeurs.find((v) => v.compteId === vendeurCompteId);
  const part = state.partenariats.find((p) => p._id === partenariatId && p.vendeurId === vendeur?._id);
  if (!part) return { ok: false, error: "Partenariat introuvable." };
  if (!["actif", "en_attente"].includes(part.statut))
    return { ok: false, error: "Ce partenariat est déjà terminé." };
  part.statut = "revoque";
  part.dateFin = nowIso();
  const livreur = state.livreurs.find((item) => item._id === part.livreurId);
  if (livreur) {
    pushNotification(
      livreur.compteId,
      "information",
      "Partenariat terminé",
      vendeur.raisonSociale,
      "/courier/partnerships"
    );
  }
  persist();
  return { ok: true };
}

export function setStatutOperationnel(livreurCompteId, statut) {
  loadState();
  const liv = state.livreurs.find((l) => l.compteId === livreurCompteId);
  if (!liv) return { ok: false };
  liv.statutOperationnel = statut;
  persist();
  return { ok: true };
}

export function suspendreCompte(gestionnaireCompteId, compteCibleId) {
  loadState();
  const actor = state.comptes.find((x) => x._id === gestionnaireCompteId);
  const c = state.comptes.find((x) => x._id === compteCibleId);
  if (!c || !["manager", "super_manager"].includes(actor?.role)) return { ok: false };
  if (actor.role === "manager") {
    const manager = state.gestionnaires.find((item) => item.compteId === actor._id);
    const targetProfile = profileForCompte(c._id);
    if (!inJurisdiction(targetProfile, manager?.juridiction)) return { ok: false };
  }
  c.statutCompte = "suspendu";
  pushNotification(c._id, "urgence", "Compte suspendu", "Action manuelle d'un manager", "/login");
  persist();
  return { ok: true };
}

export function inviterGestionnaire(superCompteId, data) {
  loadState();
  const actor = state.comptes.find((item) => item._id === superCompteId);
  if (actor?.role !== "super_manager") return { ok: false, error: "Action réservée au Super Manager." };
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");
  const jurisdictionValue = String(data.juridiction?.valeur || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: "Adresse e-mail invalide." };
  if (password.length < 10)
    return { ok: false, error: "Le mot de passe temporaire doit contenir au moins 10 caractères." };
  if (!jurisdictionValue)
    return { ok: false, error: "Le périmètre du manager est obligatoire." };
  if (state.comptes.some((item) => item.email.toLowerCase() === email))
    return { ok: false, error: "Cet e-mail est déjà utilisé." };
  const compteId = uid("cmp");
  const gestId = uid("gest");
  state.comptes.push({
    _id: compteId,
    email,
    motDePasseHash: password,
    role: "manager",
    statutCompte: "invite",
    invitationToken: uid("tok"),
    invitationExpiration: nowIso(),
    dateCreation: nowIso(),
  });
  state.gestionnaires.push({
    _id: gestId,
    compteId,
    juridiction: {
      niveau: data.juridiction?.niveau || "departement",
      valeur: jurisdictionValue,
      code: String(data.juridiction?.code || ""),
    },
    invitePar: superCompteId,
  });
  persist();
  return { ok: true };
}

function canManageFinancialProfile(gestionnaireCompteId, profile) {
  const actor = state.comptes.find((item) => item._id === gestionnaireCompteId);
  if (!["manager", "super_manager"].includes(actor?.role)) return false;
  if (actor.role === "super_manager") return true;
  const manager = state.gestionnaires.find(
    (item) => item.compteId === gestionnaireCompteId
  );
  return Boolean(manager && inJurisdiction(profile, manager.juridiction));
}

export function previewFacture(gestionnaireCompteId, vendeurId, periodeDebut, periodeFin) {
  loadState();
  const vendeur = state.vendeurs.find((item) => item._id === vendeurId);
  if (!vendeur) return { ok: false, error: "Commerçant introuvable." };
  if (!canManageFinancialProfile(gestionnaireCompteId, vendeur))
    return { ok: false, error: "Action non autorisée dans cette juridiction." };
  const debut = new Date(periodeDebut);
  const fin = new Date(periodeFin);
  if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || debut > fin)
    return { ok: false, error: "Période de facturation invalide." };
  const existingInvoice = state.factures.find(
    (invoice) =>
      invoice.vendeurId === vendeurId &&
      new Date(invoice.periodeDebut) <= fin &&
      new Date(invoice.periodeFin) >= debut
  );
  if (existingInvoice) return {
    ok: false,
    error: "Une facture couvre déjà tout ou partie de cette période.",
    existingId: existingInvoice._id,
  };
  const nombreMois = Math.max(
    1,
    Math.round((fin - debut) / (1000 * 60 * 60 * 24 * 30)) || 1
  );
  const montantAbonnement = TARIF_ABONNEMENT_MENSUEL * nombreMois;
  const deliveryLines = state.livraisons
    .filter((delivery) => {
      const submittedAt = new Date(delivery.dateSoumission);
      return (
        delivery.vendeurId === vendeurId &&
        delivery.statut === "LIVREE" &&
        submittedAt >= debut &&
        submittedAt <= fin
      );
    })
    .map((delivery) => {
      const economy = delivery.economie || economieLivraison(delivery.modePriseEnCharge);
      return {
        type: "livraison",
        livraisonId: delivery._id,
        referenceLivraison: delivery.numeroSuivi,
        libelle: delivery.modePriseEnCharge === "propre"
          ? "Livraison propre - aucun frais de trajet"
          : `Livraison ${delivery.modePriseEnCharge === "equipe" ? "équipe" : "pool plateforme"}`,
        quantite: 1,
        prixUnitaire: economy.coutVendeur,
        montant: economy.coutVendeur,
      };
    });
  const montantLivraisons = deliveryLines.reduce((sum, line) => sum + line.montant, 0);
  const lignes = [{
    type: "abonnement",
    libelle: "Abonnement RelayFlow",
    quantite: nombreMois,
    prixUnitaire: TARIF_ABONNEMENT_MENSUEL,
    montant: montantAbonnement,
  }, ...deliveryLines];
  return {
    ok: true,
    preview: {
      typeDocument: "facture",
      acteurNom: vendeur.raisonSociale,
      vendeurId,
      periodeDebut,
      periodeFin,
      montant: montantAbonnement + montantLivraisons,
      montantAbonnement,
      montantLivraisons,
      nombreLivraisonsFacturees: deliveryLines.filter((line) => line.montant > 0).length,
      nombreLivraisonsPropres: deliveryLines.filter((line) => line.montant === 0).length,
      lignes,
    },
  };
}

export function previewBonPaiement(gestionnaireCompteId, livreurId, periodeDebut, periodeFin) {
  loadState();
  const livreur = state.livreurs.find((item) => item._id === livreurId);
  if (!livreur) return { ok: false, error: "Livreur introuvable." };
  if (!canManageFinancialProfile(gestionnaireCompteId, livreur))
    return { ok: false, error: "Action non autorisée dans cette juridiction." };
  const debut = new Date(periodeDebut);
  const fin = new Date(periodeFin);
  if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || debut > fin)
    return { ok: false, error: "Période de paiement invalide." };
  const existingVoucher = state.bonsPaiement.find(
    (voucher) =>
      voucher.livreurId === livreurId &&
      new Date(voucher.periodeDebut) <= fin &&
      new Date(voucher.periodeFin) >= debut
  );
  if (existingVoucher) return {
    ok: false,
    error: "Un bon de paiement couvre déjà tout ou partie de cette période.",
    existingId: existingVoucher._id,
  };
  const lignes = state.livraisons
    .filter((delivery) => {
      const submittedAt = new Date(delivery.dateSoumission);
      return (
        delivery.livreurId === livreurId &&
        delivery.statut === "LIVREE" &&
        submittedAt >= debut &&
        submittedAt <= fin
      );
    })
    .map((delivery) => {
      const economy = delivery.economie || economieLivraison(delivery.modePriseEnCharge);
      return {
        type: "livraison",
        livraisonId: delivery._id,
        referenceLivraison: delivery.numeroSuivi,
        libelle: "Livraison terminée",
        quantite: 1,
        prixUnitaire: economy.remunerationLivreur,
        montant: economy.remunerationLivreur,
      };
    });
  return {
    ok: true,
    preview: {
      typeDocument: "bon_paiement",
      acteurNom: livreur.nom,
      livreurId,
      periodeDebut,
      periodeFin,
      nombreLivraisonsTraitees: lignes.length,
      tarifUnitaire: TARIF_LIVRAISON_UNITAIRE,
      montantTotal: lignes.reduce((sum, line) => sum + line.montant, 0),
      lignes,
    },
  };
}

export function genererFacture(gestionnaireCompteId, vendeurId, periodeDebut, periodeFin) {
  loadState();
  const actor = state.comptes.find((item) => item._id === gestionnaireCompteId);
  const vendeur = state.vendeurs.find((item) => item._id === vendeurId);
  const manager = state.gestionnaires.find((item) => item.compteId === gestionnaireCompteId);
  if (
    !["manager", "super_manager"].includes(actor?.role) ||
    (actor.role === "manager" && !inJurisdiction(vendeur, manager?.juridiction))
  ) return { ok: false, error: "Action non autorisée dans cette juridiction." };
  const debut = new Date(periodeDebut);
  const fin = new Date(periodeFin);
  if (!vendeur || Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || debut > fin)
    return { ok: false, error: "Période de facturation invalide." };
  const overlappingInvoice = state.factures.some(
    (invoice) =>
      invoice.vendeurId === vendeurId &&
      new Date(invoice.periodeDebut) <= fin &&
      new Date(invoice.periodeFin) >= debut
  );
  if (overlappingInvoice)
    return { ok: false, error: "Une facture couvre déjà tout ou partie de cette période." };
  const mois =
    (fin - debut) / (1000 * 60 * 60 * 24 * 30);
  const nombreMois = Math.max(1, Math.round(mois) || 1);
  const montantAbonnement = TARIF_ABONNEMENT_MENSUEL * nombreMois;
  const deliveries = state.livraisons.filter((delivery) => {
    const submittedAt = new Date(delivery.dateSoumission);
    return (
      delivery.vendeurId === vendeurId &&
      delivery.statut === "LIVREE" &&
      submittedAt >= debut &&
      submittedAt <= fin
    );
  });
  const deliveryLines = deliveries.map((delivery) => {
    const economy = delivery.economie || economieLivraison(delivery.modePriseEnCharge);
    return {
      type: "livraison",
      livraisonId: delivery._id,
      referenceLivraison: delivery.numeroSuivi,
      libelle:
        delivery.modePriseEnCharge === "propre"
          ? "Livraison propre - aucun frais de trajet"
          : `Livraison ${delivery.modePriseEnCharge === "equipe" ? "équipe" : "pool plateforme"}`,
      quantite: 1,
      prixUnitaire: economy.coutVendeur,
      montant: economy.coutVendeur,
    };
  });
  const montantLivraisons = deliveryLines.reduce((sum, line) => sum + line.montant, 0);
  const lignes = [
    {
      type: "abonnement",
      libelle: "Abonnement RelayFlow",
      quantite: nombreMois,
      prixUnitaire: TARIF_ABONNEMENT_MENSUEL,
      montant: montantAbonnement,
    },
    ...deliveryLines,
  ];
  const montant = montantAbonnement + montantLivraisons;
  const fac = {
    _id: uid("fac"),
    vendeurId,
    periodeDebut,
    periodeFin,
    montant,
    montantAbonnement,
    montantLivraisons,
    nombreLivraisonsFacturees: deliveryLines.filter((line) => line.montant > 0).length,
    nombreLivraisonsPropres: deliveryLines.filter((line) => line.montant === 0).length,
    lignes,
    statut: "emise",
    dateEmission: nowIso(),
    genereParCompteId: gestionnaireCompteId,
  };
  state.factures.unshift(fac);
  pushNotification(
    vendeur.compteId,
    "finance",
    "Nouvelle facture disponible",
    `${fac._id} · ${fac.montant.toFixed(2)} €`,
    "/merchant/finance"
  );
  persist();
  return { ok: true, facture: fac };
}

export function genererBonPaiement(gestionnaireCompteId, livreurId, periodeDebut, periodeFin) {
  loadState();
  const actor = state.comptes.find((item) => item._id === gestionnaireCompteId);
  const livreur = state.livreurs.find((item) => item._id === livreurId);
  const manager = state.gestionnaires.find((item) => item.compteId === gestionnaireCompteId);
  if (
    !["manager", "super_manager"].includes(actor?.role) ||
    (actor.role === "manager" && !inJurisdiction(livreur, manager?.juridiction))
  ) return { ok: false, error: "Action non autorisée dans cette juridiction." };
  const debut = new Date(periodeDebut);
  const fin = new Date(periodeFin);
  if (!livreur || Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime()) || debut > fin)
    return { ok: false, error: "Période de paiement invalide." };
  const overlappingVoucher = state.bonsPaiement.some(
    (voucher) =>
      voucher.livreurId === livreurId &&
      new Date(voucher.periodeDebut) <= fin &&
      new Date(voucher.periodeFin) >= debut
  );
  if (overlappingVoucher)
    return { ok: false, error: "Un bon de paiement couvre déjà tout ou partie de cette période." };
  const deliveries = state.livraisons.filter(
    (d) =>
      d.livreurId === livreurId &&
      d.statut === "LIVREE" &&
      d.dateSoumission >= periodeDebut &&
      d.dateSoumission <= periodeFin
  );
  const lignes = deliveries.map((delivery) => {
    const economy = delivery.economie || economieLivraison(delivery.modePriseEnCharge);
    return {
      type: "livraison",
      livraisonId: delivery._id,
      referenceLivraison: delivery.numeroSuivi,
      libelle: "Livraison terminée",
      quantite: 1,
      prixUnitaire: economy.remunerationLivreur,
      montant: economy.remunerationLivreur,
    };
  });
  const count = deliveries.length;
  const montantTotal = lignes.reduce((sum, line) => sum + line.montant, 0);
  const bon = {
    _id: uid("bp"),
    livreurId,
    periodeDebut,
    periodeFin,
    nombreLivraisonsTraitees: count,
    tarifUnitaire: TARIF_LIVRAISON_UNITAIRE,
    montantTotal,
    lignes,
    statut: "emis",
    dateEmission: nowIso(),
    genereParCompteId: gestionnaireCompteId,
  };
  state.bonsPaiement.unshift(bon);
  pushNotification(
    livreur.compteId,
    "finance",
    "Nouveau bon de paiement",
    `${bon.nombreLivraisonsTraitees} livraison(s) · ${bon.montantTotal.toFixed(2)} €`,
    "/courier/finance"
  );
  persist();
  return { ok: true, bon };
}

export function marquerFacturePayee(gestionnaireCompteId, factureId) {
  loadState();
  const f = state.factures.find((x) => x._id === factureId);
  if (!f) return { ok: false, error: "Facture introuvable." };
  const vendeur = state.vendeurs.find((item) => item._id === f.vendeurId);
  if (!canManageFinancialProfile(gestionnaireCompteId, vendeur))
    return { ok: false, error: "Action financière non autorisée." };
  if (f.statut === "payee")
    return { ok: false, error: "Cette facture est déjà payée." };
  f.statut = "payee";
  f.datePaiement = nowIso();
  f.paiementEnregistreParCompteId = gestionnaireCompteId;
  pushNotification(
    vendeur.compteId,
    "finance",
    "Paiement de facture enregistré",
    f._id,
    "/merchant/finance"
  );
  persist();
  return { ok: true, facture: f };
}

export function marquerBonPaye(gestionnaireCompteId, bonId) {
  loadState();
  const b = state.bonsPaiement.find((x) => x._id === bonId);
  if (!b) return { ok: false, error: "Bon de paiement introuvable." };
  const livreur = state.livreurs.find((item) => item._id === b.livreurId);
  if (!canManageFinancialProfile(gestionnaireCompteId, livreur))
    return { ok: false, error: "Action financière non autorisée." };
  if (b.statut === "paye")
    return { ok: false, error: "Ce bon est déjà payé." };
  b.statut = "paye";
  b.datePaiement = nowIso();
  b.paiementEnregistreParCompteId = gestionnaireCompteId;
  pushNotification(
    livreur.compteId,
    "finance",
    "Paiement du bon enregistré",
    b._id,
    "/courier/finance"
  );
  persist();
  return { ok: true, bon: b };
}

export function markNotificationRead(notifId) {
  loadState();
  const n = state.notifications.find((x) => x._id === notifId);
  if (n) n.lu = true;
  persist();
}

export function markAllNotificationsRead(compteId) {
  loadState();
  state.notifications.filter((n) => n.compteId === compteId).forEach((n) => (n.lu = true));
  persist();
}

export function getLivraisonBySuivi(numeroSuivi) {
  return getState().livraisons.find(
    (d) => d.numeroSuivi.toLowerCase() === numeroSuivi.toLowerCase()
  );
}

export function updateProfile(compteId, data) {
  loadState();
  const compte = findCompte(compteId);
  if (!compte) return { ok: false, error: "Compte introuvable." };
  if (compte.role === "vendeur") {
    const v = state.vendeurs.find((x) => x.compteId === compteId);
    if (v) Object.assign(v, data);
  } else if (compte.role === "livreur") {
    const l = state.livreurs.find((x) => x.compteId === compteId);
    if (l) Object.assign(l, data);
  }
  if (data.password) compte.motDePasseHash = data.password;
  persist();
  return { ok: true };
}

export function accepterPartenariat(livreurCompteId, partenariatId) {
  loadState();
  const liv = state.livreurs.find((l) => l.compteId === livreurCompteId);
  const part = state.partenariats.find(
    (p) => p._id === partenariatId && p.livreurId === liv?._id
  );
  if (!part) return { ok: false, error: "Partenariat introuvable." };
  if (part.statut !== "en_attente")
    return { ok: false, error: "Cette proposition a déjà été traitée." };
  part.statut = "actif";
  part.dateDecision = nowIso();
  const vendeur = state.vendeurs.find((item) => item._id === part.vendeurId);
  if (vendeur) {
    pushNotification(
      vendeur.compteId,
      "succes",
      "Partenariat accepté",
      liv.nom,
      "/merchant/team"
    );
  }
  persist();
  return { ok: true, partenariat: part };
}

export function rejeterPartenariat(livreurCompteId, partenariatId, motif) {
  loadState();
  const liv = state.livreurs.find((l) => l.compteId === livreurCompteId);
  const part = state.partenariats.find(
    (p) => p._id === partenariatId && p.livreurId === liv?._id
  );
  if (!part) return { ok: false, error: "Partenariat introuvable." };
  if (part.statut !== "en_attente")
    return { ok: false, error: "Cette proposition a déjà été traitée." };
  const normalizedReason = String(motif || "").trim();
  if (normalizedReason.length < 3)
    return { ok: false, error: "Indiquez brièvement la raison du refus." };
  part.statut = "rejete";
  part.motifRejet = normalizedReason.slice(0, 300);
  part.dateDecision = nowIso();
  const vendeur = state.vendeurs.find((item) => item._id === part.vendeurId);
  if (vendeur) {
    pushNotification(
      vendeur.compteId,
      "information",
      "Proposition de partenariat refusée",
      `${liv.nom} · ${part.motifRejet}`,
      "/merchant/team"
    );
  }
  persist();
  return { ok: true, partenariat: part };
}

export function reactiverCompte(compteCibleId) {
  loadState();
  const c = state.comptes.find((x) => x._id === compteCibleId);
  if (!c) return { ok: false };
  c.statutCompte = "actif";
  persist();
  return { ok: true };
}

export function updateLivreurCoords(livreurCompteId, coords) {
  loadState();
  const liv = state.livreurs.find((l) => l.compteId === livreurCompteId);
  if (!liv) return { ok: false };
  liv.coordonnees = coords;
  persist();
  return { ok: true };
}

export function updateLivreurPreferences(livreurCompteId, preferences) {
  loadState();
  const livreur = state.livreurs.find((item) => item.compteId === livreurCompteId);
  if (!livreur) return { ok: false, error: "Livreur introuvable." };
  const rayonRechercheKm = Number(preferences?.rayonRechercheKm);
  if (![3, 5, 10, 20].includes(rayonRechercheKm))
    return { ok: false, error: "Rayon de recherche invalide." };
  livreur.rayonRechercheKm = rayonRechercheKm;
  persist();
  return { ok: true, livreur };
}

export const actions = {
  login,
  establishSession,
  loginDemo,
  logout,
  registerVendeur,
  registerLivreur,
  submitApplication,
  decideApplication,
  rollbackApplication,
  createLivraison,
  acceptOffer,
  assignCourier,
  decideDeliveryCandidate,
  refuseOffer,
  confirmRetrait,
  confirmLivraison,
  markEchec,
  redistribuer,
  createSignalement,
  traiterSignalement,
  sendIssueMessage,
  markIssueMessagesRead,
  submitEvaluation,
  submitSellerEvaluation,
  proposerPartenariat,
  revoquerPartenariat,
  setStatutOperationnel,
  suspendreCompte,
  inviterGestionnaire,
  previewFacture,
  previewBonPaiement,
  genererFacture,
  genererBonPaiement,
  marquerFacturePayee,
  marquerBonPaye,
  markNotificationRead,
  markAllNotificationsRead,
  resetDemoData,
  updateProfile,
  accepterPartenariat,
  rejeterPartenariat,
  reactiverCompte,
  updateLivreurCoords,
  updateLivreurPreferences,
  getLivraisonBySuivi,
};
