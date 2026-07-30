import {
  courierCoversDelivery,
  distanceKm,
  inJurisdiction,
  STATUT_LIVRAISON_LABEL,
  TARIF_ABONNEMENT_MENSUEL,
  TARIF_LIVRAISON_UNITAIRE,
  TARIF_LIVRAISON_VENDEUR,
  economieLivraison,
} from "./domain";
import { displayNameForCompte, profileForCompte } from "./store";

/** Adaptateurs store → format tableaux legacy (WorkspacePage) */

function labelStatut(statut) {
  return STATUT_LIVRAISON_LABEL[statut] || statut;
}

function vendeurName(state, vendeurId) {
  return state.vendeurs.find((v) => v._id === vendeurId)?.raisonSociale || "—";
}

function livreurName(state, livreurId) {
  return state.livreurs.find((l) => l._id === livreurId)?.nom || null;
}

function livraisonsForSession(state, session) {
  if (!session) return state.livraisons;
  if (session.role === "vendeur") {
    const v = state.vendeurs.find((x) => x.compteId === session.compteId);
    return state.livraisons.filter((d) => d.vendeurId === v?._id);
  }
  if (session.role === "manager") {
    const g = state.gestionnaires.find((x) => x.compteId === session.compteId);
    return state.livraisons.filter((d) => {
      const v = state.vendeurs.find((x) => x._id === d.vendeurId);
      const l = state.livreurs.find((x) => x._id === d.livreurId);
      const deliveryLocation = {
        ville: d.villeLivraison,
        departement: d.departementLivraison,
        codeDepartement: d.codeDepartementLivraison,
      };
      return (
        inJurisdiction(v, g?.juridiction) ||
        inJurisdiction(l, g?.juridiction) ||
        inJurisdiction(deliveryLocation, g?.juridiction)
      );
    });
  }
  if (session.role === "livreur") {
    const l = state.livreurs.find((x) => x.compteId === session.compteId);
    return state.livraisons.filter((d) => d.livreurId === l?._id);
  }
  return state.livraisons;
}

function signalementsForSession(state, session) {
  if (!session) return state.signalements;
  if (session.role === "super_manager") return state.signalements;
  if (session.role === "manager") {
    const g = state.gestionnaires.find((x) => x.compteId === session.compteId);
    return state.signalements.filter((s) => {
      const auteur = profileForCompte(s.auteurId);
      return inJurisdiction(auteur, g?.juridiction);
    });
  }
  return state.signalements.filter((s) => s.auteurId === session.compteId);
}

