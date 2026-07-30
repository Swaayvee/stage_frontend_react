import { beforeEach, describe, expect, it } from "vitest";
import {
  acceptOffer,
  assignCourier,
  confirmLivraison,
  confirmRetrait,
  createLivraison,
  decideDeliveryCandidate,
  decideApplication,
  establishSession,
  getState,
  resetDemoData,
  submitApplication,
} from "../lib/store";

describe("parcours livreur jusqu'à la remise", () => {
  beforeEach(() => resetDemoData());

  it("inscrit un livreur, accepte une course, retire puis remet le colis", () => {
    const registration = submitApplication({
      role: "livreur",
      email: "coursier.test@example.fr",
      password: "mot-de-passe-solide",
      nom: "Coursier Test",
      telephone: "06 12 34 56 78",
      adresse: "5 rue des Tests",
      ville: "Lyon",
      departement: "Rhône",
      typeVehicule: "Vélo",
    });
    expect(registration.ok).toBe(true);
    expect(establishSession(registration.application.compteId, "courier").ok).toBe(false);
    expect(decideApplication(
      "cmp_gest1",
      registration.application._id,
      "acceptee",
      "Identité et justificatifs vérifiés"
    ).ok).toBe(true);
    expect(establishSession(registration.application.compteId, "courier").ok).toBe(true);

    const creation = createLivraison("cmp_vendeur1", {
      modePriseEnCharge: "pool_plateforme",
      clientNom: "Martin",
      clientPrenom: "Alice",
      clientTelephone: "06 98 76 54 32",
      adresseLivraison: "20 rue de Lyon",
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Colis de test",
      dateReceptionPrevue: new Date(Date.now() + 86_400_000).toISOString(),
    });

    expect(creation.ok).toBe(true);
    expect(acceptOffer(registration.application.compteId, creation.livraison._id).ok).toBe(true);
    expect(confirmRetrait(registration.application.compteId, creation.livraison._id).ok).toBe(true);
    expect(confirmLivraison(registration.application.compteId, creation.livraison._id, {
      code: creation.livraison.codeLivraison,
    }).ok).toBe(true);

    const delivered = getState().livraisons.find((delivery) => delivery._id === creation.livraison._id);
    expect(delivered.statut).toBe("LIVREE");
    expect(delivered.historique.map((event) => event.nouveauStatut)).toEqual([
      "ACCEPTEE",
      "RETIREE",
      "LIVREE",
    ]);
  });

  it("interdit à un autre livreur de confirmer la remise", () => {
    const creation = createLivraison("cmp_vendeur1", {
      modePriseEnCharge: "pool_plateforme",
      clientNom: "Durand",
      clientPrenom: "Paul",
      adresseLivraison: "Lyon",
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Test autorisation",
      dateReceptionPrevue: new Date(Date.now() + 86_400_000).toISOString(),
    });
    acceptOffer("cmp_livreur1", creation.livraison._id);
    confirmRetrait("cmp_livreur1", creation.livraison._id);
    expect(confirmLivraison("cmp_livreur2", creation.livraison._id, {
      code: creation.livraison.codeLivraison,
    }).ok).toBe(false);
  });

  it("autorise uniquement le commerçant propriétaire à assigner un livreur", () => {
    const creation = createLivraison("cmp_vendeur1", {
      modePriseEnCharge: "equipe",
      clientNom: "Bernard",
      clientPrenom: "Lina",
      adresseLivraison: "Lyon",
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Assignation contrôlée",
      dateReceptionPrevue: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(assignCourier("cmp_livreur1", creation.livraison._id, "liv1").ok).toBe(false);
    expect(acceptOffer("cmp_livreur1", creation.livraison._id)).toMatchObject({
      ok: false,
      error: expect.stringContaining("commerçant"),
    });
    expect(assignCourier("cmp_vendeur1", creation.livraison._id, "liv2")).toMatchObject({
      ok: false,
      error: expect.stringContaining("équipe active"),
    });
    expect(assignCourier("cmp_vendeur1", creation.livraison._id, "liv1").ok).toBe(true);
  });

  it("laisse le commerçant choisir uniquement parmi les candidatures du pool manuel", () => {
    const creation = createLivraison("cmp_vendeur1", {
      modePriseEnCharge: "pool_plateforme",
      poolAttribution: "validation_vendeur",
      clientNom: "Mercier",
      clientPrenom: "Nina",
      adresseLivraison: "Lyon",
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Pool manuel",
      dateReceptionPrevue: new Date(Date.now() + 86_400_000).toISOString(),
    });

    expect(assignCourier("cmp_vendeur1", creation.livraison._id, "liv1").ok).toBe(false);
    const candidature = acceptOffer("cmp_livreur1", creation.livraison._id);
    expect(candidature.ok).toBe(true);
    expect(candidature.candidature).toBe(true);
    expect(getState().livraisons.find((item) => item._id === creation.livraison._id).statut).toBe("SOUMISE");

    expect(
      decideDeliveryCandidate("cmp_vendeur1", candidature.offer._id, "acceptee").ok
    ).toBe(true);
    const assigned = getState().livraisons.find((item) => item._id === creation.livraison._id);
    expect(assigned.statut).toBe("ACCEPTEE");
    expect(assigned.livreurId).toBe("liv1");
  });

  it("ne crée un accès public que lorsque le commerçant l'active", () => {
    const privateDelivery = createLivraison("cmp_vendeur1", {
      modePriseEnCharge: "pool_plateforme",
      clientNom: "Privé",
      clientPrenom: "Colis",
      adresseLivraison: "Lyon",
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Sans lien",
      suiviPublic: false,
    }).livraison;
    const publicDelivery = createLivraison("cmp_vendeur1", {
      modePriseEnCharge: "pool_plateforme",
      clientNom: "Public",
      clientPrenom: "Colis",
      adresseLivraison: "Lyon",
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Avec lien",
      suiviPublic: true,
    }).livraison;

    expect(privateDelivery.publicTrackingToken).toBeNull();
    expect(publicDelivery.publicTrackingToken).toMatch(/^track_/);
  });
});
