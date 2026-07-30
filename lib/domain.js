/** Enums et règles métier — spec « Livraison Vendeur » */

export const ROLES = {
  vendeur: "merchant",
  livreur: "courier",
  manager: "manager",
  super_manager: "super_manager",
};

export const ROUTE_TO_ROLE = {
  merchant: "vendeur",
  courier: "livreur",
  manager: "manager",
  super_manager: "super_manager",
};

export const STATUT_COMPTE = ["invite", "actif", "suspendu"];
export const STATUT_OPERATIONNEL = ["disponible", "en_pause", "hors_service", "autre"];
export const MODE_PRISE_EN_CHARGE = ["propre", "equipe", "pool_plateforme"];
export const STATUT_LIVRAISON = [
  "SOUMISE",
  "ACCEPTEE",
  "REFUSEE",
  "RETIREE",
  "LIVREE",
  "ECHOUEE",
];

export const STATUT_PARTENARIAT = ["en_attente", "actif", "revoque", "rejete"];
export const TYPE_SIGNALEMENT = [
  "probleme_retrait",
  "probleme_remise",
  "probleme_paiement",
  "autre",
];
export const STATUT_SIGNALEMENT = [
  "ouvert",
  "en_traitement",
  "escalade",
  "resolu",
  "rejete",
];

export const TARIF_ABONNEMENT_MENSUEL = 19.9;
export const TARIF_LIVRAISON_UNITAIRE = 1.5;
export const TARIF_LIVRAISON_VENDEUR = 3.5;
export const DEVISE_PLATEFORME = "EUR";

export function economieLivraison(modePriseEnCharge) {
  const livraisonPropre = modePriseEnCharge === "propre";
  const coutVendeur = livraisonPropre ? 0 : TARIF_LIVRAISON_VENDEUR;
  const remunerationLivreur = livraisonPropre ? 0 : TARIF_LIVRAISON_UNITAIRE;
  return {
    devise: DEVISE_PLATEFORME,
    coutVendeur,
    remunerationLivreur,
    commissionPlateforme: coutVendeur - remunerationLivreur,
    regle: livraisonPropre
      ? "livraison_propre_sans_frais"
      : "tarif_fixe_plateforme",
  };
}

export const STATUT_LIVRAISON_LABEL = {
  SOUMISE: "Soumise",
  ACCEPTEE: "Acceptée",
  REFUSEE: "Refusée",
  RETIREE: "Retirée",
  LIVREE: "Livrée",
  ECHOUEE: "Échouée",
};

export const MODE_LABEL = {
  propre: "Propre (vendeur)",
  equipe: "Équipe partenaire",
  pool_plateforme: "Pool plateforme",
};

export const WORKFLOW_STEPS = [
  { key: "SOUMISE", label: "Soumise" },
  { key: "ACCEPTEE", label: "Acceptée" },
  { key: "RETIREE", label: "Retirée" },
  { key: "LIVREE", label: "Livrée" },
];

/** Transitions autorisées (spec §6) */
export const DELIVERY_TRANSITIONS = {
  SOUMISE: ["ACCEPTEE", "REFUSEE"],
  ACCEPTEE: ["RETIREE", "ECHOUEE"],
  REFUSEE: ["SOUMISE"],
  RETIREE: ["LIVREE", "ECHOUEE"],
  ECHOUEE: ["SOUMISE"],
  LIVREE: [],
};

export function statutIndex(statut) {
  const order = ["SOUMISE", "ACCEPTEE", "RETIREE", "LIVREE"];
  const i = order.indexOf(statut);
  if (statut === "ECHOUEE" || statut === "REFUSEE") return 0;
  return i < 0 ? 0 : i;
}

export function inJurisdiction(profile, juridiction) {
  if (!juridiction) return true;
  if (juridiction.niveau === "pays") return true;
  if (juridiction.code) {
    if (juridiction.niveau === "departement")
      return profile?.codeDepartement === juridiction.code;
    if (juridiction.niveau === "ville")
      return profile?.codeCommune === juridiction.code;
  }
  const normalize = (value) =>
    String(value || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
  if (juridiction.niveau === "departement")
    return normalize(profile?.departement) === normalize(juridiction.valeur);
  if (juridiction.niveau === "ville")
    return normalize(profile?.ville) === normalize(juridiction.valeur);
  return false;
}

export function courierCoversDelivery(livreur, livraison) {
  if (!livreur || !livraison) return false;
  const normalize = (value) =>
    String(value || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
  const ville =
    livraison.villeLivraison ||
    livraison.client?.ville ||
    livraison.villeLivraison;
  const dept =
    livraison.departementLivraison || livraison.client?.departement;
  const zones = Array.isArray(livreur.zonesCouvertes) && livreur.zonesCouvertes.length
    ? livreur.zonesCouvertes
    : [{
        ville: livreur.ville,
        departement: livreur.departement,
        codeCommune: livreur.codeCommune,
        codeDepartement: livreur.codeDepartement,
      }];
  return zones.some((zone) => {
    if (livraison.codeCommuneLivraison && zone.codeCommune)
      return livraison.codeCommuneLivraison === zone.codeCommune;
    if (zone.ville && ville)
      return normalize(zone.ville) === normalize(ville);
    if (livraison.codeDepartementLivraison && zone.codeDepartement)
      return livraison.codeDepartementLivraison === zone.codeDepartement;
    return normalize(zone.departement) === normalize(dept);
  });
}

export function distanceKm(from, to) {
  if (![from?.lat, from?.lng, to?.lat, to?.lng].every((value) => Number.isFinite(Number(value))))
    return null;
  const radians = (degrees) => (Number(degrees) * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = radians(to.lat - from.lat);
  const dLng = radians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function canTransition(from, to) {
  return (DELIVERY_TRANSITIONS[from] || []).includes(to);
}
