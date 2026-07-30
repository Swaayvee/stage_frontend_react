import { describe, expect, it } from "vitest";
import {
  departmentCodeFromPostalCode,
  formatFrenchPhone,
  normalizeLocationText,
  parseAddressSuggestion,
  uniqueBy,
} from "../lib/location";

describe("normalisation des localisations", () => {
  it("normalise les espaces sans modifier les accents", () => {
    expect(normalizeLocationText("  L’Haÿ-les-Roses  ,  Val-de-Marne ")).toBe(
      "L’Haÿ-les-Roses, Val-de-Marne"
    );
  });

  it("déduit les codes de département usuels et ultramarins", () => {
    expect(departmentCodeFromPostalCode("69002")).toBe("69");
    expect(departmentCodeFromPostalCode("97400")).toBe("974");
    expect(departmentCodeFromPostalCode("20000")).toBe("");
  });

  it("affiche les numéros français par groupes de deux", () => {
    expect(formatFrenchPhone("0612345678")).toBe("06 12 34 56 78");
  });

  it("convertit une réponse Géoplateforme en localisation commune", () => {
    expect(parseAddressSuggestion({
      fulltext: "14 Rue Sala, 69002 Lyon",
      city: "Lyon",
      zipcode: "69002",
      x: 4.827,
      y: 45.754,
    })).toMatchObject({
      address: "14 Rue Sala, 69002 Lyon",
      city: "Lyon",
      postalCode: "69002",
      departmentCode: "69",
    });
  });

  it("supprime les suggestions en double", () => {
    expect(uniqueBy(
      [{ code: "69123" }, { code: "69123" }, { code: "38185" }],
      (item) => item.code
    )).toHaveLength(2);
  });
});
