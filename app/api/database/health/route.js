import { NextResponse } from "next/server";
import { checkMongoConnection } from "../../../../lib/server/mongodb";

export async function GET() {
  try {
    const health = await checkMongoConnection();
    return NextResponse.json({ status: "connected", database: health.database, latencyMs: health.latencyMs });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