export function buildViewModel(state, session) {
  if (!state) return emptyVm();

  const juridiction =
    session?.compteId &&
    profileForCompte(session.compteId)?.type === "manager"
      ? profileForCompte(session.compteId).juridiction
      : null;

  const filterGeo = (profile) => {
    if (!juridiction || session?.role === "super_manager") return true;
    return inJurisdiction(profile, juridiction);
  };

  const scopedLivraisons = livraisonsForSession(state, session);
  const scopedSignalements = signalementsForSession(state, session);
  const allIssueMessages = state.messagesIncidents || [];
  const visibleIssueIds = new Set(
    session?.role === "manager" || session?.role === "super_manager"
      ? scopedSignalements.map((issue) => issue._id)
      : allIssueMessages
          .filter(
            (message) =>
              message.expediteurCompteId === session?.compteId ||
              message.destinataireCompteIds?.includes(session?.compteId)
          )
          .map((message) => message.signalementId)
  );
  if (session && !["manager", "super_manager"].includes(session.role)) {
    state.signalements
      .filter((issue) => issue.auteurId === session.compteId)
      .forEach((issue) => visibleIssueIds.add(issue._id));
  }
  const issueThreads = state.signalements
    .filter((issue) => visibleIssueIds.has(issue._id))
    .map((issue) => {
      const messages = allIssueMessages
        .filter((message) => message.signalementId === issue._id)
        .sort((a, b) => new Date(a.dateCreation) - new Date(b.dateCreation))
        .map((message) => ({
          ...message,
          expediteurNom: displayNameForCompte(message.expediteurCompteId),
        }));
      return {
        issue,
        messages,
        unreadCount: messages.filter(
          (message) =>
            message.destinataireCompteIds?.includes(session?.compteId) &&
            !message.luParCompteIds?.includes(session?.compteId)
        ).length,
      };
    })
    .sort((a, b) => {
      const aDate = a.messages.at(-1)?.dateCreation || a.issue.dateCreation;
      const bDate = b.messages.at(-1)?.dateCreation || b.issue.dateCreation;
      return new Date(bDate) - new Date(aDate);
    });

  const allDeliveriesData = [...scopedLivraisons]
    .sort((a, b) => new Date(b.dateSoumission || 0) - new Date(a.dateSoumission || 0))
    .map((d) => [
    d.numeroSuivi,
    vendeurName(state, d.vendeurId),
    d.client?.adresse || d.villeLivraison || "—",
    labelStatut(d.statut),
    null,
    livreurName(state, d.livreurId),
    d.client?.adresse,
    d.dateSoumission,
    d._id,
    d.statut,
    d.vendeurId,
    d.livreurId,
    d.villeLivraison || d.departementLivraison || "—",
  ]);

  const sessionLivreur = session?.role === "livreur"
    ? state.livreurs.find((l) => l.compteId === session.compteId)
    : null;

  const sessionVendeur = session?.role === "vendeur"
    ? state.vendeurs.find((v) => v.compteId === session.compteId)
    : null;

  const offerCandidates = state.livraisons
    .filter((d) => d.statut === "SOUMISE")
    .filter((d) => d.modePriseEnCharge === "pool_plateforme")
    .filter((d) => {
      if (!sessionLivreur) return false;
      if (sessionLivreur.statutOperationnel !== "disponible") return false;
      if (state.offresLivraison?.some(
        (offer) =>
          offer.livraisonId === d._id &&
          offer.livreurId === sessionLivreur._id &&
          offer.statut === "en_attente"
      )) return false;
      return courierEligible(state, sessionLivreur, d);
    });

  const inCoverageOffers = offerCandidates.filter((delivery) =>
    courierCoversDelivery(sessionLivreur, delivery)
  );
  const displayedOffers = inCoverageOffers.length
    ? inCoverageOffers
    : offerCandidates.filter((delivery) => delivery.modePriseEnCharge === "pool_plateforme");
  const courierOrigin =
    sessionLivreur?.coordonnees ||
    sessionLivreur?.zonesCouvertes?.find((zone) => zone.coordonnees)?.coordonnees;

  const availableDeliveries = displayedOffers
    .map((d) => [
      d.numeroSuivi,
      d.villeLivraison || "zone",
      vendeurName(state, d.vendeurId),
      d.modePriseEnCharge === "equipe" ? "Équipe" : "Pool plateforme",
      d._id,
      distanceKm(courierOrigin, d.coordonneesLivraison) ??
        (d.codeDepartementLivraison === sessionLivreur?.codeDepartement ? 25 : 100),
      !courierCoversDelivery(sessionLivreur, d),
      d.poolAttribution || "automatique",
      d.dateSoumission,
      (d.economie || economieLivraison(d.modePriseEnCharge)).remunerationLivreur,
    ])
    .sort((a, b) => a[5] - b[5] || new Date(b[8] || 0) - new Date(a[8] || 0));

  const myDeliveries = state.livraisons
    .filter((d) => d.livreurId === sessionLivreur?._id)
    .sort((a, b) => new Date(b.dateSoumission || 0) - new Date(a.dateSoumission || 0))
    .map((d) => [
      d.numeroSuivi,
      labelStatut(d.statut),
      `${vendeurName(state, d.vendeurId)}`,
      vendeurName(state, d.vendeurId),
      d.client?.adresse || "—",
      `${d.client?.prenom || ""} ${d.client?.nom || ""}`.trim(),
      d._id,
      d.statut,
      d.dateSoumission,
    ]);

  const issuesData = scopedSignalements.map((s) => {
    const liv = s.livraisonId
      ? state.livraisons.find((d) => d._id === s.livraisonId)
      : null;
    const statutLabel =
      s.statut === "ouvert"
        ? "Ouvert"
        : s.statut === "en_traitement"
          ? "En traitement"
          : s.statut === "escalade"
            ? "Escaladé"
            : s.statut === "resolu"
              ? "Résolu"
              : "Rejeté";
    return [
      s.ref || s._id,
      s.type.replace(/_/g, " "),
      s.description?.slice(0, 60) || "—",
      statutLabel,
      liv ? vendeurName(state, liv.vendeurId) : displayNameForCompte(s.auteurId),
      liv?.client?.adresse || "—",
      s._id,
      s.statut,
      s.dateCreation,
    ];
  });

  const sessionManager = session?.role === "manager"
    ? state.gestionnaires.find((manager) => manager.compteId === session.compteId)
    : null;

  const applicationsData = (state.applications || [])
    .filter((application) => application.statut === "en_attente")
    .filter((application) =>
      session?.role === "super_manager" ||
      !sessionManager ||
      application.managerIds.includes(sessionManager._id)
    )
    .map((application) => ({
      id: application._id,
      reference: application.reference,
      type: application.role === "vendeur" ? "merchant" : "courier",
      name: application.raisonSociale || application.nom || application.email,
      applicant: application.nom || application.raisonSociale,
      subtitle: application.role === "vendeur" ? "Vendeur" : application.typeVehicule,
      zone: `${application.ville}, ${application.departement}`,
      date: application.dateCreation?.slice(0, 10),
      status:
        application.statut === "en_attente"
          ? "En attente"
          : application.statut === "acceptee"
            ? "Demande acceptée"
            : "Demande rejetée",
      email: application.email,
      phone: application.telephone,
      applicationId: application._id,
      fallbackTousManagers: application.fallbackTousManagers,
      documents: application.documents || [],
    }));

  const couriersForAssign = state.livreurs
    .filter((l) => l.statutOperationnel === "disponible")
    .map((l) => [l._id, l.nom, l.typeVehicule, l.ville, 2.5, "—"]);

  const directoryData = {
    managers: state.gestionnaires.map((g) => {
      const c = state.comptes.find((x) => x._id === g.compteId);
      const j = g.juridiction;
      const zone =
        j.niveau === "pays" ? "France" : j.niveau === "departement" ? j.valeur : j.valeur;
      return [
        g._id,
        g.nom || c?.email.split("@")[0] || "Manager",
        c?.email,
        zone,
        g.telephone || "—",
        "Manager",
        c?.dateCreation?.slice(0, 10) || "—",
        c?._id,
      ];
    }),
    merchants: state.vendeurs
      .filter((v) => filterGeo(v))
      .map((v) => {
        const c = state.comptes.find((x) => x._id === v.compteId);
        return [
          v._id,
          v.raisonSociale,
          c?.email,
          v.ville,
          v.telephone,
          "—",
          `${v.adresse}, ${v.ville}`,
          c?._id,
        ];
      }),
    couriers: state.livreurs
      .filter((l) => filterGeo(l))
      .map((l) => {
        const c = state.comptes.find((x) => x._id === l.compteId);
        const delivered = state.livraisons.filter(
          (d) => d.livreurId === l._id && d.statut === "LIVREE"
        ).length;
        return [
          l._id,
          l.nom,
          c?.email,
          l.ville,
          l.telephone || "—",
          l.typeVehicule,
          `${delivered} livraisons · ${c?.statutCompte}`,
          c?._id,
        ];
      }),
  };

  const partenariats = sessionVendeur
    ? state.partenariats
        .filter((p) => p.vendeurId === sessionVendeur._id)
        .map((p) => {
          const l = state.livreurs.find((x) => x._id === p.livreurId);
          const delivered = state.livraisons.filter(
            (d) => d.livreurId === l?._id && d.vendeurId === sessionVendeur._id && d.statut === "LIVREE"
          ).length;
          const statutLabel =
            p.statut === "actif"
              ? "Partenaire actif"
              : p.statut === "en_attente"
                ? "En attente de confirmation"
                : p.statut;
          return [l?._id, l?.nom, l?.typeVehicule, l?.ville, "—", statutLabel, p._id, p.statut, delivered];
        })
    : [];

  const notificationsForUser = session
    ? state.notifications.filter((n) => n.compteId === session.compteId)
    : [];

  const finance = buildFinance(state, session);
  const dashboard = buildDashboard(state, session, scopedLivraisons, scopedSignalements);

  return {
    allDeliveriesData,
    availableDeliveries,
    myDeliveries,
    issuesData,
    issueThreads,
    applicationsData,
    couriersForAssign,
    directoryData,
    partenariats,
    notificationsForUser,
    finance,
    dashboard,
    livraisons: scopedLivraisons,
    signalements: scopedSignalements,
    profile: session ? profileForCompte(session.compteId) : null,
  };
}

