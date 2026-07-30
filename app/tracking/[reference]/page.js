"use client";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useRelayFlow } from "../../../context/RelayFlowProvider";
import { inJurisdiction, STATUT_LIVRAISON_LABEL } from "../../../lib/domain";

const STEPS = ["Soumise", "Acceptée", "Retirée", "Livrée"];

function stepIndex(statut) {
  const map = { SOUMISE: 0, ACCEPTEE: 1, RETIREE: 2, LIVREE: 3, ECHOUEE: 0, REFUSEE: 0 };
  return map[statut] ?? 0;
}

export default function Tracking({ params }) {
  const { reference } = use(params);
  const { state, api, session } = useRelayFlow();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingFeedback, setRatingFeedback] = useState("");

  const livraison = useMemo(() => {
    return state?.livraisons?.find((delivery) => {
      const publicMatch =
        delivery.suiviPublic === true &&
        delivery.publicTrackingToken?.toLowerCase() === reference.toLowerCase();
      const manager = state?.gestionnaires?.find(
        (item) => item.compteId === session?.compteId
      );
      const seller = state?.vendeurs?.find((item) => item._id === delivery.vendeurId);
      const privileged =
        session?.role === "super_manager" ||
        (session?.role === "manager" && inJurisdiction(seller, manager?.juridiction));
      const internalMatch =
        privileged && delivery.numeroSuivi.toLowerCase() === reference.toLowerCase();
      return publicMatch || internalMatch;
    });
  }, [state, reference, session]);

  if (!livraison) {
    return (
      <main className="tracking">
        <div className="ambient-background" />
        <div className="tracking-card tracking-card--empty">
          <div className="tracking-empty__top">
            <Link href="/" className="brand">Relay<span>Flow</span></Link>
            <span className="tracking-empty__status">Lien indisponible</span>
          </div>
          <div className="tracking-empty__content">
            <p className="tracking-empty__eyebrow">Suivi de livraison</p>
            <h1>Livraison introuvable</h1>
            <p className="tracking-copy">
              Ce lien de suivi est incorrect, incomplet ou n’a pas été activé par le commerçant.
            </p>
            <p className="tracking-empty__notice">
              Vérifiez le lien reçu ou demandez au commerçant de vous envoyer un nouveau lien public.
            </p>
            <Link href="/" className="button">Retour à l’accueil</Link>
          </div>
        </div>
      </main>
    );
  }

  const livreur = state?.livreurs?.find((l) => l._id === livraison.livreurId);
  const vendeur = state?.vendeurs?.find((v) => v._id === livraison.vendeurId);
  const current = stepIndex(livraison.statut);
  const label = STATUT_LIVRAISON_LABEL[livraison.statut] || livraison.statut;

  return (
    <main className="tracking">
      <div className="ambient-background" />
      <div className="tracking-card">
        <Link href="/" className="brand">Relay<span>Flow</span></Link>
        <p className="eyebrow">SUIVI PUBLIC · {livraison.numeroSuivi}</p>
        <h1>{label}</h1>
        <p className="tracking-copy">
          {livreur
            ? `Prise en charge par ${livreur.nom}.`
            : livraison.modePriseEnCharge === "propre"
              ? `Livraison assurée par ${livraison.nomLivreurTexte || vendeur?.raisonSociale || "le vendeur"}.`
              : "En attente d'un livreur disponible dans la zone."}
        </p>
        <div className="progress">
          {STEPS.map((_, i) => (
            <i key={i} className={i <= current ? "" : "pending"} />
          ))}
        </div>
        <div className="tracking-steps">
          {STEPS.map((s) => <span key={s}>{s}</span>)}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm space-y-2 mt-4">
          <p><strong>Client :</strong> {livraison.client?.prenom} {livraison.client?.nom}</p>
          <p><strong>Adresse :</strong> {livraison.client?.adresse || livraison.villeLivraison}</p>
          <p><strong>Commerçant :</strong> {vendeur?.raisonSociale || "—"}</p>
          {livraison.descriptionContenu && <p><strong>Contenu :</strong> {livraison.descriptionContenu}</p>}
        </div>
        {livreur?.coordonnees && (
          <div className="map mt-4">
            <span>Position du livreur (approximative)</span>
            <small>Lat {livreur.coordonnees.lat?.toFixed(4)}, Lng {livreur.coordonnees.lng?.toFixed(4)}</small>
          </div>
        )}
        {livraison.statut === "LIVREE" && livreur && (
          <section className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="m-0 text-base font-black text-white">Noter la livraison</h2>
            <p className="mt-1 text-xs text-slate-400">Votre avis concerne le livreur {livreur.nom}.</p>
            <div className="my-3 flex gap-2" aria-label="Note sur cinq">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`h-9 w-9 rounded-lg border text-sm font-black ${
                    value <= rating
                      ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                      : "border-white/10 bg-white/5 text-slate-500"
                  }`}
                  onClick={() => setRating(value)}
                  aria-label={`${value} sur 5`}
                >
                  {value}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              rows={3}
              required
              placeholder="Votre avis (obligatoire)"
              className="w-full rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              className="button mt-3"
              disabled={!rating || comment.trim().length < 3}
              onClick={() => {
                const result = api.submitEvaluation({
                  livraisonId: livraison._id,
                  numeroSuivi: livraison.numeroSuivi,
                  auteurType: "client",
                  note: rating,
                  commentaire: comment,
                });
                setRatingFeedback(result.ok ? "Merci, votre avis a été enregistré." : result.error);
              }}
            >
              Envoyer l’avis
            </button>
            {ratingFeedback && <p className="mt-3 text-xs font-bold text-indigo-200">{ratingFeedback}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
