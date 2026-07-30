import { beforeEach, describe, expect, it } from "vitest";
import {
  accepterPartenariat,
  getState,
  proposerPartenariat,
  rejeterPartenariat,
  resetDemoData,
} from "../lib/store";

describe("proposition de partenariat", () => {
  beforeEach(() => resetDemoData());

  it("accepte uniquement l'identifiant exact d'un livreur inscrit et actif", () => {
    expect(
      proposerPartenariat("cmp_vendeur2", "Lucas Martin", "Bonjour").ok
    ).toBe(false);

    const result = proposerPartenariat("cmp_vendeur2", "liv2", "Bonjour");
    expect(result.ok).toBe(true);
    expect(
      getState().partenariats.some(
        (partnership) =>
          partnership.vendeurId === "ven2" &&
          partnership.livreurId === "liv2" &&
          partnership.statut === "en_attente"
      )
    ).toBe(true);
  });

  it("refuse une deuxième demande active ou en attente", () => {
    expect(proposerPartenariat("cmp_vendeur1", "liv1", "Nouvelle demande").ok).toBe(false);
  });

  it("permet à un livreur d'avoir plusieurs partenariats actifs", () => {
    expect(accepterPartenariat("cmp_livreur1", "part3").ok).toBe(true);
    const active = getState().partenariats.filter(
      (partnership) =>
        partnership.livreurId === "liv1" && partnership.statut === "actif"
    );
    expect(active.map((partnership) => partnership.vendeurId).sort()).toEqual([
      "ven1",
      "ven2",
    ]);
  });

  it("exige un motif lors du refus d'une proposition", () => {
    expect(rejeterPartenariat("cmp_livreur2", "part2", "").ok).toBe(false);
    expect(
      rejeterPartenariat("cmp_livreur2", "part2", "Zone trop éloignée").ok
    ).toBe(true);
  });
});
