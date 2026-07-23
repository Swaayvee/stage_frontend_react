/**
 * Retourne la couleur CSS correspondant au statut d'une livraison ou d'un incident.
 * @param {string} status
 * @returns {"green"|"blue"|"red"|"amber"}
 */
export function getStatusColor(status) {
  if (!status) return "amber";
  const s = status.toLowerCase();
  if (
    s.includes("livré") ||
    s.includes("terminé") ||
    s.includes("résolu") ||
    s.includes("accepté")
  )
    return "green";
  if (
    s.includes("en livraison") ||
    s.includes("retrait confirmé") ||
    s.includes("cours")
  )
    return "blue";
  if (
    s.includes("suspendu") ||
    s.includes("banni") ||
    s.includes("refusé") ||
    s.includes("non remis") ||
    s.includes("urgent") ||
    s.includes("priorité")
  )
    return "red";
  if (
    s.includes("à attribuer") ||
    s.includes("en attente") ||
    s.includes("retard") ||
    s.includes("contacter") ||
    s.includes("à vérifier")
  )
    return "amber";
  if (s.includes("disponible") || s.includes("en ligne")) return "green";
  return "amber";
}
