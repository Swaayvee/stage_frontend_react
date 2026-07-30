import { beforeEach, describe, expect, it } from "vitest";
import {
  createLivraison,
  genererBonPaiement,
  genererFacture,
  getState,
  marquerBonPaye,
  marquerFacturePayee,
  previewBonPaiement,
  previewFacture,
  resetDemoData,
} from "../lib/store";
import {
  economieLivraison,
  TARIF_ABONNEMENT_MENSUEL,
  TARIF_LIVRAISON_UNITAIRE,
  TARIF_LIVRAISON_VENDEUR,
} from "../lib/domain";

describe("économie des livraisons", () => {
  beforeEach(() => resetDemoData());

  it("applique un tarif fixe aux livraisons équipe et pool", () => {
    for (const mode of ["equipe", "pool_plateforme"]) {
      expect(economieLivraison(mode)).toMatchObject({
        coutVendeur: TARIF_LIVRAISON_VENDEUR,
        remunerationLivreur: TARIF_LIVRAISON_UNITAIRE,
        commissionPlateforme:
          TARIF_LIVRAISON_VENDEUR - TARIF_LIVRAISON_UNITAIRE,
      });
    }
  });

  it("ne facture et ne rémunère pas une livraison propre", () => {
    expect(economieLivraison("propre")).toMatchObject({
      coutVendeur: 0,
      remunerationLivreur: 0,
      commissionPlateforme: 0,
      regle: "livraison_propre_sans_frais",
    });
  });

  it("fige le calcul économique lors de la création", () => {
    const result = createLivraison("cmp_vendeur1", {
      modePriseEnCharge: "pool_plateforme",
      poolAttribution: "automatique",
      clientNom: "Test",
      clientPrenom: "Économie",
      adresseLivraison: "1 rue Test, Lyon",
      villeLivraison: "Lyon",
      departementLivraison: "Rhône",
      descriptionContenu: "Colis test",
      dateReceptionPrevue: "2026-07-31T12:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    expect(result.livraison.economie).toMatchObject({
      coutVendeur: TARIF_LIVRAISON_VENDEUR,
      remunerationLivreur: TARIF_LIVRAISON_UNITAIRE,
      devise: "EUR",
    });
    expect(result.livraison.economie.calculeeLe).toBeTruthy();
  });

  it("détaille abonnement, livraisons facturées et trajets propres", () => {
    getState().factures = [];
    const platformInvoice = genererFacture(
      "cmp_super1",
      "ven1",
      "2026-07-01T00:00:00.000Z",
      "2026-07-31T23:59:59.999Z"
    ).facture;
    const ownInvoice = genererFacture(
      "cmp_super1",
      "ven2",
      "2026-07-01T00:00:00.000Z",
      "2026-07-31T23:59:59.999Z"
    ).facture;

    expect(platformInvoice.montantAbonnement).toBe(TARIF_ABONNEMENT_MENSUEL);
    expect(platformInvoice.lignes.some(
      (line) => line.type === "livraison" && line.montant === TARIF_LIVRAISON_VENDEUR
    )).toBe(true);
    expect(ownInvoice.lignes.some(
      (line) => line.type === "livraison" && line.montant === 0
    )).toBe(true);
    expect(platformInvoice.montant).toBeCloseTo(
      platformInvoice.lignes.reduce((sum, line) => sum + line.montant, 0)
    );
  });

  it("crée un bon avec une ligne par livraison terminée", () => {
    getState().bonsPaiement = [];
    const voucher = genererBonPaiement(
      "cmp_super1",
      "liv1",
      "2026-07-01T00:00:00.000Z",
      "2026-07-31T23:59:59.999Z"
    ).bon;

    expect(voucher.lignes).toHaveLength(voucher.nombreLivraisonsTraitees);
    expect(voucher.lignes.every(
      (line) => line.montant === TARIF_LIVRAISON_UNITAIRE
    )).toBe(true);
    expect(voucher.montantTotal).toBeCloseTo(
      voucher.lignes.reduce((sum, line) => sum + line.montant, 0)
    );
  });

  it("refuse de facturer ou payer deux fois une période qui se chevauche", () => {
    expect(genererFacture(
      "cmp_super1",
      "ven1",
      "2026-06-15T00:00:00.000Z",
      "2026-07-15T23:59:59.999Z"
    ).ok).toBe(false);
    expect(genererBonPaiement(
      "cmp_super1",
      "liv1",
      "2026-06-15T00:00:00.000Z",
      "2026-07-15T23:59:59.999Z"
    ).ok).toBe(false);
  });

  it("prévisualise les montants sans créer de document", () => {
    const state = getState();
    const invoiceCount = state.factures.length;
    const voucherCount = state.bonsPaiement.length;
    const invoicePreview = previewFacture(
      "cmp_super1",
      "ven1",
      "2026-07-01T00:00:00.000Z",
      "2026-07-31T23:59:59.999Z"
    );
    const voucherPreview = previewBonPaiement(
      "cmp_super1",
      "liv1",
      "2026-07-01T00:00:00.000Z",
      "2026-07-31T23:59:59.999Z"
    );

    expect(invoicePreview.ok).toBe(true);
    expect(invoicePreview.preview.lignes.length).toBeGreaterThan(0);
    expect(voucherPreview.ok).toBe(true);
    expect(state.factures).toHaveLength(invoiceCount);
    expect(state.bonsPaiement).toHaveLength(voucherCount);
  });

  it("protège la validation des paiements par le rôle et la juridiction", () => {
    const state = getState();
    const invoice = state.factures.find((item) => item._id === "fac2");
    const voucher = state.bonsPaiement.find((item) => item._id === "bp1");
    invoice.statut = "emise";

    expect(marquerFacturePayee("cmp_livreur1", invoice._id).ok).toBe(false);
    expect(invoice.statut).toBe("emise");
    expect(marquerFacturePayee("cmp_gest1", invoice._id).ok).toBe(true);
    expect(invoice.datePaiement).toBeTruthy();

    expect(marquerBonPaye("cmp_vendeur1", voucher._id).ok).toBe(false);
    expect(marquerBonPaye("cmp_gest1", voucher._id).ok).toBe(true);
    expect(voucher.datePaiement).toBeTruthy();
  });
});
