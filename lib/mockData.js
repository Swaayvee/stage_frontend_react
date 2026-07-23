/**
 * Centralisation des données de test (Mock Data) pour RelayFlow
 */

export const directoryData = {
  managers: [
    ["MGR-001", "Sarah Bernard", "sarah.bernard@relayflow.fr", "Lyon Centre", "04 78 11 22 33", "Actif", "14 Jan 2025"],
    ["MGR-002", "Mehdi Benali", "mehdi.benali@relayflow.fr", "Rhône Nord", "04 72 33 44 55", "Actif", "3 Mar 2025"],
    ["MGR-003", "Clara Fontaine", "clara.fontaine@relayflow.fr", "Villeurbanne", "04 69 55 66 77", "Actif", "22 Juin 2025"],
  ],
  merchants: [
    ["MER-014", "Maison Olive", "commerce@maisonolive.fr", "Lyon 2e", "04 78 12 34 56", "45 commandes/mois", "14 Rue Sala, Lyon 2e · Lun-Sam 9h-19h"],
    ["ECM-021", "Atelier Nami", "bonjour@atelier-nami.fr", "Lyon 7e", "04 72 40 11 22", "28 commandes/mois", "12 Rue Garibaldi, Lyon 7e · Mar-Sam 10h-18h"],
    ["MOB-007", "Le Camion Vert", "contact@camionvert.fr", "Lyon Métropole", "06 80 22 33 44", "62 commandes/mois", "Tournée mobile · Lun-Ven 8h-16h"],
    ["MER-022", "Épicerie des Canuts", "contact@epiceriecanuts.fr", "Lyon 4e", "04 78 98 76 54", "31 commandes/mois", "5 Pl. de la Croix-Rousse, Lyon 4e · Lun-Dim 7h-20h"],
    ["MER-031", "Boulangerie Saint-Jean", "contact@boulangeriesaintjean.fr", "Lyon 5e", "04 72 40 11 22", "18 commandes/mois", "Place Saint-Jean, Lyon 5e · Mar-Dim 6h-13h"],
  ],
  couriers: [
    ["LIV-103", "Maya Richard", "Vélo électrique", "Lyon 3e", "06 12 34 56 78", "4.9 / 5", "156 livraisons · Actif depuis Jan 2025"],
    ["LIV-121", "Karim Diallo", "Scooter", "Villeurbanne", "06 23 45 67 89", "4.7 / 5", "98 livraisons · Actif depuis Avr 2025"],
    ["LIV-144", "Inès Laurent", "Voiture", "Lyon 7e", "06 34 56 78 90", "4.8 / 5", "201 livraisons · Actif depuis Fév 2024"],
    ["LIV-162", "Alexandre Moreau", "Scooter électrique", "Villeurbanne", "06 45 89 12 00", "4.6 / 5", "42 livraisons · Actif depuis Juin 2025"],
    ["LIV-170", "Sami Benhamou", "Fourgon utilitaire", "Lyon Métropole", "07 89 12 34 56", "4.9 / 5", "88 livraisons · Actif depuis Mar 2025"],
  ],
};

export const allDeliveriesData = [
  ["LIV-2026-042", "Maison Olive", "Lyon 2e", "En livraison", "Maya Richard", "14 Rue Victor Hugo", "2026-07-22"],
  ["LIV-2026-041", "Atelier Nami", "Lyon 7e", "À attribuer", null, "12 Rue Garibaldi", "2026-07-22"],
  ["LIV-2026-040", "Le Camion Vert", "Villeurbanne", "Livrée", "Karim Diallo", "8 Av. Thiers", "2026-07-21"],
  ["LIV-2026-039", "Épicerie des Canuts", "Lyon 4e", "En livraison", "Inès Laurent", "5 Pl. de la Croix-Rousse", "2026-07-21"],
  ["LIV-2026-038", "Maison Olive", "Villeurbanne", "À attribuer", null, "3 Rue Alsace-Lorraine", "2026-07-20"],
  ["LIV-2026-037", "Atelier Céramique", "Lyon 3e", "Livrée", "Maya Richard", "22 Cours Lafayette", "2026-07-20"],
];

export const availableDeliveries = [
  ["LIV-2026-051", "1,8 km · Lyon 3e", "Atelier Nami", "Automatique"],
  ["LIV-2026-052", "3,2 km · Villeurbanne", "Maison Olive", "Manuelle"],
  ["LIV-2026-053", "6,7 km · Lyon 9e", "Le Camion Vert", "Automatique"],
];

export const myDeliveries = [
  ["LIV-2026-042", "Retrait confirmé", "Maison Olive · 1.8 km", "Maison Olive", "Lyon 2e · 14 Rue Victor Hugo", "Lucas Martin"],
  ["LIV-2026-037", "Livrée", "Atelier Nami · 3.2 km", "Atelier Nami", "Villeurbanne · Gratte-Ciel", "Lucas Martin"],
];

