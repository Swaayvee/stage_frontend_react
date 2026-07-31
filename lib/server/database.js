import "server-only";

import { randomBytes, scryptSync } from "node:crypto";
import { createSeedState } from "../seedData";
import { getMongoDatabase } from "./mongodb";

export const BUSINESS_COLLECTIONS = [
  "comptes", "vendeurs", "livreurs", "gestionnaires", "partenariats",
  "livraisons", "signalements", "messagesIncidents", "notifications",
  "abonnements", "factures", "bonsPaiement", "evaluations", "applications",
  "offresLivraison", "pushSubscriptions",
];

let initialization;

function passwordRecord(password) {
  const passwordSalt = randomBytes(16).toString("hex");
  return { passwordSalt, passwordHash: scryptSync(password, passwordSalt, 64).toString("hex") };
}

async function ensureSeedAuthentication(db, seed) {
  const managerAccountId = (managerId) =>
    seed.gestionnaires.find((manager) => manager._id === managerId)?.compteId;
  for (const account of seed.comptes.filter((item) => item.motDePasseHash)) {
    const application = seed.applications.find((item) => item.compteId === account._id);
    const profile =
      seed.vendeurs.find((item) => item.compteId === account._id) ||
      seed.livreurs.find((item) => item.compteId === account._id) ||
      seed.gestionnaires.find((item) => item.compteId === account._id) || null;
    await db.collection("auth_accounts").updateOne(
      { email: account.email.toLowerCase() },
      { $setOnInsert: {
        applicationId: application?._id || `seed-${account._id}`,
        accountId: account._id,
        email: account.email.toLowerCase(),
        role: account.role,
        status: account.statutCompte,
        ...passwordRecord(account.motDePasseHash),
        assignedManagerAccountIds: (application?.managerIds || []).map(managerAccountId).filter(Boolean),
        profile,
        createdAt: new Date(account.dateCreation || Date.now()),
        updatedAt: new Date(),
        seededAccount: true,
      } },
      { upsert: true }
    );
  }
}

async function backfillApplicationDetails(db) {
  const applications = await db.collection("applications").find({
    $or: [{ nom: { $exists: false } }, { ville: { $exists: false } }],
  }).toArray();
  for (const application of applications) {
    const auth = await db.collection("auth_accounts").findOne({ accountId: application.compteId });
    const profileCollection = application.role === "vendeur" ? "vendeurs" : "livreurs";
    const profile = await db.collection(profileCollection).findOne({ compteId: application.compteId });
    const source = { ...(auth?.profile || {}), ...(profile || {}) };
    await db.collection("applications").updateOne(
      { _id: application._id },
      { $set: {
        nom: source.nom || "",
        raisonSociale: source.raisonSociale || "",
        telephone: source.telephone || "",
        adresse: source.adresse || "",
        ville: source.ville || "",
        departement: source.departement || "",
        codePostal: source.codePostal || "",
        codeCommune: source.codeCommune || "",
        codeDepartement: source.codeDepartement || "",
        typeVehicule: source.typeVehicule || "",
        profil: auth?.profile?.profil || application.profil || {},
        documents: auth?.profile?.documents || application.documents || [],
      } }
    );
  }
}

async function removeInvalidRoleProfiles(db) {
  const accounts = await db.collection("comptes").find({}, { projection: { _id: 1, role: 1 } }).toArray();
  const roleByAccountId = new Map(accounts.map((account) => [String(account._id), account.role]));
  const [sellers, couriers, managers] = await Promise.all([
    db.collection("vendeurs").find({}, { projection: { _id: 1, compteId: 1 } }).toArray(),
    db.collection("livreurs").find({}, { projection: { _id: 1, compteId: 1 } }).toArray(),
    db.collection("gestionnaires").find({}, { projection: { _id: 1, compteId: 1 } }).toArray(),
  ]);
  const invalidSellerIds = sellers.filter((item) => roleByAccountId.get(item.compteId) !== "vendeur").map((item) => item._id);
  const invalidCourierIds = couriers.filter((item) => roleByAccountId.get(item.compteId) !== "livreur").map((item) => item._id);
  const invalidManagerIds = managers.filter((item) => !["manager", "super_manager"].includes(roleByAccountId.get(item.compteId))).map((item) => item._id);
  await Promise.all([
    invalidSellerIds.length ? db.collection("vendeurs").deleteMany({ _id: { $in: invalidSellerIds } }) : null,
    invalidCourierIds.length ? db.collection("livreurs").deleteMany({ _id: { $in: invalidCourierIds } }) : null,
    invalidManagerIds.length ? db.collection("gestionnaires").deleteMany({ _id: { $in: invalidManagerIds } }) : null,
  ]);
}

