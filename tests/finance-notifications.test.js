import { beforeEach, describe, expect, it } from "vitest";
import {
  genererBonPaiement,
  genererFacture,
  getState,
  resetDemoData,
} from "../lib/store";
import { buildViewModel } from "../lib/viewModel";

describe("finances et notifications", () => {
  beforeEach(() => resetDemoData());

  it("actualise les chiffres financiers depuis les écritures enregistrées", () => {
    const before = buildViewModel(getState(), {
      compteId: "cmp_super1",
      role: "super_manager",
      routeRole: "super_manager",
    });
    const initialInvoices = before.finance.factures.length;
    const initialVouchers = before.finance.bons.length;

    expect(genererFacture(
      "cmp_super1",
      "ven1",
      "2026-09-01T00:00:00.000Z",
      "2026-09-30T23:59:59.999Z"
    ).ok).toBe(true);
    expect(genererBonPaiement(
      "cmp_super1",
      "liv1",
      "2026-09-01T00:00:00.000Z",
      "2026-09-30T23:59:59.999Z"
    ).ok).toBe(true);

    const after = buildViewModel(getState(), {
      compteId: "cmp_super1",
      role: "super_manager",
      routeRole: "super_manager",
    });
    expect(after.finance.factures).toHaveLength(initialInvoices + 1);
    expect(after.finance.bons).toHaveLength(initialVouchers + 1);
  });

  it("notifie le commerçant et le livreur lors des nouvelles opérations", () => {
    genererFacture(
      "cmp_super1",
      "ven1",
      "2026-09-01T00:00:00.000Z",
      "2026-09-30T23:59:59.999Z"
    );
    genererBonPaiement(
      "cmp_super1",
      "liv1",
      "2026-09-01T00:00:00.000Z",
      "2026-09-30T23:59:59.999Z"
    );
    const state = getState();
    expect(state.notifications.some(
      (notification) => notification.compteId === "cmp_vendeur1" && notification.type === "finance"
    )).toBe(true);
    expect(state.notifications.some(
      (notification) => notification.compteId === "cmp_livreur1" && notification.type === "finance"
    )).toBe(true);
  });
});
