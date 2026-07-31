import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { initializeDatabase } from "./database";


function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const actual = Buffer.from(hashPassword(password, salt).hash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function authCollection() {
  const db = await initializeDatabase();
  return db.collection("auth_accounts");
}

export async function registerPendingAccount(data) {
  const collection = await authCollection();
  const email = data.email.trim().toLowerCase();
  const existing = await collection.findOne({ $or: [{ email }, { applicationId: data.applicationId }] });
  if (existing) {
    if (existing.applicationId === data.applicationId) return existing;
    throw new Error("Un compte existe déjà pour cet e-mail.");
  }
  const password = hashPassword(data.password);
  const account = {
    applicationId: data.applicationId,
    accountId: data.accountId,
    email,
    role: data.role,
    status: "invite",
    passwordSalt: password.salt,
    passwordHash: password.hash,
    assignedManagerAccountIds: data.assignedManagerAccountIds || [],
    profile: data.profile || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  try {
    await collection.insertOne(account);
  } catch (error) {
    if (error?.code === 11000) throw new Error("Un compte existe déjà pour cet e-mail.");
    throw error;
  }
  return account;
}

export async function decidePendingAccount(applicationId, managerAccountId, decision) {
  const collection = await authCollection();
  const account = await collection.findOne({ applicationId });
  if (!account) throw new Error("Demande d'inscription introuvable.");
  if (!account.assignedManagerAccountIds.includes(managerAccountId))
    throw new Error("Cette demande n'est pas attribuée à ce manager.");
  if (account.status !== "invite") throw new Error("Cette demande a déjà été traitée.");
  const result = await collection.findOneAndUpdate(
    { applicationId, status: "invite" },
    { $set: { status: decision === "acceptee" ? "actif" : "suspendu", decidedBy: managerAccountId, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
  if (!result) throw new Error("Cette demande a déjà été traitée.");
  return result;
}

export async function authenticateRegisteredAccount(email, password, role) {
  const collection = await authCollection();
  const account = await collection.findOne({ email: email.trim().toLowerCase(), role });
  if (!account || account.status !== "actif") return null;
  if (!verifyPassword(password, account.passwordSalt, account.passwordHash)) return null;
  const { passwordHash, passwordSalt, ...safeAccount } = account;
  return safeAccount;
}

export async function registerInternalManagerAccount({ accountId, email, password, profile }) {
  const collection = await authCollection();
  const normalizedEmail = email.trim().toLowerCase();
  if (String(password || "").length < 10) throw new Error("Mot de passe temporaire trop court.");
  if (await collection.findOne({ email: normalizedEmail })) throw new Error("Un compte existe déjà pour cet e-mail.");
  const hashed = hashPassword(password);
  await collection.insertOne({
    applicationId: `manager-${accountId}`, accountId, email: normalizedEmail,
    role: "manager", status: "actif", passwordSalt: hashed.salt, passwordHash: hashed.hash,
    assignedManagerAccountIds: [], profile: profile || null,
    createdAt: new Date(), updatedAt: new Date(), invitedInternally: true,
  });
}

export async function updateRegisteredPassword(accountId, password, identity = {}) {
  if (String(password || "").length < 10) throw new Error("Le mot de passe doit contenir au moins 10 caractères.");
  const collection = await authCollection();
  const hashed = hashPassword(password);
  const result = await collection.updateOne(
    { accountId },
    { $set: { passwordSalt: hashed.salt, passwordHash: hashed.hash, updatedAt: new Date() } }
  );
  if (!result.matchedCount) {
    if (!identity.email || !identity.role) throw new Error("Compte d'authentification introuvable.");
    await collection.insertOne({
      applicationId: `password-${accountId}`, accountId, email: identity.email.toLowerCase(), role: identity.role,
      status: "actif", passwordSalt: hashed.salt, passwordHash: hashed.hash,
      assignedManagerAccountIds: [], createdAt: new Date(), updatedAt: new Date(), migratedFromSeed: true,
    });
  }
}