function courierEligible(state, livreur, livraison) {
  if (livraison.modePriseEnCharge === "equipe") {
    const vendeur = state.vendeurs.find((v) => v._id === livraison.vendeurId);
    return state.partenariats.some(
      (p) =>
        p.vendeurId === vendeur?._id &&
        p.livreurId === livreur._id &&
        p.statut === "actif"
    );
  }
  if (livraison.modePriseEnCharge === "pool_plateforme") {
    return true;
  }
  return false;
}

function buildFinance(state, session) {
  const vendeur =
    session?.role === "vendeur"
      ? state.vendeurs.find((v) => v.compteId === session.compteId)
      : null;
  const livreur =
    session?.role === "livreur"
      ? state.livreurs.find((l) => l.compteId === session.compteId)
      : null;

  const juridiction =
    session?.role === "manager"
      ? state.gestionnaires.find((g) => g.compteId === session.compteId)?.juridiction
      : null;

  const filterVendeur = (vId) => {
    if (!juridiction || session?.role === "super_manager") return true;
    const v = state.vendeurs.find((x) => x._id === vId);
    return inJurisdiction(v, juridiction);
  };

  const filterLivreur = (lId) => {
    if (!juridiction || session?.role === "super_manager") return true;
    const l = state.livreurs.find((x) => x._id === lId);
    return inJurisdiction(l, juridiction);
  };

  const sellerDeliveries = vendeur
    ? state.livraisons.filter((delivery) => delivery.vendeurId === vendeur._id)
    : [];
  const courierDeliveries = livreur
    ? state.livraisons.filter((delivery) => delivery.livreurId === livreur._id)
    : [];
  const sellerDelivered = sellerDeliveries.filter((delivery) => delivery.statut === "LIVREE");
  const courierDelivered = courierDeliveries.filter((delivery) => delivery.statut === "LIVREE");
  const courierActive = courierDeliveries.filter((delivery) =>
    ["ACCEPTEE", "RETIREE"].includes(delivery.statut)
  );
  const courierVoucherDeliveryIds = new Set(
    (livreur
      ? state.bonsPaiement.filter((voucher) => voucher.livreurId === livreur._id)
      : []
    ).flatMap((voucher) =>
      (voucher.lignes || []).map((line) => line.livraisonId).filter(Boolean)
    )
  );
  const courierAwaitingVoucher = courierDelivered.filter(
    (delivery) => !courierVoucherDeliveryIds.has(delivery._id)
  );

  return {
    factures: vendeur
      ? state.factures.filter((f) => f.vendeurId === vendeur._id)
      : state.factures.filter((f) => filterVendeur(f.vendeurId)),
    bons: livreur
      ? state.bonsPaiement.filter((b) => b.livreurId === livreur._id)
      : state.bonsPaiement.filter((b) => filterLivreur(b.livreurId)),
    abonnement: vendeur
      ? state.abonnements.find((a) => a.vendeurId === vendeur._id)
      : null,
    impayes: state.factures.filter((f) => f.statut === "emise" && filterVendeur(f.vendeurId)),
    soldesLivreurs: state.bonsPaiement.filter((b) => b.statut === "emis" && filterLivreur(b.livreurId)),
    tarifAbonnement: TARIF_ABONNEMENT_MENSUEL,
    tarifLivraison: TARIF_LIVRAISON_UNITAIRE,
    tarifLivraisonVendeur: TARIF_LIVRAISON_VENDEUR,
    economie: {
      coutsLivraisonsVendeur: sellerDelivered.reduce(
        (sum, delivery) =>
          sum + (delivery.economie || economieLivraison(delivery.modePriseEnCharge)).coutVendeur,
        0
      ),
      livraisonsFacturables: sellerDelivered.filter(
        (delivery) =>
          (delivery.economie || economieLivraison(delivery.modePriseEnCharge)).coutVendeur > 0
      ).length,
      livraisonsPropres: sellerDelivered.filter(
        (delivery) => delivery.modePriseEnCharge === "propre"
      ).length,
      economieLivraisonsPropres:
        sellerDelivered.filter((delivery) => delivery.modePriseEnCharge === "propre").length *
        TARIF_LIVRAISON_VENDEUR,
      gainsLivreurAcquis: courierDelivered.reduce(
        (sum, delivery) =>
          sum +
          (delivery.economie || economieLivraison(delivery.modePriseEnCharge)).remunerationLivreur,
        0
      ),
      gainsLivreurPrevus: courierActive.reduce(
        (sum, delivery) =>
          sum +
          (delivery.economie || economieLivraison(delivery.modePriseEnCharge)).remunerationLivreur,
        0
      ),
      gainsLivreurEnAttenteBon: courierAwaitingVoucher.reduce(
        (sum, delivery) =>
          sum +
          (delivery.economie || economieLivraison(delivery.modePriseEnCharge)).remunerationLivreur,
        0
      ),
      livraisonsLivreurPayables: courierDelivered.length,
      livraisonsLivreurEnCours: courierActive.length,
      livraisonsLivreurEnAttenteBon: courierAwaitingVoucher.length,
    },
  };
}

