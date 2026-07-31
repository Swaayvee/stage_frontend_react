import "server-only";

import { MongoClient } from "mongodb";

const globalCache = globalThis;

function configuration() {
  const uri = process.env.MONGODB_URI?.trim();
  const dbName = process.env.MONGODB_DB?.trim();
  if (!uri) throw new Error("MONGODB_URI est obligatoire.");
  if (!dbName) throw new Error("MONGODB_DB est obligatoire.");
  return { uri, dbName };
}

export async function getMongoDatabase() {
  const { uri, dbName } = configuration();
  if (!globalCache.__relayflowMongo || globalCache.__relayflowMongo.uri !== uri) {
    const client = new MongoClient(uri, {
      appName: "relayflow",
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      retryWrites: true,
    });
    globalCache.__relayflowMongo = { uri, client, connection: client.connect() };
  }
  const client = await globalCache.__relayflowMongo.connection;
  return client.db(dbName);
}

export async function checkMongoConnection() {
  const startedAt = Date.now();
  const db = await getMongoDatabase();
  await db.command({ ping: 1 });
  return { ok: true, database: db.databaseName, latencyMs: Date.now() - startedAt };
}

export async function closeMongoConnectionForTests() {
  if (!globalCache.__relayflowMongo) return;
  const client = await globalCache.__relayflowMongo.connection.catch(() => null);
  await client?.close();
  delete globalCache.__relayflowMongo;
}
