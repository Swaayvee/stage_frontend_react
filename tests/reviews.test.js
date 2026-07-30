import { beforeEach, describe, expect, it } from "vitest";
import { resetDemoData, submitEvaluation, submitSellerEvaluation } from "../lib/store";

describe("évaluations après livraison", () => {
  beforeEach(() => resetDemoData());

  it("exige une note et un avis écrit", () => {
    const result = submitEvaluation({
      livraisonId: "del3",
      auteurType: "vendeur",
      auteurCompteId: "cmp_vendeur1",
      note: 5,
      commentaire: "",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("avis");
  });

  it("bloque une deuxième évaluation du vendeur par le même livreur", () => {
    const result = submitSellerEvaluation({
      livraisonId: "del3",
      auteurCompteId: "cmp_livreur1",
      note: 4,
      commentaire: "Commande bien préparée",
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("déjà");
  });
});