export const issuesData = [
  ["INC-042", "Colis non remis", "Maison Olive · Client absent", "Priorité élevée", "Maison Olive", "Lyon 2e · 14 Rue Victor Hugo"],
  ["INC-039", "Retard signalé", "Atelier Nami · 38 min", "À contacter", "Atelier Nami", "Lyon 7e · 12 Rue Garibaldi"],
  ["INC-035", "Colis endommagé", "Boulangerie Saint-Jean · Emballage déchiré", "Priorité élevée", "Boulangerie Saint-Jean", "Lyon 5e · Place Saint-Jean"],
  ["INC-031", "Erreur d'adresse", "Fleuriste de la Rose · Numéro inexistant", "À contacter", "Fleuriste de la Rose", "Villeurbanne · Rue Anatole France"],
  ["INC-028", "Refus de prise en charge", "Café des Arts · Incompatibilité horaire", "Priorité élevée", "Café des Arts", "Lyon 1er · Place des Terreaux"],
  ["INC-022", "Livreur injoignable", "Librairie du Parc · Retard de collecte", "Incident résolu", "Librairie du Parc", "Lyon 6e · Boulevard des Belges"],
  ["INC-019", "Suspension demandée", "Marché Gourmand · Tentative de fraude", "Compte suspendu", "Marché Gourmand", "Lyon 3e · Avenue Saxe"],
];

export const applicationsData = [
  {
    id: "MER-028",
    type: "merchant",
    name: "Épicerie des Canuts",
    applicant: "Jean Dupont (Gérant)",
    subtitle: "Épicerie fine & produits locaux",
    zone: "Lyon 4e",
    date: "2026-07-22",
    status: "Dossier complet",
    email: "contact@epiceriecanuts.fr",
    phone: "04 78 12 34 56",
    documents: ["Extrait KBIS (moins de 3 mois)", "Pièce d'identité gérant", "RIB professionnel"],
  },
  {
    id: "LIV-156",
    type: "courier",
    name: "Nora Petit",
    applicant: "Nora Petit (Indépendant)",
    subtitle: "Vélo électrique · Cargo biporteur",
    zone: "Lyon 3e",
    date: "2026-07-22",
    status: "Justificatif à vérifier",
    email: "nora.petit@email.fr",
    phone: "06 12 34 56 78",
    documents: ["Pièce d'identité (CNI)", "Attestation VAE & Équipement", "Justificatif Auto-entrepreneur"],
  },
  {
    id: "MER-031",
    type: "merchant",
    name: "Boulangerie Saint-Jean",
    applicant: "Marc Vasseur (Artisan)",
    subtitle: "Boulangerie & Pâtisserie artisanale",
    zone: "Lyon 5e",
    date: "2026-07-21",
    status: "En attente",
    email: "contact@boulangeriesaintjean.fr",
    phone: "04 72 40 11 22",
    documents: ["Extrait KBIS", "RIB professionnel", "Carte professionnelle artisan"],
  },
  {
    id: "LIV-162",
    type: "courier",
    name: "Alexandre Moreau",
    applicant: "Alexandre Moreau (Indépendant)",
    subtitle: "Scooter électrique 125cc",
    zone: "Villeurbanne",
    date: "2026-07-20",
    status: "Dossier complet",
    email: "alexandre.moreau@email.fr",
    phone: "06 45 89 12 00",
    documents: ["Permis de conduire A1/B", "Carte grise scooter", "Attestation assurance pro"],
  },
  {
    id: "MER-035",
    type: "merchant",
    name: "Fleurs & Sens",
    applicant: "Camille Bernard (Fleuriste)",
    subtitle: "Fleuriste indépendant & créations florales",
    zone: "Lyon 6e",
    date: "2026-07-19",
    status: "Justificatif à vérifier",
    email: "bonjour@fleurs-et-sens.fr",
    phone: "04 78 52 90 34",
    documents: ["SIRET / Extrait Kbis", "RIB professionnel"],
  },
  {
    id: "LIV-170",
    type: "courier",
    name: "Sami Benhamou",
    applicant: "Sami Benhamou (Chauffeur)",
    subtitle: "Fourgon utilitaire L1H1",
    zone: "Lyon Métropole",
    date: "2026-07-18",
    status: "Dossier complet",
    email: "sami.benhamou@email.fr",
    phone: "07 89 12 34 56",
    documents: ["Permis B validé", "Capacité de transport (-3.5t)", "Assurance marchandises"],
  },
];

export const couriersForAssign = [
  ["LIV-103", "Maya Richard", "Vélo électrique", "Lyon 3e", 2.1, "4.9 / 5"],
  ["LIV-121", "Karim Diallo", "Scooter", "Villeurbanne", 4.5, "4.7 / 5"],
  ["LIV-144", "Inès Laurent", "Voiture", "Lyon 7e", 8.2, "4.8 / 5"],
];
