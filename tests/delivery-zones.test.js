import { describe, expect, it } from "vitest";
import { courierCoversDelivery, distanceKm } from "../lib/domain";

describe("zones multiples et proximité des livraisons", () => {
  const courier = {
    zonesCouvertes: [
      {
        ville: "Paris 1er Arrondissement",
        departement: "Paris",
        codeCommune: "75101",
        codeDepartement: "75",
      },
      {
        ville: "Boulogne-Billancourt",
        departement: "Hauts-de-Seine",
        codeCommune: "92012",
        codeDepartement: "92",
      },
    ],
  };

  it("accepte chacune des villes ajoutées par le livreur", () => {
    expect(courierCoversDelivery(courier, {
      villeLivraison: "Boulogne-Billancourt",
      codeCommuneLivraison: "92012",
      codeDepartementLivraison: "92",
    })).toBe(true);
  });

  it("distingue deux arrondissements d'un même département", () => {
    expect(courierCoversDelivery(courier, {
      villeLivraison: "Paris 8e Arrondissement",
      codeCommuneLivraison: "75108",
      codeDepartementLivraison: "75",
    })).toBe(false);
  });

  it("classe les suggestions hors zone avec une distance réelle", () => {
    const paris = { lat: 48.8566, lng: 2.3522 };
    const versailles = { lat: 48.8014, lng: 2.1301 };
    const lyon = { lat: 45.764, lng: 4.8357 };
    expect(distanceKm(paris, versailles)).toBeLessThan(distanceKm(paris, lyon));
  });
});
