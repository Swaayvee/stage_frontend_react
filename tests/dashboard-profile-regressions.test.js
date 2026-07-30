import { beforeEach, describe, expect, it } from "vitest";
import { buildViewModel } from "../lib/viewModel";
import {
  getState,
  resetDemoData,
  updateLivreurPreferences,
} from "../lib/store";

describe("tableaux de bord et préférences persistantes", () => {
  beforeEach(() => resetDemoData());

  it("calcule la ponctualité depuis l'heure de remise et l'échéance prévue", () => {
    const viewModel = buildViewModel(getState(), {
      compteId: "cmp_vendeur1",
      role: "vendeur",
      routeRole: "merchant",
    });

    expect(viewModel.dashboard.onTime).toBeGreaterThanOrEqual(90);
    expect(viewModel.dashboard.onTime).toBeLessThanOrEqual(100);
  });

  it("enregistre le rayon de recherche dans le profil livreur", () => {
    const result = updateLivreurPreferences("cmp_livreur1", {
      rayonRechercheKm: 20,
    });

    expect(result.ok).toBe(true);
    expect(
      getState().livreurs.find((courier) => courier.compteId === "cmp_livreur1")
        .rayonRechercheKm
    ).toBe(20);
  });

  it("conserve des références de livraison uniques", () => {
    const references = getState().livraisons.map((delivery) => delivery.numeroSuivi);
    expect(new Set(references).size).toBe(references.length);
  });

  it("fournit des identifiants activables pour les adhésions d'exemple", () => {
    const state = getState();
    state.applications.forEach((application) => {
      const account = state.comptes.find((item) => item._id === application.compteId);
      expect(account?.motDePasseHash?.length).toBeGreaterThanOrEqual(10);
    });
  });
});
