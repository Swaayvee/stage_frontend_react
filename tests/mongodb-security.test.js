import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";

vi.mock("server-only", () => ({}), { virtual: true });

let mongoServer;
let database;
let mongodb;
let registry;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.MONGODB_DB = "relayflow_security_test";
  database = await import("../lib/server/database.js");
  mongodb = await import("../lib/server/mongodb.js");
  registry = await import("../lib/server/registrationRegistry.js");
  database.resetDatabaseInitializationForTests();
  await database.initializeDatabase();
}, 120_000);

afterAll(async () => {
  await mongodb?.closeMongoConnectionForTests();
  await mongoServer?.stop();
});

describe("MongoDB centralisé", () => {
  it("établit une vraie connexion et initialise les collections", async () => {
    const health = await mongodb.checkMongoConnection();
    expect(health.ok).toBe(true);
    expect(health.database).toBe("relayflow_security_test");
    const state = await database.loadBusinessState();
    expect(state.livraisons.length).toBeGreaterThan(10);
    expect(state.comptes.length).toBeGreaterThan(3);
  });

  it("ne stocke aucun mot de passe en clair dans les comptes métier", async () => {
    const db = await mongodb.getMongoDatabase();
    const leaked = await db.collection("comptes").findOne({ motDePasseHash: { $exists: true } });
    expect(leaked).toBeNull();
  });

  it("impose les références et emails uniques", async () => {
    const db = await mongodb.getMongoDatabase();
    await expect(db.collection("comptes").insertOne({ _id: "duplicate", email: "commerce@maisonolive.fr" })).rejects.toMatchObject({ code: 11000 });
    await expect(db.collection("livraisons").insertOne({ _id: "duplicate-delivery", numeroSuivi: "RF-2026-042" })).rejects.toMatchObject({ code: 11000 });
  });

  it("isole les données selon le rôle connecté", async () => {
    const state = await database.loadBusinessState();
    const merchantState = database.filterStateForActor(state, { sub: "cmp_vendeur1", role: "vendeur" });
    expect(merchantState.comptes.some((item) => item._id === "cmp_super1")).toBe(false);
    expect(merchantState.livraisons.every((item) => item.vendeurId === "ven1")).toBe(true);
    expect(merchantState.factures.every((item) => item.vendeurId === "ven1")).toBe(true);
    expect(merchantState.bonsPaiement).toHaveLength(0);
    expect(merchantState.partenariats.every((item) => item.vendeurId === "ven1")).toBe(true);
    const courierState = database.filterStateForActor(state, { sub: "cmp_livreur1", role: "livreur" });
    const unassigned = courierState.livraisons.find((item) => item.statut === "SOUMISE" && !item.livreurId);
    expect(unassigned?.client?.telephone).toBe("");
    expect(courierState.factures).toHaveLength(0);
    expect(courierState.abonnements).toHaveLength(0);
    expect(courierState.bonsPaiement.every((item) => item.livreurId === "liv1")).toBe(true);
    expect(merchantState.livreurs.every((item) =>
      merchantState.comptes.some((account) => account._id === item.compteId && account.statutCompte === "actif") ||
      merchantState.livraisons.some((delivery) => delivery.livreurId === item._id)
    )).toBe(true);
    const managerState = database.filterStateForActor(state, { sub: "cmp_gest1", role: "manager" });
    expect(managerState.applications.length).toBeGreaterThan(0);
    expect(managerState.messagesIncidents.length).toBeGreaterThan(0);
  });

  it("centralise aussi les comptes initiaux et les demandes dans auth_accounts", async () => {
    expect((await registry.authenticateRegisteredAccount("sarah.bernard@relayflow.fr", "demo123", "manager"))?.accountId).toBe("cmp_gest1");
    expect(await registry.authenticateRegisteredAccount("nina.roux@email.fr", "Candidat2026!", "livreur")).toBeNull();
    await registry.decidePendingAccount("app_demo_livreur1", "cmp_gest1", "acceptee");
    expect((await registry.authenticateRegisteredAccount("nina.roux@email.fr", "Candidat2026!", "livreur"))?.accountId).toBe("cmp_candidature_livreur1");
  });

  it("hachage les mots de passe et refuse un mot de passe incorrect", async () => {
    const email = "mongo.security@example.test";
    await registry.registerPendingAccount({
      applicationId: "app_mongo_security", accountId: "cmp_mongo_security", email,
      password: "MotDePasseTresLong!42", role: "livreur", assignedManagerAccountIds: ["cmp_gest1"],
      profile: { nom: "Test Mongo" },
    });
    await registry.decidePendingAccount("app_mongo_security", "cmp_gest1", "acceptee");
    expect(await registry.authenticateRegisteredAccount(email, "mauvais-mot-de-passe", "livreur")).toBeNull();
    const authenticated = await registry.authenticateRegisteredAccount(email, "MotDePasseTresLong!42", "livreur");
    expect(authenticated?.email).toBe(email);
    expect(authenticated).not.toHaveProperty("passwordHash");
    expect(authenticated).not.toHaveProperty("passwordSalt");
  });

  it("stocke les justificatifs hors de l’état métier et limite leur lecture aux managers autorisés", async () => {
    const file = Buffer.from("%PDF-1.4\n%%EOF");
    const [metadata] = await database.storeApplicationDocuments("app_demo_vendeur", [{
      nom: "kbis-test.pdf",
      type: "application/pdf",
      taille: file.length,
      dataBase64: file.toString("base64"),
    }]);

    expect(metadata.url).toContain("/api/registration-applications/app_demo_vendeur/documents/");
    const managerDocument = await database.getApplicationDocument(
      "app_demo_vendeur",
      metadata._id,
      { sub: "cmp_gest1", role: "manager" }
    );
    expect(Buffer.from(managerDocument.data.buffer)).toEqual(file);
    expect(await database.getApplicationDocument(
      "app_demo_vendeur",
      metadata._id,
      { sub: "cmp_livreur1", role: "livreur" }
    )).toBeNull();
    expect((await database.loadBusinessState())).not.toHaveProperty("applicationDocuments");
    await database.removeApplicationDocuments("app_demo_vendeur");
  });

  it("refuse un fichier dont le contenu ne correspond pas à un format autorisé", async () => {
    const file = Buffer.from("faux document exécutable");
    await expect(database.storeApplicationDocuments("app_demo_vendeur", [{
      nom: "faux.pdf",
      type: "application/pdf",
      taille: file.length,
      dataBase64: file.toString("base64"),
    }])).rejects.toThrow(/PDF, PNG, JPEG et WebP/);
  });
});
