import {
  TARIF_ABONNEMENT_MENSUEL,
  TARIF_LIVRAISON_UNITAIRE,
  economieLivraison,
} from "./domain";

/** Jeu de données initial — aligné collections MongoDB (DB_V0) */
export function createSeedState() {
  const now = new Date();
  const iso = (d) => d.toISOString();

  const comptes = [
    {
      _id: "cmp_vendeur1",
      email: "commerce@maisonolive.fr",
      motDePasseHash: "demo123",
      role: "vendeur",
      statutCompte: "actif",
      dateCreation: iso(new Date("2025-01-14")),
      derniereConnexion: null,
    },
    {
      _id: "cmp_livreur1",
      email: "lucas.martin@email.fr",
      motDePasseHash: "demo123",
      role: "livreur",
      statutCompte: "actif",
      dateCreation: iso(new Date("2025-01-10")),
    },
    {
      _id: "cmp_livreur2",
      email: "maya.richard@email.fr",
      motDePasseHash: "demo123",
      role: "livreur",
      statutCompte: "actif",
      dateCreation: iso(new Date("2025-02-01")),
    },
    {
      _id: "cmp_gest1",
      email: "sarah.bernard@relayflow.fr",
      motDePasseHash: "demo123",
      role: "manager",
      statutCompte: "actif",
      dateCreation: iso(new Date("2025-01-05")),
    },
    {
      _id: "cmp_super1",
      email: "admin@relayflow.fr",
      motDePasseHash: "demo123",
      role: "super_manager",
      statutCompte: "actif",
      dateCreation: iso(new Date("2024-12-01")),
    },
    {
      _id: "cmp_vendeur2",
      email: "bonjour@atelier-nami.fr",
      motDePasseHash: "demo123",
      role: "vendeur",
      statutCompte: "actif",
      dateCreation: iso(new Date("2025-03-03")),
    },
  ];

  const vendeurs = [
    {
      _id: "ven1",
      compteId: "cmp_vendeur1",
      raisonSociale: "Maison Olive",
      telephone: "04 78 12 34 56",
      adresse: "14 Rue Sala",
      ville: "Lyon",
      departement: "Rhône",
      dateCreation: iso(new Date("2025-01-14")),
    },
    {
      _id: "ven2",
      compteId: "cmp_vendeur2",
      raisonSociale: "Atelier Nami",
      telephone: "04 72 40 11 22",
      adresse: "12 Rue Garibaldi",
      ville: "Lyon",
      departement: "Rhône",
      dateCreation: iso(new Date("2025-03-03")),
    },
  ];

  const livreurs = [
    {
      _id: "liv1",
      compteId: "cmp_livreur1",
      nom: "Lucas Martin",
      adresse: "8 Rue de la République",
      ville: "Lyon",
      departement: "Rhône",
      typeVehicule: "Vélo électrique",
      statutOperationnel: "disponible",
      rayonRechercheKm: 5,
      coordonnees: { lat: 45.764, lng: 4.8357 },
    },
    {
      _id: "liv2",
      compteId: "cmp_livreur2",
      nom: "Maya Richard",
      adresse: "22 Cours Lafayette",
      ville: "Lyon",
      departement: "Rhône",
      typeVehicule: "Vélo électrique",
      statutOperationnel: "disponible",
      rayonRechercheKm: 5,
      coordonnees: { lat: 45.75, lng: 4.85 },
    },
  ];

  const gestionnaires = [
    {
      _id: "gest1",
      compteId: "cmp_gest1",
      nom: "Sarah Bernard",
      telephone: "06 18 42 73 90",
      juridiction: { niveau: "departement", valeur: "Rhône" },
      invitePar: "cmp_super1",
    },
  ];

  const partenariats = [
    {
      _id: "part1",
      vendeurId: "ven1",
      livreurId: "liv1",
      statut: "actif",
      dateCreation: iso(new Date("2025-02-01")),
    },
    {
      _id: "part2",
      vendeurId: "ven1",
      livreurId: "liv2",
      statut: "en_attente",
      dateCreation: iso(new Date("2026-07-20")),
    },
    {
      _id: "part3",
      vendeurId: "ven2",
      livreurId: "liv1",
      statut: "en_attente",
      message: "Nous cherchons un partenaire régulier pour nos livraisons sur Lyon.",
      dateCreation: iso(new Date("2026-07-28")),
    },
  ];

  const livraisons = [
    {
      _id: "del1",
      numeroSuivi: "RF-2026-042",
      suiviPublic: true,
      publicTrackingToken: "track_demo_rf_2026_042",
      vendeurId: "ven1",
      modePriseEnCharge: "pool_plateforme",
      livreurId: "liv1",
      client: {
        nom: "Martin",
        prenom: "Lucas",
        telephone: "06 11 22 33 44",
        adresse: "14 Rue Victor Hugo, Lyon 2e",
      },
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Colis alimentaire — 2,4 kg",
      statut: "RETIREE",
      dateSoumission: iso(new Date("2026-07-22")),
      dateReceptionPrevue: iso(new Date("2026-07-22")),
      codeLivraison: "A3F7Z1",
      tentatives: 1,
      historique: [
        {
          ancienStatut: "SOUMISE",
          nouveauStatut: "ACCEPTEE",
          parQui: "cmp_livreur1",
          quand: iso(new Date("2026-07-22T09:00:00")),
          commentaire: "Acceptation pool",
        },
        {
          ancienStatut: "ACCEPTEE",
          nouveauStatut: "RETIREE",
          parQui: "cmp_livreur1",
          quand: iso(new Date("2026-07-22T10:30:00")),
          commentaire: "Retrait confirmé",
        },
      ],
    },
    {
      _id: "del2",
      numeroSuivi: "RF-2026-041",
      vendeurId: "ven2",
      modePriseEnCharge: "pool_plateforme",
      livreurId: null,
      client: {
        nom: "Dupont",
        prenom: "Marie",
        telephone: "",
        adresse: "12 Rue Garibaldi, Lyon 7e",
      },
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Céramique fragile",
      statut: "SOUMISE",
      dateSoumission: iso(new Date("2026-07-22")),
      dateReceptionPrevue: iso(new Date("2026-07-23")),
      tentatives: 1,
      historique: [],
    },
    {
      _id: "del3",
      numeroSuivi: "RF-2026-040",
      vendeurId: "ven1",
      modePriseEnCharge: "equipe",
      livreurId: "liv1",
      client: {
        nom: "Bernard",
        prenom: "Sophie",
        adresse: "8 Av. Thiers, Villeurbanne",
      },
      villeLivraison: "Villeurbanne",
      departementLivraison: "Rhône",
      descriptionContenu: "Commande boutique",
      statut: "LIVREE",
      dateSoumission: iso(new Date("2026-07-21")),
      dateReceptionPrevue: iso(new Date("2026-07-21")),
      codeLivraison: "K9M2P4",
      tentatives: 1,
      historique: [
        {
          ancienStatut: "SOUMISE",
          nouveauStatut: "ACCEPTEE",
          parQui: "cmp_livreur1",
          quand: iso(new Date("2026-07-21T08:00:00")),
        },
        {
          ancienStatut: "ACCEPTEE",
          nouveauStatut: "RETIREE",
          parQui: "cmp_livreur1",
          quand: iso(new Date("2026-07-21T09:00:00")),
        },
        {
          ancienStatut: "RETIREE",
          nouveauStatut: "LIVREE",
          parQui: "cmp_livreur1",
          quand: iso(new Date("2026-07-21T11:00:00")),
          commentaire: "Code client validé",
        },
      ],
    },
    {
      _id: "del4",
      numeroSuivi: "RF-2026-038",
      vendeurId: "ven1",
      modePriseEnCharge: "propre",
      livreurId: null,
      nomLivreurTexte: "Jean Dupont (gérant)",
      client: {
        nom: "Petit",
        prenom: "Nora",
        adresse: "3 Rue Alsace-Lorraine, Villeurbanne",
      },
      villeLivraison: "Villeurbanne",
      departementLivraison: "Rhône",
      descriptionContenu: "Produits locaux",
      statut: "ACCEPTEE",
      dateSoumission: iso(new Date("2026-07-20")),
      dateReceptionPrevue: iso(new Date("2026-07-20")),
      tentatives: 1,
      historique: [
        {
          ancienStatut: "SOUMISE",
          nouveauStatut: "ACCEPTEE",
          parQui: "cmp_vendeur1",
          quand: iso(new Date("2026-07-20T14:00:00")),
          commentaire: "Mode propre — acceptation directe",
        },
      ],
    },
    {
      _id: "del5",
      numeroSuivi: "RF-2026-049",
      vendeurId: "ven1",
      modePriseEnCharge: "equipe",
      poolAttribution: null,
      livreurId: null,
      client: {
        nom: "Robert",
        prenom: "Émilie",
        telephone: "06 20 30 40 50",
        adresse: "25 Rue de la République, Lyon",
      },
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Commande boutique",
      statut: "SOUMISE",
      dateSoumission: iso(new Date("2026-07-29T09:30:00")),
      dateReceptionPrevue: iso(new Date("2026-07-30T14:00:00")),
      tentatives: 1,
      historique: [],
    },
    {
      _id: "del6",
      numeroSuivi: "RF-2026-050",
      vendeurId: "ven1",
      modePriseEnCharge: "pool_plateforme",
      poolAttribution: "validation_vendeur",
      livreurId: null,
      client: {
        nom: "Diallo",
        prenom: "Inès",
        telephone: "06 50 40 30 20",
        adresse: "18 Cours Lafayette, Lyon",
      },
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Petit colis",
      statut: "SOUMISE",
      dateSoumission: iso(new Date("2026-07-29T11:15:00")),
      dateReceptionPrevue: iso(new Date("2026-07-30T16:00:00")),
      tentatives: 1,
      historique: [],
    },
    {
      _id: "del7",
      numeroSuivi: "RF-2026-048",
      vendeurId: "ven1",
      modePriseEnCharge: "pool_plateforme",
      poolAttribution: "automatique",
      livreurId: null,
      client: {
        nom: "Morel",
        prenom: "Thomas",
        telephone: "06 60 70 80 90",
        adresse: "6 Place Bellecour, Lyon",
      },
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Commande express",
      statut: "SOUMISE",
      dateSoumission: iso(new Date("2026-07-29T08:45:00")),
      dateReceptionPrevue: iso(new Date("2026-07-30T12:00:00")),
      tentatives: 1,
      historique: [],
    },
  ];

  [
    ["del8", "RF-2026-051", "ven2", "liv2", "ACCEPTEE", "Élise Robert", "9 Rue Paul Bert, Lyon", "Créations textiles", "2026-07-28T10:15:00"],
    ["del9", "RF-2026-052", "ven1", "liv1", "RETIREE", "Camille Nguyen", "31 Quai Saint-Vincent, Lyon", "Panier gourmand", "2026-07-27T08:30:00"],
    ["del10", "RF-2026-053", "ven2", null, "SOUMISE", "Manon Petit", "4 Avenue des Frères Lumière, Lyon", "Accessoires faits main", "2026-07-30T08:05:00"],
    ["del11", "RF-2026-054", "ven1", "liv2", "LIVREE", "Hugo Leroy", "17 Rue de la Part-Dieu, Lyon", "Produits frais", "2026-07-25T09:00:00"],
    ["del12", "RF-2026-055", "ven2", null, "LIVREE", "Lou Fournier", "2 Place Sathonay, Lyon", "Commande personnalisée", "2026-07-24T14:20:00"],
    ["del13", "RF-2026-056", "ven1", "liv1", "ECHOUEE", "Inès Moreau", "45 Rue Vendôme, Lyon", "Épicerie et boissons", "2026-07-23T11:00:00"],
  ].forEach(([id, tracking, sellerId, courierId, status, customerName, address, description, submittedAt], index) => {
    const [firstName, ...lastName] = customerName.split(" ");
    const ownDelivery = id === "del12";
    const manualPool = id === "del10";
    const submittedDate = new Date(submittedAt);
    const deliveryActor = courierId
      ? (courierId === "liv1" ? "cmp_livreur1" : "cmp_livreur2")
      : "cmp_vendeur2";
    const deliveryHistory = [];
    if (status !== "SOUMISE") {
      deliveryHistory.push({
        ancienStatut: "SOUMISE",
        nouveauStatut: "ACCEPTEE",
        parQui: deliveryActor,
        quand: iso(new Date(submittedDate.getTime() + 20 * 60 * 1000)),
        commentaire: ownDelivery ? "Prise en charge par le commerce" : "Livraison acceptée",
      });
    }
    if (["RETIREE", "LIVREE", "ECHOUEE"].includes(status)) {
      deliveryHistory.push({
        ancienStatut: "ACCEPTEE",
        nouveauStatut: "RETIREE",
        parQui: deliveryActor,
        quand: iso(new Date(submittedDate.getTime() + 60 * 60 * 1000)),
        commentaire: "Colis retiré auprès du commerce",
      });
    }
    if (["LIVREE", "ECHOUEE"].includes(status)) {
      deliveryHistory.push({
        ancienStatut: "RETIREE",
        nouveauStatut: status,
        parQui: deliveryActor,
        quand: iso(new Date(submittedDate.getTime() + 90 * 60 * 1000)),
        commentaire: status === "ECHOUEE"
          ? "Destinataire absent après la tentative de remise"
          : "Remise confirmée au destinataire",
      });
    }
    livraisons.push({
      _id: id,
      numeroSuivi: tracking,
      vendeurId: sellerId,
      modePriseEnCharge: ownDelivery ? "propre" : id === "del9" ? "equipe" : "pool_plateforme",
      poolAttribution: ownDelivery ? null : manualPool ? "validation_vendeur" : "automatique",
      livreurId: courierId,
      nomLivreurTexte: ownDelivery ? "Équipe Atelier Nami" : null,
      client: {
        prenom: firstName,
        nom: lastName.join(" "),
        telephone: `06 ${String(11 + index * 10).padStart(2, "0")} 22 33 44`,
        adresse: address,
      },
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: description,
      statut: status,
      dateSoumission: iso(submittedDate),
      dateReceptionPrevue: iso(new Date(submittedDate.getTime() + 6 * 60 * 60 * 1000)),
      tentatives: 1,
      historique: deliveryHistory,
    });
  });

  const signalements = [
    {
      _id: "sig1",
      ref: "SIG-2026-001",
      type: "probleme_remise",
      livraisonId: "del1",
      auteurId: "cmp_livreur1",
      gestionnaireAssigneId: "gest1",
      description: "Le destinataire est absent. Une seconde tentative doit être organisée.",
      statut: "en_traitement",
      dateCreation: iso(new Date("2026-07-22T12:05:00")),
      historique: [
        {
          statut: "ouvert",
          acteurId: "cmp_livreur1",
          quand: iso(new Date("2026-07-22T12:05:00")),
          commentaire: "Incident créé après l’échec de la première présentation.",
        },
        {
          statut: "en_traitement",
          acteurId: "cmp_gest1",
          quand: iso(new Date("2026-07-22T12:25:00")),
          commentaire: "Le manager contacte le livreur et le commerçant.",
        },
      ],
    },
    {
      _id: "sig2",
      ref: "SIG-2026-002",
      type: "probleme_paiement",
      livraisonId: null,
      auteurId: "cmp_vendeur1",
      gestionnaireAssigneId: "gest1",
      description: "Une ligne de livraison de la facture de juin nécessite une explication.",
      statut: "resolu",
      dateCreation: iso(new Date("2026-07-02T09:15:00")),
      historique: [
        {
          statut: "ouvert",
          acteurId: "cmp_vendeur1",
          quand: iso(new Date("2026-07-02T09:15:00")),
          commentaire: "Demande d’explication sur la facture FAC2.",
        },
        {
          statut: "en_traitement",
          acteurId: "cmp_gest1",
          quand: iso(new Date("2026-07-02T09:40:00")),
          commentaire: "Vérification du détail des livraisons facturées.",
        },
        {
          statut: "resolu",
          acteurId: "cmp_gest1",
          quand: iso(new Date("2026-07-02T15:20:00")),
          commentaire: "Le détail a été expliqué et confirmé par le commerçant.",
        },
      ],
    },
  ];

  const messagesIncidents = [
    {
      _id: "msg_sig1_1",
      signalementId: "sig1",
      expediteurCompteId: "cmp_gest1",
      destinataireCompteIds: ["cmp_livreur1", "cmp_vendeur1"],
      contenu: "Bonjour, pouvez-vous confirmer si une nouvelle tentative a été convenue avec le destinataire ?",
      dateCreation: iso(new Date("2026-07-22T12:27:00")),
      luParCompteIds: ["cmp_gest1", "cmp_vendeur1"],
    },
    {
      _id: "msg_sig1_2",
      signalementId: "sig1",
      expediteurCompteId: "cmp_livreur1",
      destinataireCompteIds: ["cmp_gest1"],
      contenu: "Oui, une nouvelle tentative est prévue demain entre 10 h et 12 h.",
      dateCreation: iso(new Date("2026-07-22T12:42:00")),
      luParCompteIds: ["cmp_livreur1"],
    },
    {
      _id: "msg_sig2_1",
      signalementId: "sig2",
      expediteurCompteId: "cmp_gest1",
      destinataireCompteIds: ["cmp_vendeur1"],
      contenu: "La ligne correspond à deux livraisons pool terminées en juin. Je vous envoie le détail des références.",
      dateCreation: iso(new Date("2026-07-02T10:05:00")),
      luParCompteIds: ["cmp_gest1", "cmp_vendeur1"],
    },
    {
      _id: "msg_sig2_2",
      signalementId: "sig2",
      expediteurCompteId: "cmp_vendeur1",
      destinataireCompteIds: ["cmp_gest1"],
      contenu: "Merci, les références correspondent bien à nos livraisons. Le dossier peut être clôturé.",
      dateCreation: iso(new Date("2026-07-02T15:05:00")),
      luParCompteIds: ["cmp_vendeur1", "cmp_gest1"],
    },
  ];

  const notifications = [
    {
      _id: "not1",
      compteId: "cmp_vendeur1",
      type: "maj_etat_livraison",
      titre: "Livraison acceptée",
      contenu: "Lucas Martin a pris en charge RF-2026-042",
      lienRessource: "/merchant/deliveries",
      lu: true,
      dateEnvoi: iso(new Date("2026-07-22T09:01:00")),
    },
  ];

  const abonnements = [
    {
      _id: "abo1",
      vendeurId: "ven1",
      montantMensuel: TARIF_ABONNEMENT_MENSUEL,
      statut: "actif",
      dateDebut: iso(new Date("2025-01-14")),
      dateFin: null,
    },
  ];

  const factures = [
    {
      _id: "fac1",
      vendeurId: "ven1",
      periodeDebut: iso(new Date("2026-05-01T00:00:00")),
      periodeFin: iso(new Date("2026-05-31T23:59:59.999")),
      montant: TARIF_ABONNEMENT_MENSUEL,
      statut: "payee",
      dateEmission: iso(new Date("2026-06-01T08:00:00")),
      datePaiement: iso(new Date("2026-06-05T10:20:00")),
      genereParCompteId: "cmp_gest1",
      paiementEnregistreParCompteId: "cmp_gest1",
    },
    {
      _id: "fac2",
      vendeurId: "ven1",
      periodeDebut: iso(new Date("2026-06-01T00:00:00")),
      periodeFin: iso(new Date("2026-06-30T23:59:59.999")),
      montant: TARIF_ABONNEMENT_MENSUEL,
      statut: "payee",
      dateEmission: iso(new Date("2026-07-01T08:00:00")),
      datePaiement: iso(new Date("2026-07-03T11:10:00")),
      genereParCompteId: "cmp_gest1",
      paiementEnregistreParCompteId: "cmp_gest1",
    },
  ];

  const bonsPaiement = [
    {
      _id: "bp1",
      livreurId: "liv1",
      periodeDebut: iso(new Date("2026-06-01T00:00:00")),
      periodeFin: iso(new Date("2026-06-30T23:59:59.999")),
      nombreLivraisonsTraitees: 12,
      tarifUnitaire: TARIF_LIVRAISON_UNITAIRE,
      montantTotal: 18,
      statut: "emis",
      dateEmission: iso(new Date("2026-07-01T08:15:00")),
      genereParCompteId: "cmp_gest1",
    },
  ];

  const evaluations = [
    {
      _id: "eval1",
      livraisonId: "del3",
      livreurId: "liv1",
      vendeurId: "ven1",
      auteurType: "client",
      cibleType: "livreur",
      auteurCompteId: null,
      note: 5,
      commentaire: "Livraison ponctuelle et soignée.",
      dateCreation: iso(new Date("2026-07-21T11:30:00")),
    },
    {
      _id: "eval2",
      livraisonId: "del3",
      livreurId: "liv1",
      vendeurId: "ven1",
      auteurType: "livreur",
      cibleType: "vendeur",
      auteurCompteId: "cmp_livreur1",
      note: 4,
      commentaire: "Commande prête au retrait et informations complètes.",
      dateCreation: iso(new Date("2026-07-21T11:40:00")),
    },
  ];

  comptes.push(
    {
      _id: "cmp_candidature_vendeur",
      email: "contact@lecomptoirvert.fr",
      motDePasseHash: "Candidat2026!",
      role: "vendeur",
      statutCompte: "invite",
      dateCreation: iso(new Date("2026-07-29T09:20:00")),
    },
    {
      _id: "cmp_candidature_livreur1",
      email: "nina.roux@email.fr",
      motDePasseHash: "Candidat2026!",
      role: "livreur",
      statutCompte: "invite",
      dateCreation: iso(new Date("2026-07-29T14:15:00")),
    },
    {
      _id: "cmp_candidature_livreur2",
      email: "yanis.benali@email.fr",
      motDePasseHash: "Candidat2026!",
      role: "livreur",
      statutCompte: "invite",
      dateCreation: iso(new Date("2026-07-30T08:40:00")),
    }
  );
  vendeurs.push({
    _id: "ven_candidature",
    compteId: "cmp_candidature_vendeur",
    raisonSociale: "Le Comptoir Vert",
    telephone: "04 81 22 33 44",
    adresse: "28 Rue de Marseille",
    ville: "Lyon",
    departement: "Rhône",
    dateCreation: iso(new Date("2026-07-29T09:20:00")),
  });
  livreurs.push(
    {
      _id: "liv_candidature1",
      compteId: "cmp_candidature_livreur1",
      nom: "Nina Roux",
      telephone: "06 72 83 94 05",
      adresse: "6 Rue du Dauphiné",
      ville: "Lyon",
      departement: "Rhône",
      typeVehicule: "bike",
      statutOperationnel: "indisponible",
      zonesCouvertes: [{ ville: "Lyon", departement: "Rhône" }],
    },
    {
      _id: "liv_candidature2",
      compteId: "cmp_candidature_livreur2",
      nom: "Yanis Benali",
      telephone: "06 82 93 04 15",
      adresse: "11 Cours Émile-Zola",
      ville: "Villeurbanne",
      departement: "Rhône",
      typeVehicule: "scooter",
      statutOperationnel: "indisponible",
      zonesCouvertes: [{ ville: "Villeurbanne", departement: "Rhône" }],
    }
  );

  const applications = [
    {
      _id: "app_demo_vendeur",
      reference: "APP-0101",
      role: "vendeur",
      nom: "Clara Dubois",
      raisonSociale: "Le Comptoir Vert",
      email: "contact@lecomptoirvert.fr",
      telephone: "04 81 22 33 44",
      adresse: "28 Rue de Marseille",
      ville: "Lyon",
      departement: "Rhône",
      codePostal: "69007",
      typeVehicule: "",
      compteId: "cmp_candidature_vendeur",
      profilId: "ven_candidature",
      profil: { merchantType: "physical", secteurActivite: "Épicerie responsable", siret: "812 345 678 00019" },
      documents: [
        { nom: "kbis-comptoir-vert.pdf", type: "application/pdf", taille: 184000, url: "/documents/kbis-comptoir-vert.pdf" },
        { nom: "justificatif-local-comptoir-vert.pdf", type: "application/pdf", taille: 126000, url: "/documents/justificatif-local-comptoir-vert.pdf" },
      ],
      statut: "en_attente",
      managerIds: ["gest1"],
      fallbackTousManagers: true,
      dateCreation: iso(new Date("2026-07-29T09:20:00")),
      historique: [{ statut: "en_attente", acteurId: null, quand: iso(new Date("2026-07-29T09:20:00")), commentaire: "Demande reçue." }],
    },
    {
      _id: "app_demo_livreur1",
      reference: "APP-0102",
      role: "livreur",
      nom: "Nina Roux",
      raisonSociale: "",
      email: "nina.roux@email.fr",
      telephone: "06 72 83 94 05",
      adresse: "6 Rue du Dauphiné",
      ville: "Lyon",
      departement: "Rhône",
      codePostal: "69003",
      typeVehicule: "bike",
      compteId: "cmp_candidature_livreur1",
      profilId: "liv_candidature1",
      profil: { statutJuridique: "auto_entrepreneur", zoneLivraison: "Lyon 3e et 7e" },
      documents: [
        { nom: "identite-nina-roux.pdf", type: "application/pdf", taille: 132000, url: "/documents/identite-nina-roux.pdf" },
        { nom: "activite-nina-roux.pdf", type: "application/pdf", taille: 118000, url: "/documents/activite-nina-roux.pdf" },
      ],
      statut: "en_attente",
      managerIds: ["gest1"],
      fallbackTousManagers: true,
      dateCreation: iso(new Date("2026-07-29T14:15:00")),
      historique: [{ statut: "en_attente", acteurId: null, quand: iso(new Date("2026-07-29T14:15:00")), commentaire: "Demande reçue." }],
    },
    {
      _id: "app_demo_livreur2",
      reference: "APP-0103",
      role: "livreur",
      nom: "Yanis Benali",
      raisonSociale: "",
      email: "yanis.benali@email.fr",
      telephone: "06 82 93 04 15",
      adresse: "11 Cours Émile-Zola",
      ville: "Villeurbanne",
      departement: "Rhône",
      codePostal: "69100",
      typeVehicule: "scooter",
      compteId: "cmp_candidature_livreur2",
      profilId: "liv_candidature2",
      profil: { statutJuridique: "micro_entreprise", zoneLivraison: "Villeurbanne et Lyon Est", immatriculation: "GT-482-PQ" },
      documents: [
        { nom: "permis-yanis-benali.pdf", type: "application/pdf", taille: 205000, url: "/documents/permis-yanis-benali.pdf" },
        { nom: "carte-grise-yanis-benali.pdf", type: "application/pdf", taille: 176000, url: "/documents/carte-grise-yanis-benali.pdf" },
      ],
      statut: "en_attente",
      managerIds: ["gest1"],
      fallbackTousManagers: true,
      dateCreation: iso(new Date("2026-07-30T08:40:00")),
      historique: [{ statut: "en_attente", acteurId: null, quand: iso(new Date("2026-07-30T08:40:00")), commentaire: "Demande reçue." }],
    },
  ];

  // Historique déterministe utilisé par les graphiques mensuels.
  for (let monthOffset = 1; monthOffset <= 5; monthOffset += 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 12, 10);
    const deliveryCount = 2 + (monthOffset % 3);
    for (let index = 0; index < deliveryCount; index += 1) {
      const id = `hist_del_${monthOffset}_${index}`;
      livraisons.push({
        _id: id,
        numeroSuivi: `RF-HIST-${monthOffset}${index}`,
        vendeurId: index % 2 === 0 ? "ven1" : "ven2",
        modePriseEnCharge: "pool_plateforme",
        livreurId: "liv1",
        client: {
          nom: `Client ${monthOffset}${index}`,
          prenom: "Historique",
          adresse: "Lyon",
        },
        villeLivraison: "Lyon",
        departementLivraison: "Rhône",
        descriptionContenu: "Livraison historique",
        statut: "LIVREE",
        dateSoumission: iso(monthDate),
        dateReceptionPrevue: iso(new Date(
          monthDate.getTime() +
            (monthOffset === 5 && index === 0 ? 30 : 120) * 60 * 1000
        )),
        tentatives: 1,
        historique: [{
          ancienStatut: "RETIREE",
          nouveauStatut: "LIVREE",
          parQui: "cmp_livreur1",
          quand: iso(new Date(monthDate.getTime() + 60 * 60 * 1000)),
          commentaire: "Livraison terminée",
        }],
      });
    }
    const incidentDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 16, 9, 15);
    const historicalIssueStatus = monthOffset === 1 ? "en_traitement" : "resolu";
    const historicalIssueHistory = [
      {
        statut: "ouvert",
        acteurId: "cmp_livreur1",
        quand: iso(incidentDate),
        commentaire: "Signalement ouvert après la livraison.",
      },
      {
        statut: "en_traitement",
        acteurId: "cmp_gest1",
        quand: iso(new Date(incidentDate.getTime() + 35 * 60 * 1000)),
        commentaire: "Dossier pris en charge par le manager.",
      },
    ];
    if (historicalIssueStatus === "resolu") {
      historicalIssueHistory.push({
        statut: "resolu",
        acteurId: "cmp_gest1",
        quand: iso(new Date(incidentDate.getTime() + 26 * 60 * 60 * 1000)),
        commentaire: "Situation vérifiée et dossier clôturé.",
      });
    }
    signalements.push({
      _id: `hist_sig_${monthOffset}`,
      ref: `SIG-HIST-${monthOffset}`,
      type: monthOffset % 2 === 0 ? "probleme_remise" : "autre",
      livraisonId: `hist_del_${monthOffset}_0`,
      auteurId: "cmp_livreur1",
      gestionnaireAssigneId: "gest1",
      description: monthOffset % 2 === 0
        ? "Le destinataire a demandé une vérification de la remise."
        : "Une précision était nécessaire après la livraison.",
      statut: historicalIssueStatus,
      dateCreation: iso(incidentDate),
      historique: historicalIssueHistory,
    });
  }

  livraisons.forEach((delivery) => {
    delivery.economie = {
      ...economieLivraison(delivery.modePriseEnCharge),
      calculeeLe: delivery.dateSoumission,
    };
  });

  factures.forEach((invoice) => {
    const start = new Date(invoice.periodeDebut);
    const end = new Date(invoice.periodeFin);
    const deliveryLines = livraisons
      .filter((delivery) => {
        const submittedAt = new Date(delivery.dateSoumission);
        return (
          delivery.vendeurId === invoice.vendeurId &&
          delivery.statut === "LIVREE" &&
          submittedAt >= start &&
          submittedAt <= end
        );
      })
      .map((delivery) => ({
        type: "livraison",
        livraisonId: delivery._id,
        referenceLivraison: delivery.numeroSuivi,
        libelle:
          delivery.modePriseEnCharge === "propre"
            ? "Livraison propre - aucun frais de trajet"
            : `Livraison ${delivery.modePriseEnCharge === "equipe" ? "équipe" : "pool plateforme"}`,
        quantite: 1,
        prixUnitaire: delivery.economie.coutVendeur,
        montant: delivery.economie.coutVendeur,
      }));
    invoice.montantAbonnement = TARIF_ABONNEMENT_MENSUEL;
    invoice.montantLivraisons = deliveryLines.reduce((sum, line) => sum + line.montant, 0);
    invoice.nombreLivraisonsFacturees = deliveryLines.filter((line) => line.montant > 0).length;
    invoice.nombreLivraisonsPropres = deliveryLines.filter((line) => line.montant === 0).length;
    invoice.lignes = [
      {
        type: "abonnement",
        libelle: "Abonnement RelayFlow",
        quantite: 1,
        prixUnitaire: TARIF_ABONNEMENT_MENSUEL,
        montant: TARIF_ABONNEMENT_MENSUEL,
      },
      ...deliveryLines,
    ];
    invoice.montant = invoice.montantAbonnement + invoice.montantLivraisons;
  });

  bonsPaiement.forEach((voucher) => {
    const start = new Date(voucher.periodeDebut);
    const end = new Date(voucher.periodeFin);
    voucher.lignes = livraisons
      .filter((delivery) => {
        const submittedAt = new Date(delivery.dateSoumission);
        return (
          delivery.livreurId === voucher.livreurId &&
          delivery.statut === "LIVREE" &&
          submittedAt >= start &&
          submittedAt <= end
        );
      })
      .map((delivery) => ({
        type: "livraison",
        livraisonId: delivery._id,
        referenceLivraison: delivery.numeroSuivi,
        libelle: "Livraison terminée",
        quantite: 1,
        prixUnitaire: delivery.economie.remunerationLivreur,
        montant: delivery.economie.remunerationLivreur,
      }));
    voucher.nombreLivraisonsTraitees = voucher.lignes.length;
    voucher.montantTotal = voucher.lignes.reduce((sum, line) => sum + line.montant, 0);
  });

  return {
    comptes,
    vendeurs,
    livreurs,
    gestionnaires,
    partenariats,
    livraisons,
    signalements,
    messagesIncidents,
    notifications,
    abonnements,
    factures,
    bonsPaiement,
    evaluations,
    applications,
    offresLivraison: [
      {
        _id: "off_demo_manual",
        livraisonId: "del6",
        livreurId: "liv2",
        statut: "en_attente",
        dateCreation: iso(new Date("2026-07-29T12:00:00")),
      },
    ],
    pushSubscriptions: [],
    meta: { deliverySeq: 56, signalementSeq: 2, seedVersion: 8 },
  };
}