function buildDashboard(state, session, livraisons, signalements) {
  const currentMonthKey = (() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  })();
  const isCurrentMonth = (value) => {
    if (!value) return false;
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` === currentMonthKey;
  };
  const enCours = livraisons.filter((d) => ["ACCEPTEE", "RETIREE"].includes(d.statut)).length;
  const soumises = livraisons.filter((d) => d.statut === "SOUMISE").length;
  const livrees = livraisons.filter((d) => d.statut === "LIVREE").length;
  const deliveredWithDeadline = livraisons.filter(
    (delivery) => delivery.statut === "LIVREE" && delivery.dateReceptionPrevue
  );
  const deliveredOnTime = deliveredWithDeadline.filter((delivery) => {
    const deliveredEvent = [...(delivery.historique || [])]
      .reverse()
      .find((event) => event.nouveauStatut === "LIVREE");
    if (!deliveredEvent?.quand) return false;
    const deadline = new Date(delivery.dateReceptionPrevue);
    if (
      deadline.getUTCHours() === 0 &&
      deadline.getUTCMinutes() === 0 &&
      deadline.getUTCSeconds() === 0
    ) {
      deadline.setUTCHours(23, 59, 59, 999);
    }
    return new Date(deliveredEvent.quand) <= deadline;
  }).length;
  const onTime = deliveredWithDeadline.length
    ? Math.round((deliveredOnTime / deliveredWithDeadline.length) * 100)
    : 0;

  const livreur =
    session?.role === "livreur"
      ? state.livreurs.find((l) => l.compteId === session.compteId)
      : null;

  const gainsMois = livreur
    ? state.livraisons.filter(
        (d) =>
          d.livreurId === livreur._id &&
          d.statut === "LIVREE" &&
          isCurrentMonth(d.dateSoumission)
      ).length * TARIF_LIVRAISON_UNITAIRE
    : 0;

  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    date.setMonth(date.getMonth() - (5 - index));
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" })
        .format(date)
        .replace(".", ""),
    };
  });

  const countByMonth = (records, dateField) =>
    monthBuckets.map(({ key }) =>
      records.filter((record) => {
        const value = record[dateField];
        if (!value) return false;
        const date = new Date(value);
        const recordKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        return recordKey === key;
      }).length
    );

  const deliverySeries = countByMonth(livraisons, "dateSoumission");
  const reportSeries = countByMonth(signalements, "dateCreation");
  const deliveredSeries = monthBuckets.map(({ key }) =>
    livraisons.filter((delivery) => {
      if (delivery.statut !== "LIVREE") return false;
      const deliveredEvent = [...(delivery.historique || [])]
        .reverse()
        .find((event) => event.nouveauStatut === "LIVREE");
      const date = new Date(deliveredEvent?.quand || delivery.dateSoumission);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` === key;
    }).length
  );

  return {
    livraisonsMois: livraisons.length,
    enCours,
    soumises,
    livrees,
    onTime,
    issuesOuverts: signalements.filter((s) => ["ouvert", "en_traitement", "escalade"].includes(s.statut)).length,
    commercants: state.vendeurs.length,
    livreurs: state.livreurs.length,
    disponibles: state.livraisons.filter((d) => d.statut === "SOUMISE").length,
    gainsMois,
    statutOperationnel: livreur?.statutOperationnel || "disponible",
    chart: {
      labels: monthBuckets.map((bucket) => bucket.label),
      deliveries: deliverySeries,
      delivered: deliveredSeries,
      reports: reportSeries,
    },
  };
}

