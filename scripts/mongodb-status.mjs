import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB;
if (!uri || !databaseName) {
  console.error("MONGODB_URI et MONGODB_DB sont obligatoires.");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
try {
  await client.connect();
  const db = client.db(databaseName);
  await db.command({ ping: 1 });
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  console.log(`MongoDB connecté : ${databaseName}`);
  for (const { name } of collections.sort((a, b) => a.name.localeCompare(b.name))) {
    console.log(`${name}: ${await db.collection(name).estimatedDocumentCount()}`);
  }
} catch (error) {
  console.error(`MongoDB indisponible : ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
