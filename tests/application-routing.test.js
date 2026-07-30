import { beforeEach, describe, expect, it } from "vitest";
import {
  decideApplication,
  establishSession,
  getState,
  inviterGestionnaire,
  resetDemoData,
  submitApplication,
} from "../lib/store";
import { buildViewModel } from "../lib/viewModel";

describe("demandes d'inscription", () => {
  beforeEach(() => resetDemoData());

  it("refuse les champs métier invalides", () => {
    const result = submitApplication({
      role: "livreur",
      email: "email-invalide",
      telephone: "06 12",
      ville: "",
      departement: "",
    });
    expect(result.ok).toBe(false);
  });

  it("rend la demande visible par tous les managers sans manager de ville", () => {
    const state = getState();
    state.comptes.push({
      _id: "cmp_manager2",
      email: "manager2@relayflow.fr",
      motDePasseHash: "test-password",
      role: "manager",
      statutCompte: "actif",
      dateCreation: new Date().toISOString(),
    });
    state.gestionnaires.push({
      _id: "gest2",
      compteId: "cmp_manager2",
      juridiction: { niveau: "departement", valeur: "Paris" },
      invitePar: "cmp_super1",
    });

    const result = submitApplication({
      role: "livreur",
      email: "nouveau.livreur@example.fr",
      telephone: "06 12 34 56 78",
      nom: "Nouveau Livreur",
      adresse: "10 rue de Rivoli",
      ville: "Paris",
      departement: "Paris",
      typeVehicule: "bike",
      password: "mot-de-passe-solide",
    });

    expect(result.ok).toBe(true);
    expect(result.application.fallbackTousManagers).toBe(true);
    expect(result.application.managerIds).toEqual(expect.arrayContaining(["gest1", "gest2"]));
  });

  it("permet à un manager destinataire d'accepter la demande", () => {
    const created = submitApplication({
      role: "vendeur",
      email: "boutique@example.fr",
      telephone: "04 12 34 56 78",
      raisonSociale: "Boutique Test",
      adresse: "12 rue Test",
      ville: "Lyon",
      departement: "Rhône",
      password: "mot-de-passe-solide",
    });
    expect(establishSession(created.application.compteId, "merchant").ok).toBe(false);
    const decision = decideApplication(
      "cmp_gest1",
      created.application._id,
      "acceptee",
      "Dossier conforme"
    );
    expect(decision.ok).toBe(true);
    expect(decision.application.statut).toBe("acceptee");
    expect(decision.application.historique.at(-1).commentaire).toBe("Dossier conforme");
    const managerView = buildViewModel(getState(), {
      compteId: "cmp_gest1",
      role: "manager",
      routeRole: "manager",
    });
    expect(
      managerView.applicationsData.some(
        (application) => application.applicationId === created.application._id
      )
    ).toBe(false);
    expect(establishSession(created.application.compteId, "merchant").ok).toBe(true);
    expect(getState().comptes.find((item) => item._id === created.application.compteId).motDePasseHash).toBeNull();
    expect(getState().abonnements.some((item) => item.vendeurId === created.application.profilId)).toBe(true);
  });

  it("permet au manager de créer un utilisateur complet dans son périmètre", () => {
    const created = submitApplication({
      createdByManagerCompteId: "cmp_gest1",
      role: "livreur",
      email: "livreur.manager@example.fr",
      telephone: "06 22 33 44 55",
      password: "temporaire-solide",
      nom: "Livreur Manager",
      adresse: "10 rue de la République",
      ville: "Lyon",
      departement: "Rhône",
      typeVehicule: "bike",
      profil: {
        statutJuridique: "auto_entrepreneur",
        zoneLivraison: "Lyon",
      },
    });

    expect(created.ok).toBe(true);
    expect(created.application.managerIds).toEqual(["gest1"]);
    expect(created.application.fallbackTousManagers).toBe(false);
    expect(created.application.profil.statutJuridique).toBe("auto_entrepreneur");
  });

  it("empêche un manager de créer un utilisateur hors de son périmètre", () => {
    const created = submitApplication({
      createdByManagerCompteId: "cmp_gest1",
      role: "vendeur",
      email: "vendeur.paris@example.fr",
      telephone: "01 22 33 44 55",
      password: "temporaire-solide",
      nom: "Vendeur Paris",
      raisonSociale: "Boutique Paris",
      adresse: "10 rue de Rivoli",
      ville: "Paris",
      departement: "Paris",
    });

    expect(created.ok).toBe(false);
    expect(created.error).toMatch(/périmètre/i);
  });

  it("crée réellement un manager depuis l'espace Super Manager", () => {
    const result = inviterGestionnaire("cmp_super1", {
      email: "manager.test@relayflow.fr",
      password: "temporaire-solide",
      juridiction: { niveau: "departement", valeur: "Isère" },
    });
    expect(result.ok).toBe(true);
    expect(getState().comptes.some((item) => item.email === "manager.test@relayflow.fr")).toBe(true);
  });
});
