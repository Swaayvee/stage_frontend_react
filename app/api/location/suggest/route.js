import { NextResponse } from "next/server";

const COMPLETION_URL = "https://data.geopf.fr/geocodage/completion/";
const GEO_URL = "https://geo.api.gouv.fr";
const allowedTypes = new Set(["address", "city", "department", "department-code"]);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const query = String(searchParams.get("q") || "").trim().slice(0, 120);
  if (!allowedTypes.has(type) || query.length < 2)
    return NextResponse.json({ error: "Recherche invalide." }, { status: 400 });

  let target;
  if (type === "address") {
    const params = new URLSearchParams({
      text: query,
      type: "StreetAddress",
      maximumResponses: "7",
    });
    target = `${COMPLETION_URL}?${params}`;
  } else if (type === "city") {
    const params = new URLSearchParams({
      nom: query,
      fields: "nom,code,codeDepartement,codesPostaux,departement,centre",
      boost: "population",
      limit: "8",
    });
    target = `${GEO_URL}/communes?${params}`;
  } else if (type === "department") {
    const params = new URLSearchParams({
      nom: query,
      fields: "nom,code,codeRegion",
    });
    target = `${GEO_URL}/departements?${params}`;
  } else {
    target = `${GEO_URL}/departements/${encodeURIComponent(query)}`;
  }

  try {
    const response = await fetch(target, {
      headers: { Accept: "application/json" },
      next: { revalidate: type === "address" ? 86_400 : 604_800 },
    });
    if (!response.ok)
      return NextResponse.json({ error: "Service géographique indisponible." }, { status: 502 });
    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Service géographique indisponible." }, { status: 502 });
  }
}
