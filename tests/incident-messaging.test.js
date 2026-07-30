import { beforeEach, describe, expect, it } from "vitest";
import {
  getState,
  markIssueMessagesRead,
  resetDemoData,
  sendIssueMessage,
} from "../lib/store";
import { buildViewModel } from "../lib/viewModel";

describe("messagerie interne des signalements", () => {
  beforeEach(() => resetDemoData());

  it("permet au manager de contacter le vendeur et le livreur concernés", () => {
    const before = getState().messagesIncidents.length;
    const result = sendIssueMessage(
      "cmp_gest1",
      "sig1",
      ["cmp_vendeur1", "cmp_livreur1"],
      "Merci de confirmer ensemble le nouveau créneau."
    );

    expect(result.ok).toBe(true);
    expect(getState().messagesIncidents).toHaveLength(before + 1);
    expect(result.message.destinataireCompteIds).toEqual(
      expect.arrayContaining(["cmp_vendeur1", "cmp_livreur1"])
    );
    expect(getState().signalements.find((issue) => issue._id === "sig1").statut)
      .toBe("en_traitement");
    expect(
      getState().notifications.filter(
        (notification) =>
          result.message.destinataireCompteIds.includes(notification.compteId) &&
          notification.type === "message_recu"
      )
    ).toHaveLength(2);
  });

  it("permet au livreur concerné de répondre au manager", () => {
    const result = sendIssueMessage(
      "cmp_livreur1",
      "sig1",
      ["cmp_gest1"],
      "Le nouveau passage est confirmé."
    );

    expect(result.ok).toBe(true);
    expect(result.message.destinataireCompteIds).toEqual(["cmp_gest1"]);
    expect(getState().notifications.some(
      (notification) =>
        notification.compteId === "cmp_gest1" &&
        notification.lienRessource === "/manager/issues/SIG-2026-001"
    )).toBe(true);
  });

  it("interdit l'accès à un compte étranger au dossier", () => {
    const result = sendIssueMessage(
      "cmp_livreur2",
      "sig1",
      ["cmp_gest1"],
      "Tentative d'accès."
    );

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/participez pas/i);
  });

  it("refuse les destinataires non rattachés et les messages invalides", () => {
    const wrongRecipient = sendIssueMessage(
      "cmp_gest1",
      "sig1",
      ["cmp_livreur2"],
      "Message valide mais mauvais destinataire."
    );
    const emptyMessage = sendIssueMessage(
      "cmp_gest1",
      "sig1",
      ["cmp_livreur1"],
      " "
    );

    expect(wrongRecipient.ok).toBe(false);
    expect(emptyMessage.ok).toBe(false);
  });

  it("n'expose au vendeur et au livreur que leurs conversations", () => {
    const merchantView = buildViewModel(getState(), {
      compteId: "cmp_vendeur1",
      role: "vendeur",
      routeRole: "merchant",
    });
    const courierView = buildViewModel(getState(), {
      compteId: "cmp_livreur1",
      role: "livreur",
      routeRole: "courier",
    });
    const unrelatedCourierView = buildViewModel(getState(), {
      compteId: "cmp_livreur2",
      role: "livreur",
      routeRole: "courier",
    });

    expect(merchantView.issueThreads.map((thread) => thread.issue._id))
      .toEqual(expect.arrayContaining(["sig1", "sig2"]));
    expect(courierView.issueThreads.map((thread) => thread.issue._id)).toContain("sig1");
    expect(unrelatedCourierView.issueThreads.map((thread) => thread.issue._id))
      .not.toContain("sig1");
  });

  it("marque comme lus uniquement les messages destinés au compte", () => {
    expect(
      getState().messagesIncidents.find((message) => message._id === "msg_sig1_1")
        .luParCompteIds
    ).not.toContain("cmp_livreur1");

    markIssueMessagesRead("cmp_livreur1", "sig1");

    expect(
      getState().messagesIncidents.find((message) => message._id === "msg_sig1_1")
        .luParCompteIds
    ).toContain("cmp_livreur1");
    expect(
      getState().messagesIncidents.find((message) => message._id === "msg_sig2_1")
        .luParCompteIds
    ).not.toContain("cmp_livreur1");
  });
});
