import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const registryDirectory = path.join(process.cwd(), ".data");
const registryPath = path.join(registryDirectory, "registration-auth.json");
let writeQueue = Promise.resolve();

async function readRegistry() {
  try {
    const parsed = JSON.parse(await readFile(registryPath, "utf8"));
    return Array.isArray(parsed.accounts) ? parsed : { accounts: [] };
  } catch (error) {
    if (error?.code === "ENOENT") return { accounts: [] };
    throw error;
  }
}

async function writeRegistry(registry) {
  await mkdir(registryDirectory, { recursive: true });
  const temporaryPath = `${registryPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(registry, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporaryPath, registryPath);
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const actual = Buffer.from(hashPassword(password, salt).hash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function enqueueMutation(mutate) {
  const operation = writeQueue.then(async () => {
    const registry = await readRegistry();
    const result = await mutate(registry);
    await writeRegistry(registry);
    return result;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

export async function registerPendingAccount(data) {
  return enqueueMutation((registry) => {
    const email = data.email.trim().toLowerCase();
    const existing = registry.accounts.find(
      (account) => account.email === email || account.applicationId === data.applicationId
    );
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    registry.accounts.push(account);
    return account;
  });
}

export async function decidePendingAccount(applicationId, managerAccountId, decision) {
  return enqueueMutation((registry) => {
    const account = registry.accounts.find((item) => item.applicationId === applicationId);
    if (!account) throw new Error("Demande d'inscription introuvable.");
    if (!account.assignedManagerAccountIds.includes(managerAccountId))
      throw new Error("Cette demande n'est pas attribuée à ce manager.");
    if (account.status !== "invite") throw new Error("Cette demande a déjà été traitée.");
    account.status = decision === "acceptee" ? "actif" : "suspendu";
    account.decidedBy = managerAccountId;
    account.updatedAt = new Date().toISOString();
    return account;
  });
}

export async function authenticateRegisteredAccount(email, password, role) {
  const registry = await readRegistry();
  const account = registry.accounts.find(
    (item) => item.email === email.trim().toLowerCase() && item.role === role
  );
  if (!account || account.status !== "actif") return null;
  if (!verifyPassword(password, account.passwordSalt, account.passwordHash)) return null;
  return account;
}

export async function syncAcceptedDevelopmentAccount(data) {
  if (process.env.NODE_ENV === "production")
    throw new Error("La synchronisation locale est désactivée en production.");
  return enqueueMutation((registry) => {
    const email = data.email.trim().toLowerCase();
    const existing = registry.accounts.find((item) => item.email === email);
    if (existing) return existing;
    const password = hashPassword(data.password);
    const account = {
      applicationId: `legacy-${data.accountId}`,
      accountId: data.accountId,
      email,
      role: data.role,
      status: "actif",
      passwordSalt: password.salt,
      passwordHash: password.hash,
      assignedManagerAccountIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      migratedFromLocalDemo: true,
    };
    registry.accounts.push(account);
    return account;
  });
}
