"use client";

import { useMemo, useState } from "react";
import { useRelayFlow } from "../context/RelayFlowProvider";

const STATUS = {
  en_attente: ["À étudier", "amber"],
  actif: ["Partenaire actif", "green"],
  rejete: ["Refusé", "red"],
  revoque: ["Terminé", "gray"],
};

export default function CourierPartnerships() {
  const { state, session, api } = useRelayFlow();
  const [rejectingId, setRejectingId] = useState("");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const courier = state?.livreurs?.find((item) => item.compteId === session?.compteId);

  const partnerships = useMemo(
    () =>
      (state?.partenariats || [])
        .filter((partnership) => partnership.livreurId === courier?._id)
        .map((partnership) => ({
          ...partnership,
          seller: state?.vendeurs?.find((seller) => seller._id === partnership.vendeurId),
        }))
        .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0)),
    [state, courier?._id]
  );

  const pending = partnerships.filter((partnership) => partnership.statut === "en_attente");
  const active = partnerships.filter((partnership) => partnership.statut === "actif");
  const history = partnerships.filter(
    (partnership) => !["en_attente", "actif"].includes(partnership.statut)
  );

  const deliveriesTogether = (partnership) =>
    (state?.livraisons || []).filter(
      (delivery) =>
        delivery.vendeurId === partnership.vendeurId &&
        delivery.livreurId === courier?._id &&
        delivery.statut === "LIVREE"
    ).length;

  const accept = (partnershipId) => {
    const result = api.accepterPartenariat(session?.compteId, partnershipId);
    if (result.ok) {
      setFeedback("Partenariat accepté. Le commerçant a été prévenu.");
      setError("");
    } else setError(result.error);
  };

  const reject = (partnershipId) => {
    const result = api.rejeterPartenariat(session?.compteId, partnershipId, reason);
    if (result.ok) {
      setFeedback("Proposition refusée. Le commerçant a été prévenu.");
      setError("");
      setReason("");
      setRejectingId("");
    } else setError(result.error);
  };

  const PartnershipCard = ({ partnership, actionable = false }) => {
    const [statusLabel, statusColor] = STATUS[partnership.statut] || [partnership.statut, "gray"];
    return (
      <article className="panel overflow-hidden p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-base font-black text-white">
                {partnership.seller?.raisonSociale || "Commerce"}
              </h2>
              <span className={`pill ${statusColor}`}>{statusLabel}</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {partnership.seller?.ville || "Ville non renseignée"}
              {partnership.seller?.adresse ? ` · ${partnership.seller.adresse}` : ""}
            </p>
            {partnership.message && (
              <p className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-300">
                {partnership.message}
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Proposition reçue le{" "}
              {new Date(partnership.dateCreation).toLocaleDateString("fr-FR")}
            </p>
          </div>
          {!actionable && partnership.statut === "actif" && (
            <div className="shrink-0 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center">
              <strong className="block text-xl text-emerald-300">
                {deliveriesTogether(partnership)}
              </strong>
              <small className="text-slate-400">livraisons ensemble</small>
            </div>
          )}
        </div>

        {actionable && (
          <div className="border-t border-white/10 bg-slate-950/30 p-4">
            {rejectingId === partnership._id ? (
              <div className="space-y-3">
                <textarea
                  value={reason}
                  maxLength={300}
                  rows={2}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Raison du refus (obligatoire)"
                  className="w-full rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm text-white outline-none focus:border-indigo-400"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="small danger"
                    disabled={reason.trim().length < 3}
                    onClick={() => reject(partnership._id)}
                  >
                    Confirmer le refus
                  </button>
                  <button
                    type="button"
                    className="small"
                    onClick={() => {
                      setRejectingId("");
                      setReason("");
                      setError("");
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="small good"
                  onClick={() => accept(partnership._id)}
                >
                  Accepter la proposition
                </button>
                <button
                  type="button"
                  className="small danger"
                  onClick={() => {
                    setRejectingId(partnership._id);
                    setFeedback("");
                    setError("");
                  }}
                >
                  Refuser
                </button>
              </div>
            )}
          </div>
        )}
      </article>
    );
  };

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <span className="mini-label">À étudier</span>
          <strong className="mt-2 block text-2xl text-white">{pending.length}</strong>
        </div>
        <div className="panel p-4">
          <span className="mini-label">Partenaires actifs</span>
          <strong className="mt-2 block text-2xl text-white">{active.length}</strong>
        </div>
        <div className="panel p-4">
          <span className="mini-label">Total</span>
          <strong className="mt-2 block text-2xl text-white">{partnerships.length}</strong>
          <small className="text-slate-400">Plusieurs partenariats sont autorisés</small>
        </div>
      </div>

      {feedback && (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300">
          {feedback}
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
          Propositions reçues
        </h2>
        {pending.length ? (
          pending.map((partnership) => (
            <PartnershipCard key={partnership._id} partnership={partnership} actionable />
          ))
        ) : (
          <div className="panel p-6 text-center text-sm text-slate-400">
            Aucune proposition en attente.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-400">
          Mes partenaires actifs
        </h2>
        {active.length ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {active.map((partnership) => (
              <PartnershipCard key={partnership._id} partnership={partnership} />
            ))}
          </div>
        ) : (
          <div className="panel p-6 text-center text-sm text-slate-400">
            Vous n’avez pas encore de partenariat actif.
          </div>
        )}
      </div>

      {history.length > 0 && (
        <details className="panel p-5">
          <summary className="cursor-pointer text-sm font-black text-white">
            Historique ({history.length})
          </summary>
          <div className="mt-4 space-y-3">
            {history.map((partnership) => (
              <PartnershipCard key={partnership._id} partnership={partnership} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