function emptyVm() {
  return {
    allDeliveriesData: [],
    availableDeliveries: [],
    myDeliveries: [],
    issuesData: [],
    issueThreads: [],
    applicationsData: [],
    couriersForAssign: [],
    directoryData: { managers: [], merchants: [], couriers: [] },
    partenariats: [],
    notificationsForUser: [],
    finance: {
      factures: [],
      bons: [],
      abonnement: null,
      impayes: [],
      soldesLivreurs: [],
      tarifAbonnement: TARIF_ABONNEMENT_MENSUEL,
      tarifLivraison: TARIF_LIVRAISON_UNITAIRE,
      tarifLivraisonVendeur: TARIF_LIVRAISON_VENDEUR,
      economie: {
        coutsLivraisonsVendeur: 0,
        livraisonsFacturables: 0,
        livraisonsPropres: 0,
        economieLivraisonsPropres: 0,
        gainsLivreurAcquis: 0,
        gainsLivreurPrevus: 0,
        gainsLivreurEnAttenteBon: 0,
        livraisonsLivreurPayables: 0,
        livraisonsLivreurEnCours: 0,
        livraisonsLivreurEnAttenteBon: 0,
      },
    },
    dashboard: {
      livraisonsMois: 0,
      enCours: 0,
      soumises: 0,
      livrees: 0,
      onTime: 0,
      issuesOuverts: 0,
      commercants: 0,
      livreurs: 0,
      disponibles: 0,
      gainsMois: 0,
      statutOperationnel: "disponible",
      chart: {
        labels: [],
        deliveries: [],
        delivered: [],
        reports: [],
      },
    },
    livraisons: [],
    signalements: [],
    profile: null,
  };
}

export { labelStatut };
