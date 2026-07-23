"use client";
import Link from "next/link";
import { use, useState } from "react";

export default function Tracking({ params }) {
  const [location, setLocation] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueType, setIssueType] = useState("retard");
  const [issueDetails, setIssueDetails] = useState("");
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  const { reference } = use(params);

  const handleSubmitIssue = (e) => {
    e.preventDefault();
    setIssueSubmitted(true);
    setTimeout(() => {
      setShowIssueModal(false);
      setIssueSubmitted(false);
      setIssueDetails("");
    }, 2500);
  };

  return (
    <main className="tracking">
      <div className="ambient-background" />
      <div className="tracking-card">
        <Link href="/" className="brand">
          Relay<span>Flow</span>
        </Link>
        <p className="eyebrow">SUIVI PUBLIC · {reference}</p>
        <h1>Votre livraison est en route</h1>
        <p className="tracking-copy">
          Votre colis a été récupéré par Lucas Martin. Il vous contactera par
          SMS ou appel avant son arrivée.
        </p>
        <div className="progress">
          <i />
          <i />
          <i className="pending" />
        </div>
        <div className="tracking-steps">
          <span>Colis préparé</span>
          <span>Récupéré</span>
          <span>En livraison</span>
          <span>Livré</span>
        </div>
        <div className="map">
          <span>Position du livreur</span>
          <b>●</b>
          <small>
            {location
              ? "Position partagée · mise à jour il y a 2 min"
              : "La localisation n’est pas encore partagée par le livreur."}
          </small>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => setLocation(!location)} className="small">
            {location
              ? "Masquer la simulation"
              : "Simuler la localisation du livreur"}
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="small danger"
          >
            Signaler un problème
          </button>
        </div>

        <div className="contact mt-6">
          <b>Une question ?</b>
          <p>
            Le livreur vous contacte par le canal choisi par le commerçant :
            SMS, appel ou messagerie.
          </p>
        </div>

        {showIssueModal && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowIssueModal(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0d172b] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-2">Signaler un problème sur votre livraison</h2>
              <p className="text-xs text-slate-400 mb-4">
                Référence : <span className="font-mono text-indigo-300">{reference}</span>
              </p>

              {issueSubmitted ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-center">
                  <p className="text-sm font-bold text-emerald-300">✓ Signalement enregistré avec succès.</p>
                  <p className="text-xs text-slate-300 mt-1">Notre équipe manager et le livreur ont été notifiés.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitIssue} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Type de problème
                    </label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                    >
                      <option value="retard">Retard important de livraison</option>
                      <option value="absent">Le livreur indique être passé mais j'étais présent</option>
                      <option value="injoignable">Livreur injoignable par téléphone</option>
                      <option value="endommage">Colis ou contenu endommagé</option>
                      <option value="autre">Autre motif</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Explications complémentaires
                    </label>
                    <textarea
                      required
                      value={issueDetails}
                      onChange={(e) => setIssueDetails(e.target.value)}
                      placeholder="Décrivez précisément votre problème…"
                      rows={4}
                      className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="small good flex-1">
                      Envoyer le signalement
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowIssueModal(false)}
                      className="small"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