function withoutSecrets(collectionName, document) {
  const clean = structuredClone(document);
  delete clean.motDePasseHash;
  delete clean.password;
  delete clean.passwordHash;
  delete clean.passwordSalt;
  if (collectionName === "livreurs" && !clean.partagePositionActif) {
    clean.coordonnees = null;
    clean.positionActualiseeLe = null;
  }
  return clean;
}

async function createIndexes(db) {
  await Promise.all([
    db.collection("auth_accounts").createIndex({ email: 1 }, { unique: true }),
    db.collection("auth_accounts").createIndex({ applicationId: 1 }, { unique: true, sparse: true }),
    db.collection("comptes").createIndex({ email: 1 }, { unique: true }),
    db.collection("vendeurs").createIndex({ compteId: 1 }, { unique: true }),
    db.collection("livreurs").createIndex({ compteId: 1 }, { unique: true }),
    db.collection("gestionnaires").createIndex({ compteId: 1 }, { unique: true }),
    db.collection("livraisons").createIndex({ numeroSuivi: 1 }, { unique: true }),
    db.collection("livraisons").createIndex({ publicTrackingToken: 1 }, { unique: true, sparse: true }),
    db.collection("livraisons").createIndex({ vendeurId: 1, dateSoumission: -1 }),
    db.collection("livraisons").createIndex({ livreurId: 1, dateSoumission: -1 }),
    db.collection("notifications").createIndex({ compteId: 1, dateCreation: -1 }),
    db.collection("messagesIncidents").createIndex({ signalementId: 1, dateCreation: 1 }),
    db.collection("evaluations").createIndex({ livraisonId: 1, auteurType: 1, cibleType: 1 }, { unique: true }),
  ]);
}

export async function initializeDatabase() {
  if (!initialization) {
    initialization = (async () => {
      const db = await getMongoDatabase();
      await createIndexes(db);
      const seed = createSeedState();
      await ensureSeedAuthentication(db, seed);
      const hasBusinessData = await db.collection("comptes").estimatedDocumentCount();
      if (!hasBusinessData) {
        for (const name of BUSINESS_COLLECTIONS) {
          const records = (seed[name] || []).map((item) => withoutSecrets(name, item));
          if (records.length) await db.collection(name).insertMany(records, { ordered: false });
        }
        await db.collection("system_meta").updateOne(
          { _id: "relayflow" },
          { $set: { ...seed.meta, initializedAt: new Date(), schemaVersion: 1 } },
          { upsert: true }
        );
      }
      await backfillApplicationDetails(db);
      await removeInvalidRoleProfiles(db);
      return db;
    })().catch((error) => {
      initialization = null;
      throw error;
    });
  }
  return initialization;
}

export async function loadBusinessState() {
  const db = await initializeDatabase();
  const entries = await Promise.all(BUSINESS_COLLECTIONS.map(async (name) => [
    name,
    (await db.collection(name).find({}).toArray()).map(({ _id, ...record }) => ({ _id: String(_id), ...record })),
  ]));
  const meta = await db.collection("system_meta").findOne({ _id: "relayflow" });
  return { ...Object.fromEntries(entries), meta: { ...meta, _id: undefined } };
}

export async function saveBusinessState(nextState) {
  const db = await initializeDatabase();
  for (const name of BUSINESS_COLLECTIONS) {
    const records = (nextState[name] || []).map((item) => withoutSecrets(name, item));
    const operations = records.map((record) => ({
      replaceOne: { filter: { _id: record._id }, replacement: record, upsert: true },
    }));
    if (operations.length) await db.collection(name).bulkWrite(operations, { ordered: false });
    await db.collection(name).deleteMany({ _id: { $nin: records.map((item) => item._id) } });
  }
  await db.collection("system_meta").updateOne(
    { _id: "relayflow" },
    { $set: { ...(nextState.meta || {}), updatedAt: new Date() } },
    { upsert: true }
  );
}

