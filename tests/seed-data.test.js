import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createSeedState } from "../lib/seedData";

describe("jeu de données de démonstration", () => {
  it("contient plusieurs demandes d'adhésion exploitables", () => {
    const state = createSeedState();

    expect(state.applications.length).toBeGreaterThanOrEqual(3);
    expect(state.applications.some((application) => application.role === "vendeur")).toBe(true);
    expect(state.applications.filter((application) => application.role === "livreur").length)
      .toBeGreaterThanOrEqual(2);
    expect(state.applications.every(
      (application) =>
        application.managerIds.length > 0 &&
        application.documents.length > 0 &&
        application.statut === "en_attente"
    )).toBe(true);
  });

  it("couvre les principaux états et modes de livraison", () => {
    const state = createSeedState();
    const statuses = new Set(state.livraisons.map((delivery) => delivery.statut));
    const modes = new Set(state.livraisons.map((delivery) => delivery.modePriseEnCharge));

    expect(state.livraisons.length).toBeGreaterThanOrEqual(20);
    ["SOUMISE", "ACCEPTEE", "RETIREE", "LIVREE", "ECHOUEE"].forEach(
      (status) => expect(statuses.has(status)).toBe(true)
    );
    ["propre", "equipe", "pool_plateforme"].forEach(
      (mode) => expect(modes.has(mode)).toBe(true)
    );
  });

  it("contient des conversations internes cohérentes", () => {
    const state = createSeedState();
    const issueIds = new Set(state.signalements.map((issue) => issue._id));
    const accountIds = new Set(state.comptes.map((account) => account._id));

    expect(state.messagesIncidents.length).toBeGreaterThanOrEqual(3);
    state.messagesIncidents.forEach((message) => {
      expect(issueIds.has(message.signalementId)).toBe(true);
      expect(accountIds.has(message.expediteurCompteId)).toBe(true);
      expect(message.destinataireCompteIds.every((id) => accountIds.has(id))).toBe(true);
      expect(message.contenu.length).toBeGreaterThan(1);
    });
  });

  it("respecte la chronologie des livraisons et des incidents", () => {
    const state = createSeedState();

    state.livraisons.forEach((delivery) => {
      const submittedAt = new Date(delivery.dateSoumission).getTime();
      const history = delivery.historique || [];
      history.forEach((event, index) => {
        expect(new Date(event.quand).getTime()).toBeGreaterThanOrEqual(submittedAt);
        if (index > 0) {
          expect(new Date(event.quand).getTime()).toBeGreaterThanOrEqual(
            new Date(history[index - 1].quand).getTime()
          );
        }
      });
      if (history.length) {
        expect(history.at(-1).nouveauStatut).toBe(delivery.statut);
      }
    });

    state.signalements.forEach((issue) => {
      const createdAt = new Date(issue.dateCreation).getTime();
      const delivery = state.livraisons.find((item) => item._id === issue.livraisonId);
      if (delivery) {
        expect(createdAt).toBeGreaterThanOrEqual(new Date(delivery.dateSoumission).getTime());
      }
      const history = issue.historique || [];
      history.forEach((event, index) => {
        expect(new Date(event.quand).getTime()).toBeGreaterThanOrEqual(createdAt);
        if (index > 0) {
          expect(new Date(event.quand).getTime()).toBeGreaterThanOrEqual(
            new Date(history[index - 1].quand).getTime()
          );
        }
      });
      if (history.length) expect(history.at(-1).statut).toBe(issue.statut);
    });
  });

  it("place les messages après l'ouverture de leur incident", () => {
    const state = createSeedState();
    state.messagesIncidents.forEach((message) => {
      const issue = state.signalements.find((item) => item._id === message.signalementId);
      expect(new Date(message.dateCreation).getTime()).toBeGreaterThanOrEqual(
        new Date(issue.dateCreation).getTime()
      );
    });
  });

  it("émet les documents financiers après la période concernée", () => {
    const state = createSeedState();
    [...state.factures, ...state.bonsPaiement].forEach((record) => {
      expect(new Date(record.dateEmission).getTime()).toBeGreaterThan(
        new Date(record.periodeFin).getTime()
      );
    });
  });

  it("référence uniquement des justificatifs PDF réellement ouvrables", () => {
    const state = createSeedState();
    const documents = state.applications.flatMap((application) => application.documents);

    expect(documents.length).toBeGreaterThanOrEqual(6);
    documents.forEach((document) => {
      expect(document.url).toMatch(/^\/documents\/.+\.pdf$/);
      const filePath = join(process.cwd(), "public", document.url.replace(/^\//, ""));
      expect(existsSync(filePath)).toBe(true);
      expect(readFileSync(filePath).subarray(0, 4).toString()).toBe("%PDF");
    });
  });
});
