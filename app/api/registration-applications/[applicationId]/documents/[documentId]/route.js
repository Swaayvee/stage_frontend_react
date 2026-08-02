import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getApplicationDocument } from "../../../../../../lib/server/database";
import { verifyAccessToken } from "../../../../../../lib/server/jwt";

export async function GET(_request, { params }) {
  const cookieStore = await cookies();
  const actor = ["manager", "super_manager"]
    .map((role) => verifyAccessToken(cookieStore.get(`relayflow_access_${role}`)?.value))
    .find((payload) => payload && ["manager", "super_manager"].includes(payload.role));
  if (!actor) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });

  const { applicationId, documentId } = await params;
  const document = await getApplicationDocument(String(applicationId), String(documentId), actor);
  if (!document) return NextResponse.json({ error: "Document introuvable ou interdit." }, { status: 404 });

  const data = Buffer.from(document.data?.buffer || document.data);
  const safeAsciiName = String(document.nom || "justificatif").replace(/[^a-zA-Z0-9._-]/g, "_");
  return new NextResponse(data, {
    headers: {
      "Content-Type": document.type,
      "Content-Length": String(data.length),
      "Content-Disposition": `inline; filename="${safeAsciiName}"; filename*=UTF-8''${encodeURIComponent(document.nom)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}