export async function upsertBusinessRegistration({ accountId, email, role, profile, applicationId, managerIds = [] }) {
  const db = await initializeDatabase();
  await db.collection("comptes").updateOne(
    { _id: accountId },
    { $setOnInsert: { _id: accountId, email: email.toLowerCase(), role, statutCompte: "invite", dateCreation: new Date().toISOString() } },
    { upsert: true }
  );
  const profileCollection = role === "vendeur" ? "vendeurs" : "livreurs";
  const prefix = role === "vendeur" ? "ven" : "liv";
  const profileDocument = role === "vendeur"
    ? { raisonSociale: profile?.raisonSociale || profile?.nom || email.split("@")[0], typeCommerce: profile?.typeCommerce || "" }
    : { nom: profile?.nom || email.split("@")[0], typeVehicule: profile?.typeVehicule || "Non renseigné", statutOperationnel: "indisponible", rayonRechercheKm: 5, partagePositionActif: false };
  await db.collection(profileCollection).updateOne(
    { compteId: accountId },
    { $setOnInsert: { _id: `${prefix}_${accountId}`, compteId: accountId, ...profileDocument }, $set: {
      telephone: profile?.telephone || "", adresse: profile?.adresse || "", ville: profile?.ville || "", departement: profile?.departement || "",
    } },
    { upsert: true }
  );
  await db.collection("applications").updateOne(
    { _id: applicationId },
    {
      $setOnInsert: {
        _id: applicationId,
        reference: `APP-${applicationId.slice(-8).toUpperCase()}`,
        compteId: accountId,
        profilId: `${role === "vendeur" ? "ven" : "liv"}_${accountId}`,
        email: email.toLowerCase(),
        role,
        dateCreation: new Date().toISOString(),
        historique: [{ statut: "en_attente", acteurId: null, quand: new Date().toISOString(), commentaire: "Demande reçue." }],
      },
      $set: {
        statut: "en_attente",
        managerIds,
        fallbackTousManagers: true,
        nom: profile?.nom || "",
        raisonSociale: profile?.raisonSociale || "",
        telephone: profile?.telephone || "",
        adresse: profile?.adresse || "",
        ville: profile?.ville || "",
        departement: profile?.departement || "",
        codePostal: profile?.codePostal || "",
        codeCommune: profile?.codeCommune || "",
        codeDepartement: profile?.codeDepartement || "",
        typeVehicule: profile?.typeVehicule || "",
        profil: profile?.profil || {},
        documents: profile?.documents || [],
      },
    },
    { upsert: true }
  );
}

export async function ensureActiveBusinessAccount({ accountId, email, role, profile }) {
  const db = await initializeDatabase();
  await db.collection("comptes").updateOne(
    { _id: accountId },
    { $set: { email: email.toLowerCase(), role, statutCompte: "actif" }, $setOnInsert: { _id: accountId, dateCreation: new Date().toISOString() } },
    { upsert: true }
  );
  if (!["vendeur", "livreur"].includes(role)) return;
  const isSeller = role === "vendeur";
  const collection = isSeller ? "vendeurs" : "livreurs";
  const base = isSeller
    ? { raisonSociale: profile?.raisonSociale || profile?.nom || email.split("@")[0] }
    : { nom: profile?.nom || email.split("@")[0], typeVehicule: profile?.typeVehicule || "Non renseigné", statutOperationnel: "indisponible", rayonRechercheKm: 5, partagePositionActif: false };
  await db.collection(collection).updateOne(
    { compteId: accountId },
    { $setOnInsert: { _id: `${isSeller ? "ven" : "liv"}_${accountId}`, compteId: accountId, ...base }, $set: {
      telephone: profile?.telephone || "", adresse: profile?.adresse || "", ville: profile?.ville || "", departement: profile?.departement || "",
    } },
    { upsert: true }
  );
}

export async function applyBusinessRegistrationDecision(applicationId, decision, actorAccountId, commentaire = "") {
  const db = await initializeDatabase();
  const application = await db.collection("applications").findOne({ _id: applicationId });
  if (!application) throw new Error("Demande métier introuvable.");
  const status = decision === "acceptee" ? "actif" : "suspendu";
  const decidedAt = new Date().toISOString();
  await Promise.all([
    db.collection("applications").updateOne(
      { _id: applicationId },
      {
        $set: { statut: decision, dateDecision: decidedAt, decideParCompteId: actorAccountId },
        $push: { historique: { statut: decision, acteurId: actorAccountId, quand: decidedAt, commentaire: String(commentaire || "").slice(0, 500) } },
      }
    ),
    db.collection("comptes").updateOne({ _id: application.compteId }, { $set: { statutCompte: status } }),
    db.collection("notifications").insertOne({
      _id: `notif_${applicationId}_${Date.now()}`,
      compteId: application.compteId,
      type: decision === "acceptee" ? "succes" : "information",
      titre: decision === "acceptee" ? "Demande d'adhésion acceptée" : "Demande d'adhésion refusée",
      contenu: commentaire || (decision === "acceptee" ? "Votre compte peut maintenant se connecter." : "Votre demande n'a pas été retenue."),
      lienRessource: decision === "acceptee" ? `/${roleToRoute(application.role)}/login` : "/signup",
      lu: false,
      dateEnvoi: decidedAt,
    }),
  ]);
}

function roleToRoute(role) {
  return role === "vendeur" ? "merchant" : "courier";
}

function safeAccount(account) {
  const { motDePasseHash, password, passwordHash, passwordSalt, ...safe } = account;
  return safe;
}

export function filterStateForActor(state, actor) {
  const ownAccount = state.comptes.find((item) => item._id === actor.sub);
  if (!ownAccount || ownAccount.role !== actor.role || ownAccount.statutCompte !== "actif") return null;
  if (actor.role === "super_manager") return { ...state, comptes: state.comptes.map(safeAccount) };

  let sellerIds = new Set();
  let courierIds = new Set();
  let deliveryIds = new Set();
  let accountIds = new Set([actor.sub]);

  if (actor.role === "vendeur") {
    const seller = state.vendeurs.find((item) => item.compteId === actor.sub);
    if (seller) sellerIds.add(seller._id);
    state.livraisons.filter((item) => sellerIds.has(item.vendeurId)).forEach((item) => {
      deliveryIds.add(item._id);
      if (item.livreurId) courierIds.add(item.livreurId);
    });
    state.partenariats.filter((item) => sellerIds.has(item.vendeurId)).forEach((item) => courierIds.add(item.livreurId));
    state.livreurs
      .filter((courier) => courier.statutOperationnel === "disponible")
      .filter((courier) => state.comptes.some((account) => account._id === courier.compteId && account.statutCompte === "actif"))
      .forEach((courier) => courierIds.add(courier._id));
  } else if (actor.role === "livreur") {
    const courier = state.livreurs.find((item) => item.compteId === actor.sub);
    if (courier) courierIds.add(courier._id);
    state.livraisons.filter((item) => item.livreurId === courier?._id || (item.statut === "SOUMISE" && item.modePriseEnCharge === "pool_plateforme")).forEach((item) => {
      deliveryIds.add(item._id);
      sellerIds.add(item.vendeurId);
    });
  } else if (actor.role === "manager") {
    const manager = state.gestionnaires.find((item) => item.compteId === actor.sub);
    const matches = (profile) => {
      const jurisdiction = manager?.juridiction;
      if (!jurisdiction) return false;
      if (jurisdiction.niveau === "departement") return profile.departement === jurisdiction.valeur || profile.codeDepartement === jurisdiction.valeur;
      return profile.ville === jurisdiction.valeur;
    };
    state.vendeurs.filter(matches).forEach((item) => sellerIds.add(item._id));
    state.livreurs.filter(matches).forEach((item) => courierIds.add(item._id));
    state.livraisons.filter((item) =>
      sellerIds.has(item.vendeurId) ||
      courierIds.has(item.livreurId) ||
      matches({
        ville: item.villeLivraison,
        departement: item.departementLivraison,
        codeDepartement: item.codeDepartementLivraison,
      })
    ).forEach((item) => deliveryIds.add(item._id));
  }

  const businessSellerIds = new Set(sellerIds);
  const businessCourierIds = new Set(courierIds);
  const ownSellerId = state.vendeurs.find((item) => item.compteId === actor.sub)?._id;
  const ownCourierId = state.livreurs.find((item) => item.compteId === actor.sub)?._id;

  state.vendeurs.filter((item) => sellerIds.has(item._id)).forEach((item) => accountIds.add(item.compteId));
  state.livreurs.filter((item) => courierIds.has(item._id)).forEach((item) => accountIds.add(item.compteId));
  const actorManager = state.gestionnaires.find((item) => item.compteId === actor.sub);
  const incidentIds = new Set(state.signalements.filter((item) =>
    deliveryIds.has(item.livraisonId) ||
    accountIds.has(item.auteurId) ||
    accountIds.has(item.compteCibleId) ||
    (actor.role === "manager" && item.gestionnaireAssigneId === actorManager?._id)
  ).map((item) => item._id));
  const managerIds = new Set(actorManager ? [actorManager._id] : []);
  const includeAccountProfile = (accountId) => {
    if (!accountId) return;
    accountIds.add(accountId);
    const seller = state.vendeurs.find((item) => item.compteId === accountId);
    const courier = state.livreurs.find((item) => item.compteId === accountId);
    const manager = state.gestionnaires.find((item) => item.compteId === accountId);
    if (seller) sellerIds.add(seller._id);
    if (courier) courierIds.add(courier._id);
    if (manager) managerIds.add(manager._id);
  };
  state.signalements.filter((item) => incidentIds.has(item._id)).forEach((item) => {
    includeAccountProfile(item.auteurId);
    includeAccountProfile(item.compteCibleId);
    const assignedManager = state.gestionnaires.find((manager) => manager._id === item.gestionnaireAssigneId);
    if (assignedManager) includeAccountProfile(assignedManager.compteId);
  });
  const visibleIssueMessages = state.messagesIncidents.filter((item) =>
    incidentIds.has(item.signalementId) && (
      actor.role === "manager" ||
      item.expediteurCompteId === actor.sub ||
      item.destinataireCompteIds?.includes(actor.sub)
    )
  );
  visibleIssueMessages.forEach((message) => {
    includeAccountProfile(message.expediteurCompteId);
    (message.destinataireCompteIds || []).forEach(includeAccountProfile);
  });
  state.vendeurs.filter((item) => sellerIds.has(item._id)).forEach((item) => accountIds.add(item.compteId));
  state.livreurs.filter((item) => courierIds.has(item._id)).forEach((item) => accountIds.add(item.compteId));
  const visibleDeliveries = state.livraisons.filter((item) => deliveryIds.has(item._id)).map((item) => {
    if (actor.role !== "livreur" || item.livreurId && courierIds.has(item.livreurId)) return item;
    return { ...item, client: { adresse: item.villeLivraison, nom: "Masqué avant attribution", prenom: "", telephone: "" }, codeLivraison: undefined };
  });
  return {
    ...state,
    comptes: state.comptes.filter((item) => accountIds.has(item._id)).map(safeAccount),
    vendeurs: actor.role === "vendeur" ? state.vendeurs.filter((item) => sellerIds.has(item._id)) : state.vendeurs.filter((item) => sellerIds.has(item._id)),
    livreurs: state.livreurs
      .filter((item) => courierIds.has(item._id))
      .map((item) => ({ ...item, coordonnees: item.partagePositionActif ? item.coordonnees : null })),
    gestionnaires: state.gestionnaires.filter((item) => managerIds.has(item._id)),
    livraisons: visibleDeliveries,
    partenariats: state.partenariats.filter((item) =>
      actor.role === "vendeur" ? item.vendeurId === ownSellerId :
      actor.role === "livreur" ? item.livreurId === ownCourierId :
      businessSellerIds.has(item.vendeurId) || businessCourierIds.has(item.livreurId)
    ),
    offresLivraison: state.offresLivraison.filter((item) => deliveryIds.has(item.livraisonId) && (actor.role !== "livreur" || courierIds.has(item.livreurId))),
    signalements: state.signalements.filter((item) => incidentIds.has(item._id)),
    messagesIncidents: visibleIssueMessages,
    notifications: state.notifications.filter((item) => item.compteId === actor.sub),
    abonnements: actor.role === "livreur" ? [] : state.abonnements.filter((item) =>
      actor.role === "vendeur" ? item.vendeurId === ownSellerId : businessSellerIds.has(item.vendeurId)
    ),
    factures: actor.role === "livreur" ? [] : state.factures.filter((item) =>
      actor.role === "vendeur" ? item.vendeurId === ownSellerId : businessSellerIds.has(item.vendeurId)
    ),
    bonsPaiement: actor.role === "vendeur" ? [] : state.bonsPaiement.filter((item) =>
      actor.role === "livreur" ? item.livreurId === ownCourierId : businessCourierIds.has(item.livreurId)
    ),
    evaluations: state.evaluations.filter((item) => deliveryIds.has(item.livraisonId)),
    applications: actor.role === "manager" ? state.applications.filter((item) => (item.managerIds || []).some((id) => state.gestionnaires.some((manager) => manager._id === id && manager.compteId === actor.sub))) : [],
    pushSubscriptions: [],
  };
}

export function resetDatabaseInitializationForTests() {
  initialization = null;
}
