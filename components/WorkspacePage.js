"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(() => import("./DeliveryMap"), { ssr: false });

import Finance from "./Finance";
import TeamManager from "./TeamManager";
import CourierPartnerships from "./CourierPartnerships";
import { getStatusColor } from "../lib/utils";
import { useRelayFlow } from "../context/RelayFlowProvider";
import {
  courierCoversDelivery,
  economieLivraison,
  STATUT_LIVRAISON_LABEL,
} from "../lib/domain";
import FrenchLocationFields from "./FrenchLocationFields";
import { formatFrenchPhone } from "../lib/location";

/* ─────────────────────────── MACHINE D'ÉTATS LIVRAISON (spec §6) ─────────────────────────── */

const DELIVERY_WORKFLOW = ["Soumise", "Acceptée", "Retirée", "Livrée"];

function DeliveryWorkflowBadge({ status }) {
  const idx = DELIVERY_WORKFLOW.findIndex((s) =>
    status?.toLowerCase().includes(s.toLowerCase()) ||
    s.toLowerCase().includes(status?.toLowerCase() || "")
  );
  const current = Math.max(0, idx);
  return (
    <div className="workflow-steps">
      {DELIVERY_WORKFLOW.map((step, i) => (
        <div key={step} className={`workflow-step ${
          i < current ? "done" : i === current ? "active" : "pending"
        }`}>
          <div className="workflow-dot">
            {i < current ? "✓" : i + 1}
          </div>
          <span className="workflow-label">{step}</span>
          {i < DELIVERY_WORKFLOW.length - 1 && <div className={`workflow-line ${i < current ? "done" : ""}`} />}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── MODAL LIVRAISON ─────────────────────────── */

export function DeliveryModal({ delivery, role, assignMode: initialAssignMode, onClose }) {
  const { session, api, viewModel, state } = useRelayFlow();
  const [assignMode, setAssignMode] = useState(initialAssignMode || false);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [assigned, setAssigned] = useState(false);
  const [reportIssue, setReportIssue] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [issueSent, setIssueSent] = useState(false);
  const [issueError, setIssueError] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [actionError, setActionError] = useState("");
  // Confirmation sécurisée (livreur)
  const [confirmMode, setConfirmMode] = useState(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [failReason, setFailReason] = useState("");
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);
  const [merchantRating, setMerchantRating] = useState(0);
  const [merchantReview, setMerchantReview] = useState("");
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [sellerRating, setSellerRating] = useState(0);
  const [sellerReview, setSellerReview] = useState("");
  const [sellerRatingFeedback, setSellerRatingFeedback] = useState("");
  const [candidateFeedback, setCandidateFeedback] = useState("");

  if (!delivery) return null;

  const livraisonRecord = viewModel.livraisons.find(
    (d) => d._id === delivery[8] || d.numeroSuivi === delivery[0]
  );
  const couriersForAssign = viewModel.couriersForAssign;

  const [ref, merchant, destination, rawStatus, , courierName, address, date] = delivery;
  const status = deliveryStatus || rawStatus;
  const color = getStatusColor(status);
  const rawStatut = livraisonRecord?.statut;
  const deliveryEconomy = economieLivraison(livraisonRecord?.modePriseEnCharge);
  const recordedEconomy = livraisonRecord?.economie || deliveryEconomy;
  const canAssign =
    rawStatut === "SOUMISE" &&
    role === "merchant" &&
    livraisonRecord?.modePriseEnCharge !== "pool_plateforme";
  const candidateOffers = (state?.offresLivraison || [])
    .filter((offer) => offer.livraisonId === livraisonRecord?._id && offer.statut === "en_attente")
    .map((offer) => ({
      offer,
      courier: state?.livreurs?.find((courier) => courier._id === offer.livreurId),
    }));
  const isCourierDelivering =
    role === "courier" && (rawStatut === "ACCEPTEE" || rawStatut === "RETIREE");
  const assignedCourier = state?.livreurs?.find((item) => item._id === livraisonRecord?.livreurId);
  const sellerRecord = state?.vendeurs?.find((item) => item._id === livraisonRecord?.vendeurId);
  const livePositionIsFresh = Date.now() - new Date(assignedCourier?.positionActualiseeLe || 0).getTime() < 5 * 60 * 1000;
  const liveLocationAvailable = Boolean(
    assignedCourier?.partagePositionActif && assignedCourier?.coordonnees && livePositionIsFresh && isCourierDelivering
  );

  const getWorkflowAction = () => {
    if (role === "courier" && livraisonRecord && session) {
      if (rawStatut === "ACCEPTEE")
        return [
          "Confirmer le retrait chez le vendeur",
          () => {
            const r = api.confirmRetrait(session.compteId, livraisonRecord._id);
            if (r.ok) setDeliveryStatus("Retirée");
            else setActionError(r.error);
          },
          "good",
        ];
    }
    return null;
  };

  const workflowAction = getWorkflowAction();

  const handleAssign = () => {
    if (!selectedCourier || !livraisonRecord || !session) return;
    const r = api.assignCourier(session.compteId, livraisonRecord._id, selectedCourier[0]);
    if (r.ok) {
      setAssigned(true);
      setAssignMode(false);
      setDeliveryStatus("Acceptée");
    } else setActionError(r.error);
  };

  const handleSecureConfirm = () => {
    if (!livraisonRecord || !session) return;
    const r = api.confirmLivraison(session.compteId, livraisonRecord._id, {
      code: confirmMode === "code" ? confirmCode : undefined,
      urlPreuve: confirmMode === "photo" ? "photo://justificatif-local" : undefined,
    });
    if (r.ok) {
      setDeliveryStatus("Livrée");
      setConfirmDone(true);
      setConfirmMode(null);
    } else setActionError(r.error);
  };

  const handleFail = () => {
    if (!failReason.trim() || !livraisonRecord || !session) return;
    const r = api.markEchec(session.compteId, livraisonRecord._id, failReason);
    if (r.ok) {
      setDeliveryStatus("Échouée");
      setConfirmDone(true);
      setConfirmMode(null);
    } else setActionError(r.error);
  };

  const handleIssue = () => {
    if (!issueText.trim() || !livraisonRecord || !session) return;
    const type =
      role === "courier"
        ? rawStatut === "RETIREE"
          ? "probleme_remise"
          : "probleme_retrait"
        : "autre";
    const result = api.createSignalement(session.compteId, {
      type,
      livraisonId: livraisonRecord._id,
      description: issueText.trim(),
    });
    if (result.ok) {
      setIssueSent(true);
      setReportIssue(false);
      setIssueText("");
      setIssueError("");
    } else {
      setIssueError(result.error || "Le signalement n'a pas pu être envoyé.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm flex items-start justify-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <article
        className="my-8 w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0d172b] p-5 shadow-2xl md:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="eyebrow mb-1">{assignMode ? "ASSIGNER UN LIVREUR" : "DÉTAILS DE LA LIVRAISON"}</p>
            <h2 className="m-0 text-2xl font-black tracking-tight text-white">{ref}</h2>
            <p className="mt-1 text-sm text-slate-400">{merchant} · {destination}</p>
          </div>
          <button
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 shrink-0"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>

        {!assignMode ? (
          <div className="space-y-4">

            {/* Workflow livraison */}
            <DeliveryWorkflowBadge status={assigned ? "Livreur assigné" : status} />

            {/* Infos principales */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Informations de livraison</p>
              <dl className="grid grid-cols-1 gap-2.5 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-[0.65rem] font-bold uppercase text-slate-500">Référence</dt>
                  <dd className="mt-0.5 font-mono text-indigo-300 font-semibold">{ref}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] font-bold uppercase text-slate-500">Statut actuel</dt>
                  <dd className="mt-0.5">
                    <span className={`pill ${color}`}>{assigned ? "Livreur assigné" : status}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] font-bold uppercase text-slate-500">Commerçant / Origine</dt>
                  <dd className="mt-0.5 text-slate-200">{merchant}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] font-bold uppercase text-slate-500">Adresse de livraison</dt>
                  <dd className="mt-0.5 text-slate-200">{address || destination}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] font-bold uppercase text-slate-500">Livreur assigné</dt>
                  <dd className="mt-0.5 font-semibold text-slate-200">
                    {assigned && selectedCourier ? selectedCourier[1] : courierName || "Aucun (non attribué)"}
                  </dd>
                </div>
                {date && (
                  <div>
                    <dt className="text-[0.65rem] font-bold uppercase text-slate-500">Date de création</dt>
                    <dd className="mt-0.5 text-slate-300">{date}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[0.65rem] font-bold uppercase text-slate-500">Instructions spéciales</dt>
                  <dd className="mt-0.5 text-slate-400 text-xs italic">Laisser devant la porte si absent</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] font-bold uppercase text-slate-500">Poids / Volume</dt>
                  <dd className="mt-0.5 text-slate-300">2.4 kg · Format moyen</dd>
                </div>
                {(role === "merchant" || role === "manager" || role === "super_manager") && (
                  <div>
                    <dt className="text-[0.65rem] font-bold uppercase text-slate-500">Coût commerçant</dt>
                    <dd className={`mt-0.5 font-black ${recordedEconomy.coutVendeur === 0 ? "text-emerald-400" : "text-white"}`}>
                      {recordedEconomy.coutVendeur.toFixed(2).replace(".", ",")} €
                      {recordedEconomy.coutVendeur === 0 && " · livraison propre"}
                    </dd>
                  </div>
                )}
                {(role === "courier" || role === "manager" || role === "super_manager") &&
                  livraisonRecord?.modePriseEnCharge !== "propre" && (
                    <div>
                      <dt className="text-[0.65rem] font-bold uppercase text-slate-500">Gain livreur</dt>
                      <dd className="mt-0.5 font-black text-emerald-400">
                        +{recordedEconomy.remunerationLivreur.toFixed(2).replace(".", ",")} €
                        {rawStatut === "LIVREE" ? " · acquis" : " · prévu"}
                      </dd>
                    </div>
                  )}
              </dl>
            </div>

            {/* Section spéciale livreur : Carte & Navigation */}
            {role === "courier" && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="m-0 text-xs font-bold uppercase tracking-wider text-indigo-300">Itinéraire GPS & Navigation</p>
                  <span className="text-right text-[0.68rem] text-slate-400 font-medium">
                    {liveLocationAvailable ? "Estimation depuis votre position partagée" : "Aucun temps calculé sans position partagée"}
                  </span>
                </div>

                {/* Carte interactive OSRM */}
                <div className="h-[280px] w-full relative rounded-lg overflow-hidden border border-white/5 shadow-inner">
                  <DeliveryMap
                    courierMode="Vélo électrique"
                    courierCoords={liveLocationAvailable ? assignedCourier.coordonnees : null}
                    merchantCoords={sellerRecord?.coordonnees}
                    clientCoords={livraisonRecord?.coordonneesLivraison}
                    merchantName={merchant}
                    clientAddress={address || destination}
                    target={rawStatut === "RETIREE" ? "client" : "merchant"}
                  />
                </div>

                {/* Navigation */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || destination)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button w-full text-center block"
                >
                  Lancer la navigation Google Maps
                </a>
              </div>
            )}

            {/* Confirmation sécurisée livraison (livreur seulement) */}
            {isCourierDelivering && !confirmDone && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Confirmer la remise au client</p>
                {confirmMode === null && (
                  <div className="space-y-2">
                    <button className="button small w-full bg-emerald-600/80 border-emerald-500 text-white" onClick={() => setConfirmMode("code")}>
                      Saisir le code de livraison du client
                    </button>
                    <button className="button small w-full" onClick={() => setConfirmMode("photo")}>
                      Client injoignable — Ajouter une photo justificative
                    </button>
                    <button className="button small w-full border-red-500/30 text-red-300 hover:bg-red-500/10" onClick={() => setConfirmMode("fail")}>
                      Signaler un échec de livraison
                    </button>
                  </div>
                )}
                {confirmMode === "code" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">Code de livraison (communiqué au client)</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="ex: A3F7Z1"
                      value={confirmCode}
                      onChange={e => setConfirmCode(e.target.value.toUpperCase())}
                      className="w-full text-center text-2xl font-black tracking-[0.3em] rounded-lg border border-white/15 bg-slate-950 py-2 text-white outline-none focus:border-indigo-400"
                    />
                    <div className="flex gap-2">
                      <button className="small good flex-1" onClick={handleSecureConfirm} disabled={confirmCode.length < 4}>✓ Valider la remise</button>
                      <button className="small" onClick={() => setConfirmMode(null)}>Annuler</button>
                    </div>
                  </div>
                )}
                {confirmMode === "photo" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Prenez une photo du colis devant la porte ou du lieu de dépôt.</p>
                    {!photoUploaded ? (
                      <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6 cursor-pointer hover:border-indigo-400/50 hover:bg-indigo-500/5 transition-all">
                        <span className="text-3xl">📷</span>
                        <span className="text-xs font-semibold text-slate-300">Cliquez pour sélectionner une photo</span>
                        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => setPhotoUploaded(true)} />
                      </label>
                    ) : (
                      <p className="text-xs text-emerald-400 font-bold">✓ Photo ajoutée avec succès</p>
                    )}
                    <div className="flex gap-2">
                      <button className="small good flex-1" onClick={handleSecureConfirm} disabled={!photoUploaded}>✓ Confirmer le dépôt</button>
                      <button className="small" onClick={() => { setConfirmMode(null); setPhotoUploaded(false); }}>Annuler</button>
                    </div>
                  </div>
                )}
                {confirmMode === "fail" && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">Motif de l'échec (obligatoire)</label>
                    <select
                      className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white"
                      value={failReason}
                      onChange={e => setFailReason(e.target.value)}
                    >
                      <option value="">— Sélectionner un motif —</option>
                      <option value="Adresse introuvable">Adresse introuvable</option>
                      <option value="Client absent après 3 tentatives">Client absent après 3 tentatives</option>
                      <option value="Colis refusé par le client">Colis refusé par le client</option>
                      <option value="Accès impossible">Accès impossible (interphone, code, gardien)</option>
                      <option value="Problème de sécurité">Problème de sécurité sur place</option>
                    </select>
                    <div className="flex gap-2">
                      <button className="small danger flex-1" onClick={handleFail} disabled={!failReason}>Confirmer l'échec</button>
                      <button className="small" onClick={() => setConfirmMode(null)}>Annuler</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {confirmDone && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400 font-bold text-sm">
                ✓ {deliveryStatus} — Merci, le statut a été mis à jour.
              </div>
            )}

            {role === "merchant" && rawStatut === "LIVREE" && livraisonRecord?.livreurId && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Évaluer le livreur</p>
                <div className="my-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`h-9 w-9 rounded-lg border text-sm font-black ${
                        value <= merchantRating
                          ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                          : "border-white/10 bg-white/5 text-slate-500"
                      }`}
                      onClick={() => setMerchantRating(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <textarea
                  value={merchantReview}
                  onChange={(event) => setMerchantReview(event.target.value)}
                  maxLength={500}
                  rows={3}
                  required
                  placeholder="Votre avis sur le livreur (obligatoire)"
                  className="mb-3 w-full rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  className="small"
                  disabled={!merchantRating || merchantReview.trim().length < 3}
                  onClick={() => {
                    const result = api.submitEvaluation({
                      livraisonId: livraisonRecord._id,
                      auteurType: "vendeur",
                      auteurCompteId: session?.compteId,
                      note: merchantRating,
                      commentaire: merchantReview,
                    });
                    setRatingFeedback(result.ok ? "Évaluation enregistrée." : result.error);
                  }}
                >
                  Enregistrer la note
                </button>
                {ratingFeedback && <p className="mt-2 text-xs font-bold text-indigo-200">{ratingFeedback}</p>}
              </div>
            )}

            {role === "courier" && rawStatut === "LIVREE" && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Évaluer le commerçant</p>
                <p className="mt-1 text-xs text-slate-400">Notez la préparation de la commande et la qualité des informations fournies.</p>
                <div className="my-3 flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`h-9 w-9 rounded-lg border text-sm font-black ${
                        value <= sellerRating
                          ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                          : "border-white/10 bg-white/5 text-slate-500"
                      }`}
                      onClick={() => setSellerRating(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <textarea
                  value={sellerReview}
                  onChange={(event) => setSellerReview(event.target.value)}
                  maxLength={500}
                  rows={3}
                  required
                  placeholder="Votre avis sur le commerçant (obligatoire)"
                  className="mb-3 w-full rounded-lg border border-white/10 bg-slate-950/70 p-3 text-sm text-white outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  className="small"
                  disabled={!sellerRating || sellerReview.trim().length < 3}
                  onClick={() => {
                    const result = api.submitSellerEvaluation({
                      livraisonId: livraisonRecord._id,
                      auteurCompteId: session?.compteId,
                      note: sellerRating,
                      commentaire: sellerReview,
                    });
                    setSellerRatingFeedback(result.ok ? "Évaluation du commerçant enregistrée." : result.error);
                  }}
                >
                  Enregistrer la note
                </button>
                {sellerRatingFeedback && <p className="mt-2 text-xs font-bold text-indigo-200">{sellerRatingFeedback}</p>}
              </div>
            )}

            {role === "merchant" &&
              rawStatut === "SOUMISE" &&
              livraisonRecord?.poolAttribution === "validation_vendeur" && (
                <section className="rounded-xl border border-indigo-400/20 bg-indigo-500/5 p-4">
                  <h3 className="m-0 text-sm font-black text-white">Candidatures des livreurs</h3>
                  {candidateOffers.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-400">Aucun livreur n’a encore candidaté.</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {candidateOffers.map(({ offer, courier }) => (
                        <div key={offer._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                          <div>
                            <b className="block text-sm text-white">{courier?.nom || "Livreur"}</b>
                            <small className="text-slate-400">{courier?.typeVehicule || "Véhicule non renseigné"} · {courier?.ville || "Zone non renseignée"}</small>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="small good"
                              onClick={() => {
                                const result = api.decideDeliveryCandidate(session?.compteId, offer._id, "acceptee");
                                setCandidateFeedback(result.ok ? "Livreur choisi et prévenu." : result.error);
                              }}
                            >
                              Choisir
                            </button>
                            <button
                              type="button"
                              className="small"
                              onClick={() => {
                                const result = api.decideDeliveryCandidate(session?.compteId, offer._id, "rejetee");
                                setCandidateFeedback(result.ok ? "Candidature refusée." : result.error);
                              }}
                            >
                              Refuser
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {candidateFeedback && <p className="mt-3 text-xs font-bold text-indigo-200">{candidateFeedback}</p>}
                </section>
              )}

            {/* Actions contextuelles (machine d'états) */}
            <div className="flex flex-wrap gap-2">
              {workflowAction && (
                <button
                  onClick={workflowAction[1]}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-bold transition ${
                    workflowAction[2] === "good"
                      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25"
                      : "border-red-400/30 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                  }`}
                >
                  {workflowAction[0]}
                </button>
              )}

              {canAssign && !assigned && role === "merchant" && (
                <button
                  onClick={() => setAssignMode(true)}
                  className="flex-1 rounded-lg border border-indigo-300/30 bg-indigo-500/15 px-3 py-2 text-sm font-bold text-indigo-100 hover:bg-indigo-500/25"
                >
                  Assigner un livreur
                </button>
              )}

              {/* Le lien public n'existe que si le commerçant l'a activé à la création. */}
              {role === "merchant" && livraisonRecord?.suiviPublic && livraisonRecord?.publicTrackingToken && (
                <div className="flex flex-wrap items-center gap-2 w-full pt-1">
                  <Link href={`/tracking/${livraisonRecord.publicTrackingToken}`} className="small flex-1 text-center bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25">
                    Suivi public
                  </Link>
                  <button
                    type="button"
                    className="small flex-1 text-center bg-white/5 border-white/15 text-slate-200 hover:bg-white/10"
                    onClick={() => {
                      const url = `${window.location.origin}/tracking/${livraisonRecord.publicTrackingToken}`;
                      navigator.clipboard.writeText(url);
                      alert("✓ Lien public de suivi copié dans le presse-papier !");
                    }}
                  >
                    📋 Copier le lien
                  </button>
                  <button
                    type="button"
                    className="small flex-1 text-center bg-white/5 border-white/15 text-slate-200 hover:bg-white/10"
                    onClick={() => {
                      const url = `${window.location.origin}/tracking/${livraisonRecord.publicTrackingToken}`;
                      if (navigator.share) {
                        navigator.share({ title: `Suivi livraison ${ref}`, url }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(url);
                        alert(`🔗 Lien à partager : ${url}`);
                      }
                    }}
                  >
                    🔗 Partager
                  </button>
                </div>
              )}
              {role === "merchant" && !livraisonRecord?.suiviPublic && (
                <p className="w-full text-xs text-slate-400">Suivi public désactivé pour cette livraison.</p>
              )}
            </div>

            {/* Signalement de problème (uniquement commerçant et livreur) */}
            {(role === "merchant" || role === "courier") && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Signaler un problème</p>
                {issueSent ? (
                  <p className="text-sm font-semibold text-emerald-400">✓ Problème signalé avec succès. Notre équipe vous contactera sous 24h.</p>
                ) : !reportIssue ? (
                  <button className="small" onClick={() => setReportIssue(true)}>
                    Signaler un problème avec cette livraison
                  </button>
                ) : (
                  <div className="space-y-3">
                    <label>
                      <span className="text-xs font-bold text-slate-300 block mb-1">Description du problème</span>
                      <textarea
                        placeholder="Décrivez le problème (colis endommagé, non reçu, retard anormal…)"
                        value={issueText}
                        onChange={(e) => setIssueText(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                        rows={3}
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        className="small good"
                        onClick={handleIssue}
                        disabled={!issueText.trim()}
                      >
                        Envoyer le signalement
                      </button>
                      <button className="small" onClick={() => setReportIssue(false)}>Annuler</button>
                    </div>
                    {issueError && <p className="text-xs font-semibold text-red-300">{issueError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Mode assignation */
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Livreurs disponibles</p>
              <div className="space-y-2">
                {couriersForAssign.map((courier) => (
                  <button
                    key={courier[0]}
                    onClick={() => setSelectedCourier(courier)}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                      selectedCourier?.[0] === courier[0]
                        ? "border-indigo-400 bg-indigo-500/15"
                        : "border-white/10 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{courier[1]}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{courier[0]} · {courier[2]} · {courier[3]} · {courier[4].toFixed(1)} km</div>
                      </div>
                      <div className="text-xs font-bold text-amber-300">{courier[5]}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAssign}
                disabled={!selectedCourier}
                className="flex-1 rounded-lg border border-indigo-300/30 bg-indigo-500/15 px-3 py-2 text-sm font-bold text-indigo-100 hover:bg-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirmer l'assignation
              </button>
              <button
                onClick={() => setAssignMode(false)}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

/* ─────────────────────────── FORMULAIRES ─────────────────────────── */

function Form({ type }) {
  const { session, api, state } = useRelayFlow();
  const [sent, setSent] = useState(false);
  const [createdRef, setCreatedRef] = useState("");
  const [createdEconomy, setCreatedEconomy] = useState(null);
  const [formError, setFormError] = useState("");
  const [mode, setMode] = useState("pool_plateforme");
  const [clientNom, setClientNom] = useState("");
  const [clientPrenom, setClientPrenom] = useState("");
  const [clientTel, setClientTel] = useState("");
  const [adresse, setAdresse] = useState("");
  const [villeLivraison, setVilleLivraison] = useState("");
  const [departementLivraison, setDepartementLivraison] = useState("");
  const [codePostalLivraison, setCodePostalLivraison] = useState("");
  const [codeCommuneLivraison, setCodeCommuneLivraison] = useState("");
  const [codeDepartementLivraison, setCodeDepartementLivraison] = useState("");
  const [coordonneesLivraison, setCoordonneesLivraison] = useState(null);
  const [description, setDescription] = useState("");
  const [nomLivreur, setNomLivreur] = useState("");
  const [datePrev, setDatePrev] = useState("");
  const [suiviPublic, setSuiviPublic] = useState(false);
  const [poolAttribution, setPoolAttribution] = useState("automatique");
  const deliveryEconomy = economieLivraison(mode);
  const seller = state?.vendeurs?.find((item) => item.compteId === session?.compteId);
  const ownCourierSuggestions = [
    ...new Set(
      (state?.livraisons || [])
        .filter(
          (delivery) =>
            delivery.vendeurId === seller?._id &&
            delivery.modePriseEnCharge === "propre" &&
            delivery.nomLivreurTexte?.trim()
        )
        .map((delivery) => delivery.nomLivreurTexte.trim())
    ),
  ];

  if (type === "delivery") {
    return (
      <form
        className="form panel space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!session) return;
          setSent(false);
          setFormError("");
          const r = api.createLivraison(session.compteId, {
            modePriseEnCharge: mode,
            clientNom,
            clientPrenom,
            clientTelephone: clientTel,
            adresseLivraison: adresse,
            villeLivraison,
            departementLivraison,
            codePostalLivraison,
            codeCommuneLivraison,
            codeDepartementLivraison,
            coordonneesLivraison,
            descriptionContenu: description,
            nomLivreurTexte: nomLivreur,
            dateReceptionPrevue: datePrev || new Date().toISOString(),
            suiviPublic,
            poolAttribution,
          });
          if (r.ok) {
            setCreatedRef(r.livraison.numeroSuivi);
            setCreatedEconomy(r.livraison.economie);
            setSent(true);
            setClientNom("");
            setClientPrenom("");
            setClientTel("");
            setAdresse("");
            setVilleLivraison("");
            setDepartementLivraison("");
            setCodePostalLivraison("");
            setCodeCommuneLivraison("");
            setCodeDepartementLivraison("");
            setCoordonneesLivraison(null);
            setDescription("");
            setNomLivreur("");
            setDatePrev("");
            setMode("pool_plateforme");
            setSuiviPublic(false);
            setPoolAttribution("automatique");
          } else {
            setFormError(r.error || "La livraison n'a pas pu être créée.");
          }
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label>
            <span>Prénom client</span>
            <input type="text" required value={clientPrenom} onChange={(e) => setClientPrenom(e.target.value)} />
          </label>
          <label>
            <span>Nom client</span>
            <input type="text" required value={clientNom} onChange={(e) => setClientNom(e.target.value)} />
          </label>
          <label>
            <span>Téléphone client (optionnel)</span>
            <input type="tel" value={clientTel} onChange={(e) => setClientTel(formatFrenchPhone(e.target.value))} />
          </label>
          <FrenchLocationFields
            address={adresse}
            city={villeLivraison}
            department={departementLivraison}
            postalCode={codePostalLivraison}
            addressName="adresseLivraison"
            cityName="villeLivraison"
            departmentName="departementLivraison"
            postalCodeName="codePostalLivraison"
            addressLabel="Adresse de livraison"
            cityLabel="Zone de livraison (ville ou arrondissement)"
            onChange={(location) => {
              setAdresse(location.address);
              setVilleLivraison(location.city);
              setDepartementLivraison(location.department);
              setCodePostalLivraison(location.postalCode);
              setCodeCommuneLivraison(location.cityCode);
              setCodeDepartementLivraison(location.departmentCode);
              setCoordonneesLivraison(
                location.latitude != null && location.longitude != null
                  ? { lat: location.latitude, lng: location.longitude }
                  : null
              );
            }}
          />
          <label className="md:col-span-2">
            <span>Description du contenu</span>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nature du colis…" />
          </label>
          <label>
            <span>Mode de prise en charge</span>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="propre">Propre (je livre moi-même)</option>
              <option value="equipe">Équipe (partenaire actif)</option>
              <option value="pool_plateforme">Pool plateforme</option>
            </select>
          </label>
          <label>
            <span>Date de réception prévue</span>
            <input type="date" value={datePrev} onChange={(e) => setDatePrev(e.target.value)} />
          </label>
          {mode === "propre" && (
            <label className="md:col-span-2">
              <span>Nom du livreur</span>
              <input
                type="text"
                list="own-courier-suggestions"
                autoComplete="name"
                required
                value={nomLivreur}
                onChange={(e) => setNomLivreur(e.target.value)}
                placeholder="Commencez à saisir un nom…"
              />
              <datalist id="own-courier-suggestions">
                {ownCourierSuggestions.map((name) => <option key={name} value={name} />)}
              </datalist>
              <small className="mt-1 block text-slate-400">
                Les noms déjà utilisés sont proposés automatiquement.
              </small>
            </label>
          )}
          <section className="md:col-span-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.035]">
            {mode === "pool_plateforme" && (
              <div
                className="delivery-pool-choice"
                role="radiogroup"
                aria-labelledby="pool-attribution-label"
              >
                <span id="pool-attribution-label" className="delivery-pool-choice__title">
                  Attribution du livreur
                </span>
                <label>
                  <input
                    type="radio"
                    name="poolAttribution"
                    value="automatique"
                    checked={poolAttribution === "automatique"}
                    onChange={(event) => setPoolAttribution(event.target.value)}
                  />
                  <span>Automatique</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="poolAttribution"
                    value="validation_vendeur"
                    checked={poolAttribution === "validation_vendeur"}
                    onChange={(event) => setPoolAttribution(event.target.value)}
                  />
                  <span>Manuelle</span>
                </label>
              </div>
            )}
            <label className="delivery-public-choice">
              <input
                type="checkbox"
                checked={suiviPublic}
                onChange={(event) => setSuiviPublic(event.target.checked)}
              />
              <span>
                <b>Créer un lien public de suivi</b>
                <small>Le client pourra suivre la livraison avec ce lien.</small>
              </span>
            </label>
          </section>
          <section className="md:col-span-2 rounded-xl border border-indigo-400/20 bg-indigo-500/[0.07] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="m-0 text-xs font-black uppercase tracking-wider text-indigo-300">
                  Coût de cette livraison
                </p>
                <p className="mt-1 mb-0 text-sm text-slate-300">
                  {mode === "propre"
                    ? "Vous assurez le trajet : aucun frais de livraison RelayFlow."
                    : `Tarif fixe, indépendant de la distance. Le livreur recevra ${deliveryEconomy.remunerationLivreur.toFixed(2).replace(".", ",")} € après la remise.`}
                </p>
              </div>
              <strong className={`text-2xl font-black ${deliveryEconomy.coutVendeur === 0 ? "text-emerald-400" : "text-white"}`}>
                {deliveryEconomy.coutVendeur.toFixed(2).replace(".", ",")} €
              </strong>
            </div>
          </section>
        </div>
        <button className="button w-full" type="submit">Créer la livraison</button>
        {formError && <p className="text-sm font-bold text-red-300">{formError}</p>}
        {sent && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-emerald-400 font-bold text-sm">
            ✓ Livraison créée — numéro de suivi : {createdRef}. Coût prévu :{" "}
            {Number(createdEconomy?.coutVendeur || 0).toFixed(2).replace(".", ",")} €.
          </div>
        )}
      </form>
    );
  }

  return (
    <form
      className="form panel"
      onSubmit={(e) => {
        e.preventDefault();
        setFormError("");
        const data = new FormData(e.currentTarget);
        const result = api.inviterGestionnaire(session?.compteId, {
          email: data.get("email"),
          password: data.get("password"),
          juridiction: {
            niveau: "departement",
            valeur: data.get("zone"),
            code: data.get("codeDepartement"),
          },
          nom: data.get("nom"),
        });
        if (!result.ok) {
          setFormError(result.error || "Impossible de créer ce compte manager.");
          return;
        }
        setSent(true);
        e.currentTarget.reset();
      }}
    >
      <label>
        Prénom et nom
        <input name="nom" type="text" required minLength={2} placeholder="Prénom Nom" />
      </label>
      <label>
        E-mail professionnel
        <input name="email" type="email" required placeholder="manager@relayflow.fr" />
      </label>
      <FrenchLocationFields
        showAddress={false}
        cityName="ville"
        departmentName="zone"
        postalCodeName="codePostal"
      />
      <label>
        Mot de passe temporaire
        <input name="password" type="password" required minLength={10} placeholder="••••••••••" />
      </label>
      {formError && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">{formError}</p>}
      {sent && <p className="success">✓ Enregistrement effectué avec succès.</p>}
      <button className="button" type="submit">Créer le compte manager</button>
    </form>
  );
}

/* ─────────────────────────── FORMULAIRE INVITATION (manager → vendeur/livreur) ─────────────────────────── */

function InviteForm({ role }) {
  const { session, api } = useRelayFlow();
  const [inviteType, setInviteType] = useState("merchant");
  const [merchantType, setMerchantType] = useState("physical");
  const [vehicle, setVehicle] = useState("");
  const [formVersion, setFormVersion] = useState(0);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hasPlate = ["scooter", "car", "van"].includes(vehicle);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSent(false);
    setFormError("");
    if (!event.currentTarget.checkValidity()) {
      event.currentTarget.reportValidity();
      return;
    }
    setSubmitting(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const profil = Object.fromEntries(
      [...data.entries()].filter(([key]) => !["password"].includes(key))
    );
    const result = await api.createUserByManager(session?.compteId, {
      role: inviteType === "merchant" ? "vendeur" : "livreur",
      email: data.get("email"),
      telephone: data.get("telephone"),
      password: data.get("password"),
      nom: data.get("nom"),
      raisonSociale: inviteType === "merchant" ? data.get("raisonSociale") : "",
      adresse: data.get("adresse"),
      ville: data.get("ville"),
      departement: data.get("departement"),
      codePostal: data.get("codePostal"),
      codeCommune: data.get("codeCommune"),
      codeDepartement: data.get("codeDepartement"),
      typeVehicule: data.get("typeVehicule"),
      profil,
      documents: [],
    });
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error || "La création du compte a échoué.");
      return;
    }
    setSent(true);
    form.reset();
    setMerchantType("physical");
    setVehicle("");
    setFormVersion((version) => version + 1);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {[["merchant", "Créer un vendeur"], ["courier", "Créer un livreur"]].map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => {
              setInviteType(val);
              setSent(false);
              setFormError("");
              setMerchantType("physical");
              setVehicle("");
            }}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition ${
              inviteType === val
                ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        key={`${inviteType}-${formVersion}`}
        className="form panel space-y-4"
        onSubmit={handleSubmit}
      >
        <fieldset className="signup-fieldset">
          <legend className="signup-legend">Identité et coordonnées</legend>
          <div className="signup-grid">
            <label className="signup-label">
              <span>{inviteType === "merchant" ? "Nom du responsable" : "Prénom et nom"} <span className="text-red-400">*</span></span>
              <input name="nom" type="text" required minLength={2} maxLength={100} autoComplete="name" placeholder="Jean Dupont" />
            </label>
            <label className="signup-label">
              <span>Adresse e-mail <span className="text-red-400">*</span></span>
              <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="contact@exemple.fr" />
            </label>
            <label className="signup-label">
              <span>Téléphone <span className="text-red-400">*</span></span>
              <input
                name="telephone"
                type="tel"
                required
                inputMode="numeric"
                autoComplete="tel"
                placeholder="06 12 34 56 78"
                onInput={(event) => {
                  event.currentTarget.value = formatFrenchPhone(event.currentTarget.value);
                  const valid = event.currentTarget.value.replace(/\D/g, "").length === 10;
                  event.currentTarget.setCustomValidity(valid ? "" : "Saisissez un numéro français de 10 chiffres.");
                }}
              />
            </label>
            <label className="signup-label">
              <span>Mot de passe temporaire <span className="text-red-400">*</span></span>
              <input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" />
            </label>
            <FrenchLocationFields />
          </div>
        </fieldset>

        {inviteType === "merchant" && (
          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Informations commerçant</legend>
            <div className="signup-grid">
              <label className="signup-label">
                <span>Nom du commerce <span className="text-red-400">*</span></span>
                <input name="raisonSociale" type="text" required minLength={2} maxLength={120} placeholder="Épicerie des Canuts" />
              </label>
              <label className="signup-label">
                <span>Type d’activité <span className="text-red-400">*</span></span>
                <select name="merchantType" required value={merchantType} onChange={(event) => setMerchantType(event.target.value)}>
                  <option value="physical">Commerce physique</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="mobile">Commerce mobile / itinérant</option>
                </select>
              </label>
              <label>
                <span>Numéro SIRET <span className="text-red-400">*</span></span>
                <input name="siret" type="text" required inputMode="numeric" minLength={14} maxLength={17} placeholder="123 456 789 00012" />
              </label>
              <label>
                <span>Secteur d’activité <span className="text-red-400">*</span></span>
                <input name="secteurActivite" type="text" required placeholder="Alimentation, restauration, mode…" />
              </label>
              {merchantType === "ecommerce" && (
                <label className="signup-label md:col-span-2">
                  <span>Site ou boutique en ligne <span className="text-red-400">*</span></span>
                  <input name="siteWeb" type="url" required placeholder="https://www.exemple.fr" />
                </label>
              )}
              {merchantType === "mobile" && (
                <label className="signup-label md:col-span-2">
                  <span>Marchés ou zones de présence <span className="text-red-400">*</span></span>
                  <input name="zonesPresence" type="text" required placeholder="Marché de la Croix-Rousse, Lyon 4e…" />
                </label>
              )}
            </div>
          </fieldset>
        )}

        {inviteType === "courier" && (
          <>
            <fieldset className="signup-fieldset">
              <legend className="signup-legend">Activité et véhicule</legend>
              <div className="signup-grid">
                <label className="signup-label">
                  <span>Zone de livraison principale <span className="text-red-400">*</span></span>
                  <input name="zoneLivraison" type="text" required placeholder="Lyon 3e et 7e" />
                </label>
                <label className="signup-label">
                  <span>Type de véhicule <span className="text-red-400">*</span></span>
                  <select name="typeVehicule" required value={vehicle} onChange={(event) => setVehicle(event.target.value)}>
                    <option value="" disabled>Choisir un moyen de transport</option>
                    <option value="bike">Vélo / vélo électrique</option>
                    <option value="scooter">Scooter / moto</option>
                    <option value="car">Voiture</option>
                    <option value="van">Utilitaire / fourgon</option>
                    <option value="walk">À pied</option>
                  </select>
                </label>
                {hasPlate && (
                  <>
                    <label className="signup-label">
                      <span>Marque et modèle <span className="text-red-400">*</span></span>
                      <input name="modeleVehicule" type="text" required placeholder="Peugeot Kisbee 125" />
                    </label>
                    <label className="signup-label">
                      <span>Immatriculation <span className="text-red-400">*</span></span>
                      <input name="immatriculation" type="text" required placeholder="AA-123-BB" />
                    </label>
                    <label className="signup-label md:col-span-2">
                      <span>Numéro de permis <span className="text-red-400">*</span></span>
                      <input name="numeroPermis" type="text" required placeholder="Numéro du permis de conduire" />
                    </label>
                  </>
                )}
              </div>
            </fieldset>
            <fieldset className="signup-fieldset">
              <legend className="signup-legend">Statut professionnel</legend>
              <div className="signup-grid">
                <label className="signup-label">
                  <span>Statut juridique <span className="text-red-400">*</span></span>
                  <select name="statutJuridique" required defaultValue="">
                    <option value="" disabled>Choisir un statut</option>
                    <option value="auto_entrepreneur">Auto-entrepreneur</option>
                    <option value="micro_entreprise">Micro-entreprise</option>
                    <option value="societe">EIRL / SASU / Société</option>
                  </select>
                </label>
                <label className="signup-label">
                  <span>Numéro SIRET</span>
                  <input name="siret" type="text" inputMode="numeric" maxLength={17} placeholder="Si applicable" />
                </label>
              </div>
            </fieldset>
          </>
        )}

        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-slate-300">
          <span className="font-bold text-indigo-300 block mb-1">Création directe par un manager</span>
          Le compte sera activé immédiatement. L’utilisateur pourra se connecter avec son e-mail et le mot de passe temporaire renseigné.
        </div>

        {formError && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm font-bold text-red-300">
            {formError}
          </div>
        )}
        {sent && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-emerald-400 font-bold text-sm">
            Compte {inviteType === "merchant" ? "vendeur" : "livreur"} créé et activé avec succès.
          </div>
        )}
        <button className="button w-full" type="submit" disabled={submitting}>
          {submitting ? "Création en cours…" : `Créer le compte ${inviteType === "merchant" ? "vendeur" : "livreur"}`}
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────── DIRECTORY (commerçants/livreurs/managers) ─────────────────────────── */

function Directory({ type, role }) {
  const { viewModel } = useRelayFlow();
  const directoryData = viewModel.directoryData;
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [zone, setZone] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  const rows = directoryData[type] || [];
  const zones = useMemo(() => [...new Set(rows.map((r) => r[3]))], [rows]);

  const filtered = useMemo(
    () =>
      [...rows]
        .filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase()))
        .filter((r) => zone === "all" || r[3] === zone)
        .sort((a, b) => (sort === "zone" ? a[3].localeCompare(b[3]) : a[1].localeCompare(b[1]))),
    [rows, query, sort, zone],
  );

  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const start = (page - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(start, start + itemsPerPage);

  const labels =
    type === "managers"
      ? ["Référence", "Manager", "E-mail", "Périmètre"]
      : type === "merchants"
        ? ["Référence", "Commerce", "E-mail", "Ville"]
        : ["Référence", "Livreur", "E-mail", "Zone"];

  return (
    <>
      <div className="panel table-panel">
        <div className="directory-toolbar">
        <input
          aria-label="Rechercher"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          placeholder={`Rechercher un ${type === "merchants" ? "commerçant" : type === "couriers" ? "livreur" : "manager"}…`}
        />
        <select
          aria-label="Filtrer par zone"
          value={zone}
          onChange={(e) => { setZone(e.target.value); setPage(1); }}
        >
          <option value="all">Toutes les zones</option>
          {zones.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select aria-label="Trier" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name">Trier par nom</option>
          <option value="zone">Trier par zone</option>
        </select>
        <span>{filtered.length} résultat(s)</span>
        {(query || zone !== "all") && (
          <button
            type="button"
            onClick={() => { setQuery(""); setZone("all"); setPage(1); }}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="table">
        <div className="row table-head">
          {labels.map((x) => <span key={x}>{x}</span>)}
        </div>
        {paginatedItems.map((r) => (
          <div
            className="row cursor-pointer hover:bg-white/5 transition-colors"
            key={r[0]}
            onClick={() => setSelectedUser(r)}
          >
            <span className="font-mono text-indigo-300 font-semibold">{r[0]}</span>
            <span className="font-semibold text-white">{r[1]}</span>
            <span className="text-slate-300">{r[2]}</span>
            <span className="text-slate-400">{r[3]}</span>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 px-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-200 disabled:opacity-40 hover:bg-white/10"
          >
            Précédent
          </button>
          <span className="text-xs text-slate-400 font-medium">Page {page} sur {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-200 disabled:opacity-40 hover:bg-white/10"
          >
            Suivant
          </button>
        </div>
      )}
      </div>

      {selectedUser && (
        <UserDetailModal user={selectedUser} type={type} role={role} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
}

/* ─────────────────────────── MODAL UTILISATEUR (super_manager / manager) ─────────────────────────── */

function UserDetailModal({ user, type, role, onClose }) {
  const { api, session, state } = useRelayFlow();
  const [actionMessage, setActionMessage] = useState("");
  const isCourier = type === "couriers";
  const isMerchant = type === "merchants";
  const account = state?.comptes?.find((item) => item._id === user[7]);
  const actorDeliveries = isCourier
    ? (state?.livraisons || []).filter((item) => item.livreurId === user[0])
    : isMerchant
      ? (state?.livraisons || []).filter((item) => item.vendeurId === user[0])
      : [];
  const delivered = actorDeliveries.filter((item) => item.statut === "LIVREE");
  const failed = actorDeliveries.filter((item) => item.statut === "ECHOUEE");
  const evaluations = (state?.evaluations || []).filter((item) =>
    isCourier ? item.livreurId === user[0] : item.vendeurId === user[0] && item.cibleType === "vendeur"
  );
  const averageRating = evaluations.length
    ? evaluations.reduce((sum, item) => sum + Number(item.note || 0), 0) / evaluations.length
    : null;
  const issueCount = (state?.signalements || []).filter((issue) => {
    const delivery = state?.livraisons?.find((item) => item._id === issue.livraisonId);
    return isCourier
      ? delivery?.livreurId === user[0]
      : isMerchant
        ? delivery?.vendeurId === user[0]
      : issue.gestionnaireAssigneId === user[0];
  }).length;
  const managerIssues = !isCourier && !isMerchant
    ? (state?.signalements || []).filter((issue) => issue.gestionnaireAssigneId === user[0])
    : [];
  const managedApplications = !isCourier && !isMerchant
    ? (state?.applications || []).filter((application) => application.traiteParManagerId === user[0])
    : [];
  const activityRecords = isCourier || isMerchant ? actorDeliveries : managerIssues;
  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date).replace(".", ""),
    };
  });
  const months = monthBuckets.map((item) => item.label);
  const chartData = monthBuckets.map((bucket) =>
    activityRecords.filter((record) => {
      const date = new Date(record.dateSoumission || record.dateCreation);
      return `${date.getFullYear()}-${date.getMonth()}` === bucket.key;
    }).length
  );
  const maxVal = Math.max(1, ...chartData);
  const recentActivity = isCourier || isMerchant
    ? [...actorDeliveries]
        .sort((a, b) => new Date(b.dateSoumission || 0) - new Date(a.dateSoumission || 0))
        .slice(0, 3)
        .map((delivery) => [
          delivery.numeroSuivi,
          STATUT_LIVRAISON_LABEL[delivery.statut] || delivery.statut,
          `${delivery.client?.prenom || ""} ${delivery.client?.nom || ""} · ${delivery.villeLivraison || "—"}`.trim(),
        ])
    : [...managerIssues]
        .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0))
        .slice(0, 3)
        .map((issue) => [
          issue.ref || issue._id,
          issue.statut,
          issue.description,
        ]);
  const successRate = actorDeliveries.length
    ? Math.round((delivered.length / Math.max(1, delivered.length + failed.length)) * 100)
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm flex items-start justify-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <article
        className="my-8 w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0d172b] p-5 shadow-2xl md:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[0.68rem] font-extrabold uppercase border bg-indigo-500/15 text-indigo-300 border-indigo-500/30">
              {isMerchant ? "COMMERÇANT" : isCourier ? "LIVREUR" : "MANAGER"}
            </span>
            <h2 className="m-0 mt-2 text-2xl font-black text-white">{user[1]}</h2>
            <p className="mt-0.5 text-xs text-slate-400 font-mono">Référence ID : {user[0]}</p>
          </div>
          <button
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10 shrink-0"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>

        {/* Infos + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Coordonnées & Infos</p>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <dt className="text-slate-400">{isCourier ? "E-mail :" : "E-mail pro :"}</dt>
                <dd className="font-medium text-indigo-300">{user[2]}</dd>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <dt className="text-slate-400">{isCourier ? "Zone :" : isMerchant ? "Zone :" : "Périmètre :"}</dt>
                <dd className="font-medium text-slate-200">{user[3]}</dd>
              </div>
              {user[4] && (
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <dt className="text-slate-400">Téléphone :</dt>
                  <dd className="font-medium text-slate-200">{user[4]}</dd>
                </div>
              )}
              {user[5] && (
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <dt className="text-slate-400">{isCourier ? "Véhicule :" : isMerchant ? "Volume :" : "Rôle :"}</dt>
                  <dd className={`font-bold ${isCourier ? "text-amber-300" : "text-slate-200"}`}>{user[5]}</dd>
                </div>
              )}
              {user[6] && (
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <dt className="text-slate-400">{isCourier ? "Activité :" : isMerchant ? "Adresse / Horaires :" : "Depuis :"}</dt>
                  <dd className="font-medium text-slate-300 text-right max-w-32">{user[6]}</dd>
                </div>
              )}
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <dt className="text-slate-400">Statut du compte :</dt>
                <dd className={`font-bold ${account?.statutCompte === "actif" ? "text-emerald-400" : "text-amber-300"}`}>
                  {account?.statutCompte || "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Inscrit depuis :</dt>
                <dd className="font-medium text-slate-300">
                  {account?.dateCreation ? new Date(account.dateCreation).toLocaleDateString("fr-FR") : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Statistiques Clés</p>
            <dl className="grid grid-cols-2 gap-2 text-center">
              {(isCourier || isMerchant
                ? [
                    ["Livraisons totales", String(actorDeliveries.length)],
                    ["Taux réussite", `${successRate}%`],
                    ["Note moyenne", averageRating ? `${averageRating.toFixed(1)} / 5` : "Non noté"],
                    ["Incidents", String(issueCount)],
                  ]
                : [
                    ["Demandes traitées", String(managedApplications.length)],
                    ["Dossiers assignés", String(managerIssues.length)],
                    ["Dossiers ouverts", String(managerIssues.filter((issue) => !["resolu", "rejete"].includes(issue.statut)).length)],
                    ["Statut", account?.statutCompte || "—"],
                  ]
              ).map(([label, val]) => (
                <div key={label} className="rounded-lg bg-black/20 p-2 border border-white/5">
                  <dt className="text-[0.63rem] text-slate-400 uppercase font-bold leading-tight">{label}</dt>
                  <dd className={`text-lg font-black mt-0.5 ${
                    label === "Taux réussite" ? "text-emerald-400"
                    : label === "Note moyenne" ? "text-amber-300"
                    : "text-white"
                  }`}>{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Graphique */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Volume d'activité (6 derniers mois)</p>
            <span className="text-[0.68rem] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Données enregistrées
            </span>
          </div>
          <div className="h-28 flex items-end justify-between gap-2 px-1">
            {chartData.map((val, i) => {
              const heightPct = Math.round((val / maxVal) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-[0.65rem] font-bold text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                  <div className="w-full bg-slate-800 rounded-t-md overflow-hidden h-20 flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-purple-400 transition-all rounded-t-md"
                    />
                  </div>
                  <span className="text-[0.65rem] font-medium text-slate-400">{months[i]}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/10">
            {[["Taux de réussite", `${successRate}%`, "emerald"], ["Note moyenne", averageRating ? `${Math.round((averageRating / 5) * 100)}%` : "0%", "indigo"]].map(([label, val, color]) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">{label}</span>
                  <span className={`font-bold text-${color}-400`}>{val}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800">
                  <div className={`h-1.5 rounded-full bg-${color}-400`} style={{ width: val }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activité récente */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            {isCourier ? "Dernières livraisons" : isMerchant ? "Dernières commandes" : "Derniers dossiers"}
          </p>
          <div className="space-y-2">
            {recentActivity.map(([id, status, info], index) => (
              <div key={`${id}-${index}`} className="flex items-center justify-between text-xs rounded-lg bg-black/20 px-3 py-2 border border-white/5">
                <div>
                  <span className="font-mono text-indigo-300 font-bold">{id}</span>
                  <span className="text-slate-400 ml-2">{info}</span>
                </div>
                <span className={`pill ${getStatusColor(status)}`}>{status}</span>
              </div>
            ))}
            {!recentActivity.length && <p className="text-xs text-slate-500">Aucune livraison liée à cet acteur.</p>}
          </div>
        </div>

        {/* Actions super_manager */}
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            className="small danger text-xs"
            type="button"
            onClick={() => {
              const result = api.suspendreCompte(session?.compteId, user[7]);
              setActionMessage(result.ok ? "Compte suspendu." : "Suspension non autorisée.");
            }}
          >
            Suspendre le compte
          </button>
          {String(user[2] || "").includes("@") ? (
            <a className="small text-xs" href={`mailto:${user[2]}`}>Contacter par e-mail</a>
          ) : (
            <button className="small text-xs" type="button" disabled title="Aucune adresse e-mail disponible">
              E-mail indisponible
            </button>
          )}
          {(isCourier || isMerchant) && (
            <Link
              className="small text-xs"
              href={`/${role}/deliveries?actorType=${isCourier ? "courier" : "merchant"}&actorId=${encodeURIComponent(user[0])}`}
            >
              Voir toutes les livraisons
            </Link>
          )}
          {actionMessage && <span className="w-full text-xs font-bold text-slate-300">{actionMessage}</span>}
        </div>
      </article>
    </div>
  );
}

/* ─────────────────────────── LIVRAISONS DISPONIBLES (livreur) ─────────────────────────── */

function DeliverySearch() {
  const { session, api, viewModel } = useRelayFlow();
  const availableDeliveries = viewModel.availableDeliveries;
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("distance");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [actionMsg, setActionMsg] = useState("");

  const filtered = useMemo(
    () =>
      [...availableDeliveries]
        .filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (sort === "distance" ? a[5] - b[5] : a[3].localeCompare(b[3]))),
    [availableDeliveries, query, sort],
  );

  const acceptOffer = (livraisonId, ref) => {
    if (!session) return;
    const r = api.acceptOffer(session.compteId, livraisonId);
    setActionMsg(
      r.ok
        ? r.candidature
          ? `✓ Candidature envoyée pour ${ref}`
          : `✓ ${ref} acceptée`
        : r.error
    );
  };

  return (
    <>
      {actionMsg && <p className="text-sm font-bold text-emerald-400">{actionMsg}</p>}
      <div className="directory-toolbar">
        <input aria-label="Rechercher une livraison" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ville, commerçant ou référence…" />
        <select aria-label="Trier par" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="distance">Trier par proximité</option>
          <option value="mode">Trier par mode</option>
        </select>
      </div>
      <div className="cards">
        {filtered.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucune offre disponible actuellement.</p>
        ) : (
          filtered.map(([ref, zone, merchant, mode, livraisonId, distance, outsideZone, allocation, , courierGain]) => (
            <article className="panel action-card" key={livraisonId}>
              <div className="flex items-center justify-between gap-3">
                <span className="mini-label">{mode}</span>
                <strong className="text-sm text-emerald-400">
                  +{Number(courierGain || 0).toFixed(2).replace(".", ",")} €
                </strong>
              </div>
              <h2>{ref}</h2>
              <p>{merchant} · {zone}</p>
              <small className={outsideZone ? "text-amber-300" : "text-emerald-300"}>
                {outsideZone ? "Suggestion proche hors zone" : "Dans une zone couverte"} · {distance.toFixed(1)} km
              </small>
              <small className="mt-1 block text-slate-400">
                Gain acquis après confirmation de la livraison.
              </small>
              <div className="flex gap-2 mt-2">
                <button className="small good" onClick={() => acceptOffer(livraisonId, ref)}>
                  {allocation === "validation_vendeur" ? "Candidater" : "Accepter"}
                </button>
                <button className="small" onClick={() => setSelectedDelivery([ref, merchant, zone, "Disponible", "green", null, null, null, livraisonId])}>Détails</button>
              </div>
            </article>
          ))
        )}
      </div>
      {selectedDelivery && (
        <DeliveryModal delivery={selectedDelivery} role="courier" onClose={() => setSelectedDelivery(null)} />
      )}
    </>
  );
}

/* ─────────────────────────── DEMANDES D'ADHÉSION ─────────────────────────── */

function ApplicationsManager() {
  const { api, viewModel, session } = useRelayFlow();
  const applicationsData = viewModel.applicationsData;
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [states, setStates] = useState({});

  const zones = useMemo(() => [...new Set(applicationsData.map((a) => a.zone))], [applicationsData]);
  const statuses = useMemo(() => [...new Set(applicationsData.map((a) => a.status))], [applicationsData]);

  const setCardState = (id, value) => setStates((s) => ({ ...s, [id]: value }));

  const filtered = useMemo(() => {
    return applicationsData
      .filter((app) => {
        const text = `${app.id} ${app.name} ${app.applicant} ${app.subtitle} ${app.zone} ${app.email}`.toLowerCase();
        return text.includes(query.toLowerCase());
      })
      .filter((app) => typeFilter === "all" || app.type === typeFilter)
      .filter((app) => zoneFilter === "all" || app.zone === zoneFilter)
      .filter((app) => statusFilter === "all" || app.status === statusFilter)
      .sort((a, b) => {
        if (sort === "recent") return new Date(b.date) - new Date(a.date);
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "type") return a.type.localeCompare(b.type);
        if (sort === "id") return a.id.localeCompare(b.id);
        return 0;
      });
  }, [applicationsData, query, typeFilter, zoneFilter, statusFilter, sort]);

  const merchantCount = applicationsData.filter((a) => a.type === "merchant").length;
  const courierCount = applicationsData.filter((a) => a.type === "courier").length;

  return (
    <section className="space-y-4">
      {/* Filtres rapides par type */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap gap-2">
          {[
            ["all", `Tous (${applicationsData.length})`, "indigo"],
            ["merchant", `Commerçants (${merchantCount})`, "emerald"],
            ["courier", `Livreurs (${courierCount})`, "purple"],
          ].map(([val, label, color]) => (
            <button
              key={val}
              type="button"
              onClick={() => setTypeFilter(val)}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                typeFilter === val
                  ? `bg-${color}-600 text-white shadow-lg shadow-${color}-600/30`
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} demande(s)</span>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="directory-toolbar">
        <input
          aria-label="Rechercher"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom, ID, secteur, zone ou e-mail…"
        />
        <select aria-label="Zone" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
          <option value="all">Toutes les zones</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
        <select aria-label="Statut" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tous les statuts</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select aria-label="Trier" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recent">Plus récent</option>
          <option value="name">Par nom</option>
          <option value="type">Par type</option>
          <option value="id">Par référence</option>
        </select>
        {(query || typeFilter !== "all" || zoneFilter !== "all" || statusFilter !== "all") && (
          <button
            type="button"
            onClick={() => { setQuery(""); setTypeFilter("all"); setZoneFilter("all"); setStatusFilter("all"); }}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-slate-400 text-sm">Aucune demande ne correspond à vos critères.</p>
        </div>
      ) : (
        <div className="cards">
          {filtered.map((app) => {
            const currentState = states[app.id] || app.status;
            const isAccepted = currentState === "Demande acceptée";
            const isRefused = currentState === "Demande refusée";
            return (
              <article className="panel flex flex-col justify-between relative overflow-hidden transition-all hover:border-indigo-400/30 hover:shadow-lg hover:shadow-indigo-900/10 p-0" key={app.id}>
                {/* Colored accent line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${app.type === "merchant" ? "bg-emerald-500" : "bg-purple-500"}`} />
                
                <div className="p-5 pl-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md bg-white/5 border border-white/10 text-xs`}>
                        {app.type === "merchant" ? "🏪" : "🚴"}
                      </span>
                      <span className="font-mono text-[0.65rem] tracking-wider text-slate-400 font-bold uppercase">
                        {app.id}
                      </span>
                    </div>
                    <span className={`text-[0.66rem] font-bold px-2.5 py-1 rounded-full border ${
                      isAccepted ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : isRefused ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {currentState}
                    </span>
                  </div>

                  <h2 className="text-lg font-black text-white mb-1 tracking-tight">{app.name}</h2>
                  <p className="text-xs text-slate-400 font-medium mb-4">{app.subtitle}</p>
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                      <span className="text-slate-500 font-medium">Demandeur</span>
                      <span className="text-slate-200 font-semibold">{app.applicant}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                      <span className="text-slate-500 font-medium">Zone</span>
                      <span className="text-slate-200 font-semibold">{app.zone}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-1">
                      <span className="text-slate-500 font-medium">Dossier</span>
                      <span className="text-slate-200 font-semibold">{app.documents.length} pièces jointes</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-900/50 p-3 px-4 border-t border-white/5 flex items-center justify-end gap-2">
                  <Link className="small flex-1 text-center bg-white/5 hover:bg-white/10 border-white/10" href={`/manager/applications/${app.id}`}>
                    Ouvrir le dossier
                  </Link>
                  {!isAccepted && !isRefused && (
                    <>
                      <button
                        type="button"
                        className="small good m-0 flex-1"
                        onClick={async () => {
                          const result = await api.decideApplication(session?.compteId, app.applicationId || app.id, "acceptee", "Dossier validé");
                          if (result.ok) setCardState(app.id, "Demande acceptée");
                        }}
                      >
                        Valider
                      </button>
                      <button
                        type="button"
                        className="small danger m-0"
                        onClick={async () => {
                          const result = await api.decideApplication(session?.compteId, app.applicationId || app.id, "rejetee", "Dossier refusé");
                          if (result.ok) setCardState(app.id, "Demande refusée");
                        }}
                      >
                        Rejeter
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CourierDeliveries() {
  const { viewModel, state } = useRelayFlow();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const deliveries = [...viewModel.livraisons].sort(
    (a, b) => new Date(b.dateSoumission || 0) - new Date(a.dateSoumission || 0)
  );

  const filtered = deliveries.filter((delivery) => {
    const seller = state?.vendeurs?.find((item) => item._id === delivery.vendeurId);
    const matchesQuery = `${delivery.numeroSuivi} ${seller?.raisonSociale || ""} ${
      delivery.client?.adresse || ""
    } ${delivery.client?.nom || ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && ["ACCEPTEE", "RETIREE"].includes(delivery.statut)) ||
      (filter === "completed" && delivery.statut === "LIVREE") ||
      (filter === "failed" && delivery.statut === "ECHOUEE");
    return matchesQuery && matchesFilter;
  });

  const openDelivery = (delivery) => {
    const row = viewModel.allDeliveriesData.find((item) => item[8] === delivery._id);
    if (row) setSelectedDelivery(row);
  };

  const nextStep = (status) => {
    if (status === "ACCEPTEE") return "Retrait à confirmer";
    if (status === "RETIREE") return "Remise à effectuer";
    if (status === "LIVREE") return "Course terminée";
    if (status === "ECHOUEE") return "Livraison échouée";
    return "À consulter";
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <span className="mini-label">En cours</span>
          <strong className="mt-2 block text-2xl text-white">
            {deliveries.filter((delivery) => ["ACCEPTEE", "RETIREE"].includes(delivery.statut)).length}
          </strong>
        </div>
        <div className="panel p-4">
          <span className="mini-label">Terminées</span>
          <strong className="mt-2 block text-2xl text-white">
            {deliveries.filter((delivery) => delivery.statut === "LIVREE").length}
          </strong>
        </div>
        <div className="panel p-4">
          <span className="mini-label">Total</span>
          <strong className="mt-2 block text-2xl text-white">{deliveries.length}</strong>
        </div>
      </div>

      <div className="directory-toolbar mt-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Référence, commerce, client ou adresse…"
        />
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">Toutes les livraisons</option>
          <option value="active">En cours</option>
          <option value="completed">Terminées</option>
          <option value="failed">Échouées</option>
        </select>
      </div>

      {filtered.length ? (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((delivery) => {
            const seller = state?.vendeurs?.find((item) => item._id === delivery.vendeurId);
            const statusLabel = STATUT_LIVRAISON_LABEL[delivery.statut] || delivery.statut;
            const active = ["ACCEPTEE", "RETIREE"].includes(delivery.statut);
            const economy = delivery.economie || economieLivraison(delivery.modePriseEnCharge);
            return (
              <article
                key={delivery._id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0b1324] transition hover:border-indigo-400/40"
              >
                <div className={`h-1 ${
                  delivery.statut === "LIVREE"
                    ? "bg-emerald-500"
                    : delivery.statut === "ECHOUEE"
                      ? "bg-red-500"
                      : delivery.statut === "RETIREE"
                        ? "bg-amber-400"
                        : "bg-indigo-500"
                }`} />
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-mono text-sm font-black text-indigo-200">
                        {delivery.numeroSuivi}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">
                        Créée le {new Date(delivery.dateSoumission).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className={`pill ${getStatusColor(statusLabel)}`}>{statusLabel}</span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <span className="mini-label">Retrait</span>
                      <b className="mt-1 block text-sm text-white">
                        {seller?.raisonSociale || "Commerce"}
                      </b>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {[seller?.adresse, seller?.ville].filter(Boolean).join(", ") || "Adresse non renseignée"}
                      </p>
                    </div>
                    <div>
                      <span className="mini-label">Livraison</span>
                      <b className="mt-1 block text-sm text-white">
                        {delivery.client?.prenom} {delivery.client?.nom}
                      </b>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {delivery.client?.adresse || delivery.villeLivraison}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <div>
                      <span className="mini-label">Prochaine étape</span>
                      <b className={`mt-1 block text-sm ${active ? "text-indigo-200" : "text-slate-300"}`}>
                        {nextStep(delivery.statut)}
                      </b>
                    </div>
                    <div>
                      <span className="mini-label">Rémunération</span>
                      <b className="mt-1 block text-sm text-emerald-400">
                        +{economy.remunerationLivreur.toFixed(2).replace(".", ",")} €
                        {delivery.statut === "LIVREE" ? " acquise" : " prévue"}
                      </b>
                    </div>
                    <button
                      type="button"
                      className={`small ${active ? "good" : ""}`}
                      onClick={() => openDelivery(delivery)}
                    >
                      {active ? "Gérer la livraison" : "Voir les détails"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel mt-4 p-8 text-center text-sm text-slate-400">
          Aucune livraison ne correspond à ces critères.
        </div>
      )}

      {selectedDelivery && (
        <DeliveryModal
          delivery={selectedDelivery}
          role="courier"
          onClose={() => setSelectedDelivery(null)}
        />
      )}
    </>
  );
}

/* ─────────────────────────── CARDS (incidents) ─────────────────────────── */

function Cards({ type, role }) {
  const { viewModel, state, session, api } = useRelayFlow();
  const issuesData = viewModel.issuesData;
  const myDeliveries = viewModel.myDeliveries;
  const [states, setStates] = useState({});
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("id-desc");

  const items = type === "issues" ? issuesData : myDeliveries;
  const set = (id, value) => setStates((s) => ({ ...s, [id]: value }));

  const filteredItems = items.filter((item) => {
    const [id, title, subtitle, label, merchant, dest] = item;
    const currentLabel = states[id] || label || title;

    const textToSearch = `${id} ${title} ${subtitle} ${label || ""} ${merchant || ""} ${dest || ""}`.toLowerCase();
    const matchSearch = searchQuery.trim() === "" || textToSearch.includes(searchQuery.toLowerCase());

    let matchStatus = true;
    if (statusFilter !== "all") {
      if (type === "issues") {
        if (statusFilter === "urgent") matchStatus = currentLabel.toLowerCase().includes("élevée") || currentLabel.toLowerCase().includes("urgent");
        else if (statusFilter === "contact") matchStatus = currentLabel.toLowerCase().includes("contacter") || currentLabel.toLowerCase().includes("cours");
        else if (statusFilter === "resolved") matchStatus = currentLabel.toLowerCase().includes("résolu");
        else if (statusFilter === "suspended") matchStatus = currentLabel.toLowerCase().includes("suspendu");
      } else {
        matchStatus = currentLabel.toLowerCase().includes(statusFilter.toLowerCase());
      }
    }

    return matchSearch && matchStatus;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    const dateA = new Date(a[8] || 0).getTime();
    const dateB = new Date(b[8] || 0).getTime();
    if (sortBy === "id-desc") return dateB - dateA;
    if (sortBy === "id-asc") return dateA - dateB;
    if (sortBy === "merchant") return (a[3] || a[1] || "").localeCompare(b[3] || b[1] || "");
    if (type === "issues" && sortBy === "priority") {
      const isAUrgent = (states[a[0]] || a[3]).includes("élevée") ? 1 : 0;
      const isBUrgent = (states[b[0]] || b[3]).includes("élevée") ? 1 : 0;
      return isBUrgent - isAUrgent;
    }
    return 0;
  });

  return (
    <>
      {/* Barre de recherche et de filtres pour Incidents ET Mes Livraisons */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-white/10 shadow-lg backdrop-blur-md">
          {/* Recherche */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder={type === "issues" ? "Rechercher par ID (ex: INC-042), motif, commerce..." : "Rechercher une livraison (ex: LIV-2026-042, commerce, adresse)..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 pr-8 py-2 bg-black/40 border border-white/15 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold bg-white/10 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtres & Tri */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-xs font-semibold text-slate-200 outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              {type === "issues" ? (
                <>
                  <option value="urgent">Priorité élevée / Urgent</option>
                  <option value="contact">À contacter</option>
                  <option value="resolved">Résolus</option>
                  <option value="suspended">Comptes suspendus</option>
                </>
              ) : (
                <>
                  <option value="retrait">Retrait confirmé</option>
                  <option value="livraison">En livraison</option>
                  <option value="livrée">Livrées</option>
                </>
              )}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-xs font-semibold text-slate-200 outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="id-desc">Plus récent d’abord</option>
              <option value="id-asc">Plus ancien d’abord</option>
              <option value="merchant">Par Commerce</option>
              {type === "issues" && <option value="priority">Par Priorité</option>}
            </select>
          </div>
        </div>

        {/* Synthèse des résultats */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Affichage de <b className="text-white">{sortedItems.length}</b> sur <b className="text-slate-300">{items.length}</b> {type === "issues" ? "incident(s)" : "livraison(s)"}
          </span>
          {(searchQuery || statusFilter !== "all" || sortBy !== "id-desc") && (
            <button
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); setSortBy("id-desc"); }}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-white/10 bg-black/20">
          <h3 className="text-lg font-bold text-white mb-1">Aucun résultat trouvé</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
            Aucune donnée ne correspond à votre recherche ou aux filtres sélectionnés.
          </p>
          <button
            onClick={() => { setSearchQuery(""); setStatusFilter("all"); setSortBy("id-desc"); }}
            className="button small font-bold"
          >
            Réinitialiser la recherche
          </button>
        </div>
      ) : (
        <div className="cards">
          {sortedItems.map((item) => {
            const [id, title, subtitle, merchant, dest, courier] = item;
            const currentLabel = states[id] || (type === "issues" ? item[3] : title);
            const color = getStatusColor(currentLabel);

            if (type === "mine") {
              return (
                <article
                  className="panel action-card flex flex-col justify-between cursor-pointer hover:border-indigo-400/50 transition-all p-5 border border-white/10 rounded-xl bg-[#0b1324] relative overflow-hidden group"
                  key={id}
                  onClick={() =>
                    setSelectedDelivery([
                      id,
                      merchant || title,
                      dest || subtitle,
                      currentLabel,
                      color,
                      "Lucas Martin",
                    ])
                  }
                >
                  {/* Indicateur d'état */}
                  <div className={`absolute left-0 right-0 top-0 h-1 ${
                    currentLabel.toLowerCase().includes("livrée") ? "bg-emerald-500"
                    : currentLabel.toLowerCase().includes("retrait") ? "bg-amber-500"
                    : "bg-indigo-500"
                  }`} />

                  <div className="space-y-4">
                    {/* Header: ID + Status */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black tracking-wider text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-500/30 shadow-inner">
                          {id}
                        </span>
                        <span className="text-[0.68rem] text-slate-400 font-semibold">Course attribuée</span>
                      </div>
                      <span className={`pill ${getStatusColor(currentLabel)} font-black text-[0.7rem] uppercase tracking-wider`}>
                        {currentLabel}
                      </span>
                    </div>

                    <div className="rounded-lg border border-white/8 bg-black/20 p-4 space-y-3">
                      <div className="flex items-start">
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-wider m-0">Point de retrait</p>
                          <p className="text-xs font-bold text-white m-0 group-hover:text-indigo-300 transition-colors truncate">
                            {merchant || title}
                          </p>
                        </div>
                      </div>

                      <div className="h-px bg-white/8" />
                      <div className="flex items-start">
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-wider m-0">Adresse client</p>
                          <p className="text-xs font-bold text-slate-200 m-0 truncate">
                            {dest || subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="button small good m-0 flex-1 text-xs font-bold py-2.5 shadow-lg shadow-emerald-950/40"
                      onClick={() => set(id, currentLabel === "Retrait confirmé" ? "En livraison" : "Livrée")}
                    >
                      {currentLabel === "Retrait confirmé" ? "Commencer le trajet" : currentLabel === "En livraison" ? "Confirmer la remise" : "Course terminée"}
                    </button>
                    <button
                      className="small m-0 text-xs font-bold py-2.5 px-3 bg-white/5 hover:bg-white/10 border-white/15 text-slate-300 hover:text-white"
                      onClick={() =>
                        setSelectedDelivery([
                          id,
                          merchant || title,
                          dest || subtitle,
                          currentLabel,
                          color,
                          "Lucas Martin",
                        ])
                      }
                    >
                      Détails
                    </button>
                  </div>
                </article>
              );
            }

            return (
              <article
                className="incident-card"
                key={id}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = `/${role}/issues/${id}`;
                  }
                }}
              >
                <div className={`incident-card__accent ${
                  currentLabel.toLowerCase().includes("résolu") ? "bg-emerald-500"
                  : currentLabel.toLowerCase().includes("suspendu") ? "bg-red-600"
                  : currentLabel.toLowerCase().includes("élevée") || currentLabel.toLowerCase().includes("urgent") ? "bg-red-500"
                  : "bg-amber-500"
                }`} />

                <div className="incident-card__header">
                  <div>
                    <span className="incident-card__kind">
                      {role === "super_manager" ? "Incident réseau" : "Signalement"}
                    </span>
                    <span className="incident-card__reference">{id}</span>
                  </div>
                  <span className={`pill ${getStatusColor(currentLabel)} font-extrabold text-[0.7rem]`}>
                      {currentLabel}
                  </span>
                </div>

                <div className="incident-card__body">
                  <h3>{title.replace(/_/g, " ")}</h3>
                  <p>{subtitle || "Aucune description fournie."}</p>
                  <dl className="incident-card__meta">
                    <div>
                      <dt>Compte concerné</dt>
                      <dd>{item[4] || "Non renseigné"}</dd>
                    </div>
                    <div>
                      <dt>Localisation</dt>
                      <dd>{item[5] || "Non renseignée"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="incident-card__actions" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/${role}/issues/${id}`}
                    className="incident-card__primary"
                  >
                    Ouvrir le dossier
                  </Link>
                  <button
                    className="incident-card__secondary"
                    onClick={() => {
                      const raw = state?.signalements?.find((entry) => entry._id === item[6] || entry.ref === id);
                      const result = raw && session
                        ? api.traiterSignalement(raw._id, session.compteId, "resolu", "Incident résolu depuis la liste")
                        : { ok: false };
                      set(id, result.ok ? "Résolu" : "Action impossible");
                    }}
                  >
                    Résoudre
                  </button>
                  <button
                    className="incident-card__danger"
                    onClick={() => {
                      const raw = state?.signalements?.find((entry) => entry._id === item[6] || entry.ref === id);
                      const result = raw?.auteurId
                        ? api.suspendreCompte(session?.compteId, raw.auteurId)
                        : { ok: false };
                      set(id, result.ok ? "Compte suspendu" : "Action impossible");
                    }}
                  >
                    Suspendre
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedDelivery && (
        <DeliveryModal
          delivery={selectedDelivery}
          role={role}
          onClose={() => setSelectedDelivery(null)}
        />
      )}
    </>
  );
}

/* ─────────────────────────── STATUT LIVREUR ─────────────────────────── */

function CourierStatus() {
  const { viewModel, session, api } = useRelayFlow();
  const courier = viewModel.profile?.type === "livreur" ? viewModel.profile : null;
  const [online, setOnline] = useState(courier?.statutOperationnel === "disponible");
  const [location, setLocation] = useState(false);
  const [coords, setCoords] = useState(courier?.coordonnees || null);
  const [radius, setRadius] = useState(String(courier?.rayonRechercheKm || 5));
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    if (!courier) return;
    setOnline(courier.statutOperationnel === "disponible");
    setRadius(String(courier.rayonRechercheKm || 5));
    if (courier.partagePositionActif && courier.coordonnees) {
      setCoords(courier.coordonnees);
      setLocation(true);
    } else {
      setLocation(false);
    }
  }, [courier?.statutOperationnel, courier?.rayonRechercheKm, courier?.coordonnees, courier?.partagePositionActif]);

  const handleOnlineToggle = () => {
    const next = !online;
    const result = api.setStatutOperationnel(
      session?.compteId,
      next ? "disponible" : "indisponible"
    );
    if (result.ok) setOnline(next);
    else setLocationError("Le statut n’a pas pu être enregistré.");
  };

  const updateRadius = (value) => {
    const result = api.updateLivreurPreferences(session?.compteId, {
      rayonRechercheKm: Number(value),
    });
    if (result.ok) {
      setRadius(value);
      setLocationError("");
    } else {
      setLocationError(result.error);
    }
  };

  const requestLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return setLocationError("La géolocalisation n'est pas supportée sur cet appareil.");
    }
    setLocationError("Demande d'autorisation GPS en cours…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const c = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCoords(c);
        setLocation(true);
        setLocationError("");
        api.updateLivreurCoords(session?.compteId, c);
      },
      (error) => {
        const messages = {
          1: "Permission refusée : autorisez la géolocalisation dans votre navigateur.",
          2: "Position GPS indisponible.",
          3: "Délai d'attente expiré lors du calcul de position GPS.",
        };
        setLocationError(messages[error.code] || "Erreur de géolocalisation.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopLocation = () => {
    const result = api.stopLivreurLocationSharing(session?.compteId);
    if (result.ok) {
      setCoords(null);
      setLocation(false);
      setLocationError("Le partage est arrêté. Aucun temps d’arrivée en direct ne sera affiché.");
    } else {
      setLocationError(result.error || "Le partage de position n’a pas pu être arrêté.");
    }
  };

  return (
    <section className="status-panel panel">
      <div className="status-hero">
        <div>
          <p className="eyebrow">STATUT & DISPONIBILITÉ</p>
          <h2>{online ? "Vous êtes disponible" : "Vous êtes indisponible"}</h2>
          <p>
            {online
              ? "Vous recevez actuellement des propositions de livraison à proximité."
              : "Aucune nouvelle livraison ne vous sera proposée."}
          </p>
        </div>
        <button
          onClick={handleOnlineToggle}
          className={`status-toggle ${online ? "is-on" : ""}`}
          aria-label="Changer la disponibilité"
        >
          <i />
        </button>
      </div>
      <div className="status-settings space-y-4 p-5">
        <label className="block space-y-1">
          <span className="text-xs font-bold text-slate-300">Zone de recherche automatique</span>
          <select
            value={radius}
            onChange={(e) => updateRadius(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            <option value="3">Jusqu'à 3 km</option>
            <option value="5">Jusqu'à 5 km</option>
            <option value="10">Jusqu'à 10 km</option>
            <option value="20">Jusqu'à 20 km</option>
          </select>
          <small className="block text-[0.72rem] text-slate-400">
            Vous pourrez toujours consulter les livraisons plus éloignées manuellement.
          </small>
        </label>
        <div className="location-row pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div>
            <b className="text-sm text-white block">Partager ma position en direct (GPS)</b>
            <p className="text-xs text-slate-400">
              {location && coords
                ? `📍 Position GPS : ${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E`
                : "Sans partage, les autres acteurs voient uniquement les étapes et l'horaire prévu."}
            </p>
          </div>
          <button
            className={`small ${location ? "good" : ""}`}
            onClick={location ? stopLocation : requestLocation}
          >
            {location ? "Arrêter le partage" : "Autoriser et partager ma position"}
          </button>
        </div>
        {locationError && <p className="text-xs text-amber-300 font-medium m-0">{locationError}</p>}
      </div>
    </section>
  );
}

function IssueMessagesInbox() {
  const { viewModel, state, session, api } = useRelayFlow();
  const threads = viewModel.issueThreads || [];
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState("");
  const [feedback, setFeedback] = useState("");
  const selected = threads.find((thread) => thread.issue._id === selectedId) || threads[0];

  useEffect(() => {
    if (selected?.issue._id && session?.compteId) {
      api.markIssueMessagesRead(session.compteId, selected.issue._id);
    }
  }, [api, selected?.issue._id, session?.compteId]);

  const sendReply = () => {
    if (!selected) return;
    const manager = state?.gestionnaires?.find(
      (item) => item._id === selected.issue.gestionnaireAssigneId
    );
    const result = api.sendIssueMessage(
      session?.compteId,
      selected.issue._id,
      manager?.compteId ? [manager.compteId] : [],
      reply
    );
    if (!result.ok) {
      setFeedback(result.error);
      return;
    }
    setReply("");
    setFeedback("Réponse envoyée au manager.");
  };

  if (!threads.length) {
    return (
      <section className="panel issue-inbox-empty">
        <p className="eyebrow">MESSAGERIE INTERNE</p>
        <h2>Aucune conversation en cours</h2>
        <p>Les échanges liés à un problème de livraison apparaîtront ici.</p>
      </section>
    );
  }

  return (
    <section className="issue-inbox">
      <aside className="issue-thread-list">
        <div className="issue-thread-list__header">
          <p className="eyebrow">DOSSIERS</p>
          <b>{threads.length} conversation{threads.length > 1 ? "s" : ""}</b>
        </div>
        {threads.map((thread) => {
          const active = thread.issue._id === selected?.issue._id;
          const latest = thread.messages.at(-1);
          return (
            <button
              type="button"
              key={thread.issue._id}
              className={`issue-thread-preview ${active ? "active" : ""}`}
              onClick={() => {
                setSelectedId(thread.issue._id);
                setFeedback("");
              }}
            >
              <span>
                <b>{thread.issue.ref || thread.issue._id}</b>
                {thread.unreadCount > 0 && <em>{thread.unreadCount}</em>}
              </span>
              <strong>{thread.issue.type.replace(/_/g, " ")}</strong>
              <small>{latest?.contenu || thread.issue.description}</small>
            </button>
          );
        })}
      </aside>

      <div className="issue-thread">
        <header className="issue-thread__header">
          <div>
            <p className="eyebrow">{selected.issue.ref || selected.issue._id}</p>
            <h2>{selected.issue.type.replace(/_/g, " ")}</h2>
          </div>
          <span className="pill amber">{selected.issue.statut.replace(/_/g, " ")}</span>
        </header>
        <p className="issue-thread__description">{selected.issue.description}</p>
        <div className="issue-conversation__messages issue-thread__messages">
          {selected.messages.length ? selected.messages.map((message) => (
            <article
              key={message._id}
              className={`issue-message ${message.expediteurCompteId === session?.compteId ? "issue-message--mine" : ""}`}
            >
              <div>
                <b>{message.expediteurCompteId === session?.compteId ? "Vous" : message.expediteurNom}</b>
                <time>{new Date(message.dateCreation).toLocaleString("fr-FR")}</time>
              </div>
              <p>{message.contenu}</p>
            </article>
          )) : (
            <p className="issue-conversation__empty">Le manager n’a pas encore envoyé de message.</p>
          )}
        </div>
        <div className="issue-composer issue-composer--reply">
          <label className="issue-composer__message">
            <span>Répondre au manager</span>
            <textarea
              rows={3}
              maxLength={1000}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Votre réponse reste dans le dossier RelayFlow…"
            />
          </label>
          <button type="button" className="button" disabled={reply.trim().length < 2} onClick={sendReply}>
            Envoyer ma réponse
          </button>
          {feedback && <p className="issue-composer__status">{feedback}</p>}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── DÉTAIL DOSSIER (application-detail / issue-detail) ─────────────────────────── */

function Detail({ type, section, role }) {
  const { viewModel, state, session, api } = useRelayFlow();
  const applicationsData = viewModel.applicationsData;
  const issuesData = viewModel.issuesData;
  const [status, setStatus] = useState("");
  const [issueMessage, setIssueMessage] = useState("");
  const [issueRecipient, setIssueRecipient] = useState("all");
  const [suspensionTarget, setSuspensionTarget] = useState("");
  const [messageStatus, setMessageStatus] = useState("");

  const candidateId = section ? section.replace("applications/", "").replace("issues/", "") : null;
  const candidate = applicationsData.find((a) => a.id === candidateId);
  const [applicationSnapshot] = useState(candidate || null);

  if (type === "application-detail") {
    const app = candidate || applicationSnapshot;
    if (!app) {
      return (
        <section className="panel p-8 text-center">
          <h2 className="text-xl font-black text-white">Demande introuvable ou déjà traitée</h2>
          <p className="text-sm text-slate-400">Elle n’est plus disponible dans les demandes en attente.</p>
          <Link className="button mt-4" href="/manager/applications">Retour aux demandes</Link>
        </section>
      );
    }
    const isMerchant = app.type === "merchant";

    return (
      <section className="detail panel max-w-4xl p-0 overflow-hidden">
        {/* Header Hero */}
        <div className={`p-8 border-b border-white/10 relative overflow-hidden`}>
          <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${isMerchant ? 'from-emerald-500 to-teal-900' : 'from-purple-500 to-indigo-900'}`} />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
                isMerchant ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-purple-500/20 text-purple-300 border-purple-500/30"
              }`}>
                {isMerchant ? "Candidature Commerçant" : "Candidature Livreur"}
              </span>
              <span className="text-xs font-mono text-slate-400 font-bold bg-black/20 px-2.5 py-1 rounded-md border border-white/10">{app.id}</span>
            </div>
            <h2 className="text-3xl font-black text-white m-0 mb-2 tracking-tight">{app.name}</h2>
            <p className="text-sm text-slate-300 m-0 font-medium text-lg">{app.subtitle}</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Main Info Grid */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              Profil & Coordonnées
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <span className="block text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider mb-1">Demandeur responsable</span>
                <span className="text-slate-200 font-semibold">{app.applicant}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <span className="block text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider mb-1">Zone d'opération</span>
                <span className="text-slate-200 font-semibold">{app.zone}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <span className="block text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Email</span>
                <span className="text-indigo-300 font-semibold">{app.email}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <span className="block text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider mb-1">Téléphone</span>
                <span className="text-slate-200 font-semibold">{app.phone}</span>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Pièces justificatives ({app.documents.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {app.documents.map((doc, idx) => {
                const documentName = doc.nom || doc;
                const documentUrl = doc.url;
                const content = (
                  <>
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors shrink-0">
                    PDF
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-xs font-semibold text-slate-200 truncate">{documentName}</p>
                    <p className="m-0 text-[0.65rem] text-slate-500 mt-0.5">
                      {doc.type || "Document"}{doc.taille ? ` · ${Math.ceil(doc.taille / 1024)} Ko` : ""}
                    </p>
                  </div>
                  <span className="text-[0.65rem] font-bold text-indigo-400 opacity-70 group-hover:opacity-100 transition-opacity uppercase tracking-wider pr-2">
                    {documentUrl ? "Ouvrir" : "Indisponible"}
                  </span>
                  </>
                );
                return documentUrl ? (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    key={idx}
                    className="flex w-full items-center gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group cursor-pointer text-left no-underline"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={idx}
                    className="flex w-full items-center gap-3 bg-slate-900/40 p-3.5 rounded-xl border border-white/5 text-left opacity-60"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3">
              <button
                className="button bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-emerald-900/20 shadow-lg text-sm font-bold px-6 py-2.5"
                onClick={async () => {
                  const result = await api.decideApplication(session?.compteId, candidate?.applicationId || candidateId, "acceptee", "Dossier validé");
                  setStatus(result.ok ? "Dossier validé avec succès" : result.error);
                  if (result.ok && typeof window !== "undefined") window.location.href = "/manager/applications";
                }}
              >
                Approuver l'adhésion
              </button>
              <button
                className="button bg-red-900/50 hover:bg-red-900 border-red-500/30 text-red-100 text-sm font-bold px-6 py-2.5"
                onClick={async () => {
                  const result = await api.decideApplication(session?.compteId, candidate?.applicationId || candidateId, "rejetee", "Dossier refusé");
                  setStatus(result.ok ? "Demande refusée" : result.error);
                  if (result.ok && typeof window !== "undefined") window.location.href = "/manager/applications";
                }}
              >
                Refuser
              </button>
            </div>
            <a href={`mailto:${app.email}`} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              Contacter le demandeur
            </a>
          </div>

          {status && (
            <div className={`mt-4 p-4 rounded-xl border ${status.includes('validé') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} font-bold text-sm flex items-center gap-2`}>
              <span>{status.includes('validé') ? '✓' : '✕'}</span> {status}
            </div>
          )}
        </div>
      </section>
    );
  }

  const issue = issuesData.find((i) => i[0] === candidateId) || [
    candidateId || "INC-000",
    "Incident signalé",
    "Aucun détail disponible.",
    "À traiter",
    "—",
    "—",
  ];
  const rawIssue = state?.signalements?.find(
    (item) => item._id === issue[6] || item.ref === candidateId || item._id === candidateId
  );
  const issueDelivery = rawIssue?.livraisonId
    ? state?.livraisons?.find((item) => item._id === rawIssue.livraisonId)
    : null;
  const issueSeller = issueDelivery
    ? state?.vendeurs?.find((item) => item._id === issueDelivery.vendeurId)
    : state?.vendeurs?.find((item) => item.compteId === rawIssue?.auteurId);
  const issueCourier = issueDelivery?.livreurId
    ? state?.livreurs?.find((item) => item._id === issueDelivery.livreurId)
    : state?.livreurs?.find((item) => item.compteId === rawIssue?.auteurId);
  const issueRecipients = [
    issueSeller?.compteId && {
      id: issueSeller.compteId,
      label: issueSeller.raisonSociale,
      type: "Commerçant",
    },
    issueCourier?.compteId && {
      id: issueCourier.compteId,
      label: issueCourier.nom,
      type: "Livreur",
    },
  ].filter(Boolean);
  const issueMessages = (state?.messagesIncidents || [])
    .filter((message) => message.signalementId === rawIssue?._id)
    .sort((a, b) => new Date(a.dateCreation) - new Date(b.dateCreation));
  const sendManagerMessage = () => {
    const recipientIds = issueRecipient === "all"
      ? issueRecipients.map((recipient) => recipient.id)
      : [issueRecipient];
    const result = api.sendIssueMessage(
      session?.compteId,
      rawIssue?._id,
      recipientIds,
      issueMessage
    );
    if (!result.ok) {
      setMessageStatus(result.error);
      return;
    }
    setIssueMessage("");
    setMessageStatus("Message envoyé dans RelayFlow.");
  };
  const applyIssueDecision = (decision, message) => {
    if (!rawIssue || !session) return setStatus("Signalement introuvable.");
    const result = api.traiterSignalement(
      rawIssue._id,
      session.compteId,
      decision,
      message
    );
    setStatus(result.ok ? message : result.error);
    if (result.ok && ["resolu", "rejete"].includes(decision) && typeof window !== "undefined") {
      window.location.href = `/${role}/issues`;
    }
  };
  const suspendIssueParticipant = () => {
    const targetId = suspensionTarget || issueRecipients[0]?.id;
    if (!targetId) return setStatus("Choisissez le compte responsable à suspendre.");
    const result = api.suspendreCompte(session?.compteId, targetId);
    setStatus(result.ok ? "Compte concerné suspendu" : "La suspension a échoué.");
    if (result.ok && typeof window !== "undefined") {
      window.location.href = `/${role}/issues`;
    }
  };
  const sellerAccount = state?.comptes?.find((account) => account._id === issueSeller?.compteId);
  const courierAccount = state?.comptes?.find((account) => account._id === issueCourier?.compteId);
  const issueStatusTone =
    rawIssue?.statut === "resolu"
      ? "resolved"
      : rawIssue?.statut === "escalade"
        ? "escalated"
        : rawIssue?.statut === "en_traitement"
          ? "processing"
          : rawIssue?.statut === "rejete"
            ? "rejected"
            : "open";
  const timeline = rawIssue?.historique?.length
    ? [...rawIssue.historique].sort((a, b) => new Date(b.quand) - new Date(a.quand))
    : [];

  return (
    <section className="issue-case">
      <header className="issue-case__header">
        <div className="issue-case__header-top">
          <Link href={`/${role}/issues`} className="issue-case__back">Retour aux signalements</Link>
          <div className="issue-case__identity">
            <span className={`issue-case__status issue-case__status--${issueStatusTone}`}>{issue[3]}</span>
            <code>{issue[0]}</code>
          </div>
        </div>
        <div className="issue-case__title">
          <div>
            <p className="eyebrow">DOSSIER D’INCIDENT</p>
            <h2>{issue[1]}</h2>
            <p>{issue[2]}</p>
          </div>
          <dl>
            <div><dt>Créé le</dt><dd>{rawIssue?.dateCreation ? new Date(rawIssue.dateCreation).toLocaleDateString("fr-FR") : "—"}</dd></div>
            <div><dt>Livraison</dt><dd>{issueDelivery?.numeroSuivi || "Non liée"}</dd></div>
            <div><dt>Destination</dt><dd>{issueDelivery?.villeLivraison || issue[5] || "—"}</dd></div>
          </dl>
        </div>
      </header>

      <div className="issue-case__layout">
        <main className="issue-case__main">
          <section className="issue-case__section issue-case__report">
            <div className="issue-case__section-title">
              <div>
                <span>01</span>
                <div><p className="eyebrow">SIGNALEMENT</p><h3>Informations du dossier</h3></div>
              </div>
            </div>
            <dl className="issue-case__facts">
              <div><dt>Motif</dt><dd>{issue[1]}</dd></div>
              <div><dt>Description</dt><dd>{issue[2]}</dd></div>
              <div><dt>Adresse concernée</dt><dd>{issue[5] || issueDelivery?.client?.adresse || "—"}</dd></div>
              <div><dt>Livraison</dt><dd>{issueDelivery?.numeroSuivi || "Aucune livraison rattachée"}</dd></div>
            </dl>
          </section>

          <section className="issue-case__section">
            <div className="issue-case__section-title">
              <div>
                <span>02</span>
                <div><p className="eyebrow">PARTIES CONCERNÉES</p><h3>Comptes rattachés au dossier</h3></div>
              </div>
            </div>
            <div className="issue-case__actors">
              {issueSeller ? (
                <article>
                  <div><span>Commerçant</span><em className={sellerAccount?.statutCompte === "actif" ? "is-active" : ""}>{sellerAccount?.statutCompte || "—"}</em></div>
                  <h4>{issueSeller.raisonSociale}</h4>
                  <p>{sellerAccount?.email || "E-mail non renseigné"}</p>
                  <small>{[issueSeller.adresse, issueSeller.ville].filter(Boolean).join(", ")}</small>
                </article>
              ) : <article className="is-empty"><p>Aucun commerçant rattaché.</p></article>}
              {issueCourier ? (
                <article>
                  <div><span>Livreur</span><em className={courierAccount?.statutCompte === "actif" ? "is-active" : ""}>{courierAccount?.statutCompte || "—"}</em></div>
                  <h4>{issueCourier.nom}</h4>
                  <p>{courierAccount?.email || "E-mail non renseigné"}</p>
                  <small>{issueCourier.typeVehicule || "Véhicule non renseigné"} · {issueCourier.ville || "Zone inconnue"}</small>
                </article>
              ) : <article className="is-empty"><p>Aucun livreur rattaché.</p></article>}
            </div>
          </section>

          <section className="issue-case__section">
            <div className="issue-case__section-title">
              <div>
                <span>03</span>
                <div><p className="eyebrow">SUIVI</p><h3>Historique du traitement</h3></div>
              </div>
            </div>
            <div className="issue-case__timeline">
              {timeline.length ? timeline.map((event, index) => (
                <article key={`${event.quand}-${index}`}>
                  <i />
                  <div>
                    <div><b>{String(event.statut || "Mise à jour").replace(/_/g, " ")}</b><time>{new Date(event.quand).toLocaleString("fr-FR")}</time></div>
                    <p>{event.commentaire || "Mise à jour du dossier."}</p>
                  </div>
                </article>
              )) : <p className="issue-case__empty">Aucune action supplémentaire enregistrée.</p>}
            </div>
          </section>

          {(role === "manager" || role === "super_manager") && (
            <section className="issue-case__section issue-case__resolution">
              <div className="issue-case__section-title">
                <div>
                  <span>04</span>
                  <div><p className="eyebrow">DÉCISION</p><h3>Résoudre le dossier</h3></div>
                </div>
              </div>
              <p className="issue-case__resolution-help">
                Vérifiez les échanges avant de clôturer le dossier. Une suspension doit toujours viser le compte réellement fautif.
              </p>
              <div className="issue-case__decision-row">
                {role === "manager" ? (
                  <>
                    <button className="small good" onClick={() => applyIssueDecision("resolu", "Incident marqué comme résolu")}>Marquer comme résolu</button>
                    <button className="small warning" onClick={() => applyIssueDecision("escalade", "Incident escaladé au Super Manager")}>Escalader</button>
                  </>
                ) : (
                  <>
                    <button className="small good" onClick={() => applyIssueDecision("resolu", "Arbitrage final : incident résolu")}>Résoudre définitivement</button>
                    <button className="small danger" onClick={() => applyIssueDecision("rejete", "Arbitrage final : demande rejetée")}>Rejeter le signalement</button>
                  </>
                )}
              </div>
              {issueRecipients.length > 0 && (
                <div className="issue-case__suspension">
                  <label>
                    <span>Compte fautif à suspendre</span>
                    <select value={suspensionTarget} onChange={(event) => setSuspensionTarget(event.target.value)}>
                      <option value="">Sélectionner un compte</option>
                      {issueRecipients.map((recipient) => (
                        <option key={recipient.id} value={recipient.id}>{recipient.type} · {recipient.label}</option>
                      ))}
                    </select>
                  </label>
                  <button className="small danger" disabled={!suspensionTarget} onClick={suspendIssueParticipant}>Suspendre ce compte</button>
                </div>
              )}
              {status && <p className="issue-case__feedback">{status}</p>}
            </section>
          )}
        </main>

        {(role === "manager" || role === "super_manager") && (
          <aside className="issue-case__conversation">
            <header>
              <div><p className="eyebrow">CONVERSATION</p><h3>Échanges internes</h3></div>
              <span>{issueMessages.length}</span>
            </header>
            <p className="issue-case__conversation-help">Les messages restent liés à cet incident et sont visibles uniquement par les parties concernées.</p>
            <div className="issue-conversation__messages">
              {issueMessages.length ? issueMessages.map((message) => {
                const mine = message.expediteurCompteId === session?.compteId;
                const senderAccountRecord = state?.comptes?.find((account) => account._id === message.expediteurCompteId);
                const senderProfile = senderAccountRecord?.role === "vendeur"
                  ? state?.vendeurs?.find((item) => item.compteId === senderAccountRecord._id)
                  : senderAccountRecord?.role === "livreur"
                    ? state?.livreurs?.find((item) => item.compteId === senderAccountRecord._id)
                    : null;
                const senderName = senderProfile?.raisonSociale || senderProfile?.nom ||
                  (senderAccountRecord?.role === "super_manager" ? "Super Manager" : "Manager");
                return (
                  <article key={message._id} className={`issue-message ${mine ? "issue-message--mine" : ""}`}>
                    <div><b>{mine ? "Vous" : senderName}</b><time>{new Date(message.dateCreation).toLocaleString("fr-FR")}</time></div>
                    <p>{message.contenu}</p>
                  </article>
                );
              }) : <p className="issue-conversation__empty">Commencez la conversation avec les parties concernées.</p>}
            </div>
            {issueRecipients.length > 0 ? (
              <div className="issue-case__composer">
                <label>
                  <span>Destinataire</span>
                  <select value={issueRecipient} onChange={(event) => setIssueRecipient(event.target.value)}>
                    <option value="all">{issueRecipients.length > 1 ? "Commerçant et livreur" : `${issueRecipients[0].type} · ${issueRecipients[0].label}`}</option>
                    {issueRecipients.length > 1 && issueRecipients.map((recipient) => (
                      <option key={recipient.id} value={recipient.id}>{recipient.type} · {recipient.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Votre message</span>
                  <textarea rows={4} maxLength={1000} value={issueMessage} onChange={(event) => setIssueMessage(event.target.value)} placeholder="Écrivez une réponse claire et utile…" />
                </label>
                <div>
                  <small>{issueMessage.length}/1000</small>
                  <button type="button" className="button" disabled={issueMessage.trim().length < 2} onClick={sendManagerMessage}>Envoyer</button>
                </div>
              </div>
            ) : <p className="issue-conversation__empty">Aucun destinataire disponible pour ce dossier.</p>}
            {messageStatus && <p className="issue-composer__status">{messageStatus}</p>}
          </aside>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────── TABLEAU DE LIVRAISONS (générique) ─────────────────────────── */

function GenericTable({ role }) {
  const { viewModel, state } = useRelayFlow();
  const allDeliveriesData = viewModel.allDeliveriesData;
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const actorType = params.get("actorType");
    const actorId = params.get("actorId");
    if (actorType && actorId) setActorFilter(`${actorType}:${actorId}`);
  }, []);

  const actorOptions = useMemo(() => {
    const sellerIds = new Set(allDeliveriesData.map((row) => row[10]).filter(Boolean));
    const courierIds = new Set(allDeliveriesData.map((row) => row[11]).filter(Boolean));
    return [
      ...(state?.vendeurs || [])
        .filter((seller) => sellerIds.has(seller._id))
        .map((seller) => [`merchant:${seller._id}`, `Commerçant · ${seller.raisonSociale}`]),
      ...(state?.livreurs || [])
        .filter((courier) => courierIds.has(courier._id))
        .map((courier) => [`courier:${courier._id}`, `Livreur · ${courier.nom}`]),
    ];
  }, [allDeliveriesData, state?.vendeurs, state?.livreurs]);
  const zones = useMemo(
    () => [...new Set(allDeliveriesData.map((row) => row[12]).filter(Boolean))].sort(),
    [allDeliveriesData]
  );

  const filtered = useMemo(
    () =>
      [...allDeliveriesData]
        .filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase()))
        .filter((r) => statusFilter === "all" || r[3] === statusFilter)
        .filter((r) => zoneFilter === "all" || r[12] === zoneFilter)
        .filter((r) => {
          if (actorFilter === "all") return true;
          const [actorType, actorId] = actorFilter.split(":");
          return actorType === "merchant" ? r[10] === actorId : r[11] === actorId;
        })
        .sort((a, b) =>
          sort === "reference"
            ? a[0].localeCompare(b[0])
            : new Date(b[7] || 0) - new Date(a[7] || 0)
        ),
    [allDeliveriesData, query, sort, statusFilter, zoneFilter, actorFilter],
  );

  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const start = (page - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(start, start + itemsPerPage);

  const statuses = [...new Set(allDeliveriesData.map((d) => d[3]))];

  return (
    <>
      <div className="panel table-panel">
        <div className="directory-toolbar">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Rechercher une livraison…"
          />
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="all">Tous les statuts</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={actorFilter} onChange={(e) => { setActorFilter(e.target.value); setPage(1); }}>
            <option value="all">Tous les acteurs</option>
            {actorOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select value={zoneFilter} onChange={(e) => { setZoneFilter(e.target.value); setPage(1); }}>
            <option value="all">Toutes les zones</option>
            {zones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Plus récent d'abord</option>
            <option value="reference">Trier par référence</option>
          </select>
          {(query || statusFilter !== "all" || actorFilter !== "all" || zoneFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setActorFilter("all");
                setZoneFilter("all");
                setPage(1);
              }}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              Réinitialiser
            </button>
          )}
        </div>

        <div className="table">
          <div className="row table-head">
            <span>Référence</span>
            <span>Commerçant</span>
            <span>Destination</span>
            <span>Statut</span>
          </div>
          {paginatedItems.map((r) => (
            <div
              className="row cursor-pointer hover:bg-white/5 transition-colors"
              key={r[8]}
              onClick={() => setSelectedDelivery(r)}
            >
              <span className="font-mono text-indigo-300 font-semibold text-[0.75rem]">{r[0]}</span>
              <span className="font-medium text-white">{r[1]}</span>
              <span className="text-slate-400">{r[2]}</span>
              <span><span className={`pill ${getStatusColor(r[3])}`}>{r[3]}</span></span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 px-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold disabled:opacity-40 hover:bg-white/10"
          >
            Précédent
          </button>
          <span className="text-xs text-slate-400">Page {page} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold disabled:opacity-40 hover:bg-white/10"
          >
            Suivant
          </button>
        </div>
      </div>

      {selectedDelivery && (
        <DeliveryModal
          delivery={selectedDelivery}
          role={role}
          assignMode={selectedDelivery[3] === "À attribuer"}
          onClose={() => setSelectedDelivery(null)}
        />
      )}
    </>
  );
}

/* ─────────────────────────── ASSIGNER UN LIVREUR (commerçant) ─────────────────────────── */

function AssignCourier() {
  const { viewModel, api, session, state } = useRelayFlow();
  const seller = state?.vendeurs?.find((item) => item.compteId === session?.compteId);
  const unassignedDeliveries = viewModel.livraisons
    .filter(
      (delivery) =>
        delivery.statut === "SOUMISE" &&
        !delivery.livreurId &&
        ["equipe", "pool_plateforme"].includes(delivery.modePriseEnCharge)
    )
    .sort((a, b) => new Date(b.dateSoumission || 0) - new Date(a.dateSoumission || 0));
  const choiceRequiredDeliveries = unassignedDeliveries.filter(
    (delivery) =>
      delivery.modePriseEnCharge === "equipe" ||
      delivery.poolAttribution === "validation_vendeur"
  );
  const automaticDeliveries = unassignedDeliveries.filter(
    (delivery) =>
      delivery.modePriseEnCharge === "pool_plateforme" &&
      delivery.poolAttribution !== "validation_vendeur"
  );
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(unassignedDeliveries[0]?._id || "");
  const [feedback, setFeedback] = useState("");
  const [actionError, setActionError] = useState("");

  const selectedDelivery = unassignedDeliveries.find(
    (delivery) => delivery._id === selectedDeliveryId
  );
  const visibleDeliveries = unassignedDeliveries.filter((delivery) => {
    const manualPool =
      delivery.modePriseEnCharge === "pool_plateforme" &&
      delivery.poolAttribution === "validation_vendeur";
    const automaticPool =
      delivery.modePriseEnCharge === "pool_plateforme" && !manualPool;
    const matchesMode =
      modeFilter === "all" ||
      (modeFilter === "choice" && (delivery.modePriseEnCharge === "equipe" || manualPool)) ||
      (modeFilter === "team" && delivery.modePriseEnCharge === "equipe") ||
      (modeFilter === "manual" && manualPool) ||
      (modeFilter === "automatic" && automaticPool);
    const haystack = [
      delivery.numeroSuivi,
      delivery.client?.nom,
      delivery.client?.prenom,
      delivery.client?.adresse,
      delivery.villeLivraison,
    ].join(" ").toLowerCase();
    return matchesMode && haystack.includes(query.trim().toLowerCase());
  });
  useEffect(() => {
    if (
      visibleDeliveries.length &&
      !visibleDeliveries.some((delivery) => delivery._id === selectedDeliveryId)
    ) {
      setSelectedDeliveryId(visibleDeliveries[0]._id);
    } else if (!visibleDeliveries.length && selectedDeliveryId) {
      setSelectedDeliveryId("");
    }
  }, [visibleDeliveries, selectedDeliveryId]);
  const activeTeam = (state?.partenariats || [])
    .filter(
      (partnership) =>
        partnership.vendeurId === seller?._id &&
        partnership.statut === "actif"
    )
    .map((partnership) =>
      state?.livreurs?.find((courier) => courier._id === partnership.livreurId)
    )
    .filter(Boolean);
  const candidateOffers = (state?.offresLivraison || [])
    .filter(
      (offer) =>
        offer.livraisonId === selectedDeliveryId &&
        offer.statut === "en_attente"
    )
    .map((offer) => ({
      offer,
      courier: state?.livreurs?.find((courier) => courier._id === offer.livreurId),
    }));

  const selectDelivery = (deliveryId) => {
    setSelectedDeliveryId(deliveryId);
    setFeedback("");
    setActionError("");
  };

  const assignTeamCourier = (courierId) => {
    const result = api.assignCourier(session?.compteId, selectedDeliveryId, courierId);
    if (result.ok) {
      setFeedback("Le livreur de votre équipe a été assigné et prévenu.");
      setActionError("");
    } else {
      setActionError(result.error || "Assignation impossible.");
    }
  };

  const decideCandidate = (offerId, decision) => {
    const result = api.decideDeliveryCandidate(
      session?.compteId,
      offerId,
      decision
    );
    if (result.ok) {
      setFeedback(
        decision === "acceptee"
          ? "Le candidat a été choisi et prévenu."
          : "La candidature a été refusée."
      );
      setActionError("");
    } else {
      setActionError(result.error || "Décision impossible.");
    }
  };

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="panel p-4">
          <span className="mini-label">Sans livreur</span>
          <strong className="mt-2 block text-2xl text-white">{unassignedDeliveries.length}</strong>
          <small className="text-slate-400">Toutes les livraisons à pourvoir</small>
        </div>
        <div className="panel p-4">
          <span className="mini-label">Choix requis</span>
          <strong className="mt-2 block text-2xl text-white">
            {choiceRequiredDeliveries.length}
          </strong>
          <small className="text-slate-400">Votre choix est nécessaire</small>
        </div>
        <div className="panel p-4">
          <span className="mini-label">Pool automatique</span>
          <strong className="mt-2 block text-2xl text-white">{automaticDeliveries.length}</strong>
          <small className="text-slate-400">Aucune action requise</small>
        </div>
      </div>

      {feedback && (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-300">
          {feedback}
        </p>
      )}
      {actionError && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">
          {actionError}
        </p>
      )}

      <div className="panel grid grid-cols-1 gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <input
          className="w-full"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une livraison, un client ou une destination…"
        />
        <select
          aria-label="Filtrer les livraisons à attribuer"
          value={modeFilter}
          onChange={(event) => setModeFilter(event.target.value)}
        >
          <option value="all">Toutes les livraisons</option>
          <option value="choice">Mon choix est requis</option>
          <option value="team">Équipe uniquement</option>
          <option value="manual">Pool manuel uniquement</option>
          <option value="automatic">Pool automatique uniquement</option>
        </select>
      </div>

      {unassignedDeliveries.length === 0 ? (
        <div className="panel p-8 text-center">
          <h2 className="m-0 text-lg font-black text-white">Aucune assignation à effectuer</h2>
          <p className="mt-2 text-sm text-slate-400">
            Toutes vos livraisons soumises ont désormais un livreur.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Toutes les livraisons sans livreur
            </p>
            {visibleDeliveries.map((delivery) => {
              const manualPool =
                delivery.modePriseEnCharge === "pool_plateforme" &&
                delivery.poolAttribution === "validation_vendeur";
              const automaticPool =
                delivery.modePriseEnCharge === "pool_plateforme" && !manualPool;
              const applications = manualPool
                ? (state?.offresLivraison || []).filter(
                    (offer) =>
                      offer.livraisonId === delivery._id &&
                      offer.statut === "en_attente"
                  ).length
                : null;
              return (
                <button
                  type="button"
                  key={delivery._id}
                  onClick={() => selectDelivery(delivery._id)}
                  className={`panel w-full p-4 text-left transition ${
                    selectedDeliveryId === delivery._id
                      ? "border-indigo-400/60 bg-indigo-500/10"
                      : "hover:border-white/25"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-black text-indigo-200">
                      {delivery.numeroSuivi}
                    </span>
                    <span className={`pill ${manualPool ? "amber" : automaticPool ? "green" : "blue"}`}>
                      {manualPool ? "Pool manuel" : automaticPool ? "Pool automatique" : "Équipe"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-bold text-white">
                    {delivery.client?.prenom} {delivery.client?.nom}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {delivery.client?.adresse || delivery.villeLivraison}
                  </p>
                  <small className="mt-3 block font-bold text-slate-300">
                    {manualPool
                      ? `${applications} candidature${applications > 1 ? "s" : ""}`
                      : automaticPool
                        ? "Le premier livreur qui accepte sera assigné"
                        : `${activeTeam.length} partenaire${activeTeam.length > 1 ? "s" : ""} actif${activeTeam.length > 1 ? "s" : ""}`}
                  </small>
                </button>
              );
            })}
            {visibleDeliveries.length === 0 && (
              <p className="panel p-5 text-sm text-slate-400">
                Aucune livraison ne correspond à votre recherche.
              </p>
            )}
          </div>

          <div className="panel h-fit p-5 lg:sticky lg:top-5">
            {selectedDelivery ? (
              <>
                <div className="border-b border-white/10 pb-4">
                  <p className="eyebrow mb-1">
                    {selectedDelivery.modePriseEnCharge === "equipe"
                      ? "CHOIX DANS MON ÉQUIPE"
                      : selectedDelivery.poolAttribution === "validation_vendeur"
                        ? "CANDIDATURES DU POOL"
                        : "ATTRIBUTION AUTOMATIQUE"}
                  </p>
                  <h2 className="m-0 text-xl font-black text-white">
                    {selectedDelivery.numeroSuivi}
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {selectedDelivery.client?.adresse || selectedDelivery.villeLivraison}
                  </p>
                </div>

                {selectedDelivery.modePriseEnCharge === "equipe" ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-slate-300">
                      Choisissez un livreur ayant déjà accepté de rejoindre votre équipe.
                    </p>
                    {activeTeam.length === 0 ? (
                      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                        <b className="text-sm text-amber-200">Aucun partenaire actif</b>
                        <p className="mt-1 text-xs text-slate-400">
                          Ajoutez d’abord un livreur depuis la page « Mon équipe ».
                        </p>
                        <Link href="/merchant/team" className="small mt-3 inline-block">
                          Gérer mon équipe
                        </Link>
                      </div>
                    ) : (
                      activeTeam.map((courier) => {
                        const available = courier.statutOperationnel === "disponible";
                        const covers = courierCoversDelivery(courier, selectedDelivery);
                        const selectable = available && covers;
                        return (
                          <div key={courier._id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <b className="block text-sm text-white">{courier.nom}</b>
                                <small className="text-slate-400">
                                  {courier.typeVehicule || "Véhicule non renseigné"} · {courier.ville || "Zone non renseignée"}
                                </small>
                              </div>
                              <button
                                type="button"
                                className="small good"
                                disabled={!selectable}
                                onClick={() => assignTeamCourier(courier._id)}
                              >
                                Assigner
                              </button>
                            </div>
                            {!available && <p className="mt-2 text-xs text-amber-300">Livreur actuellement indisponible.</p>}
                            {available && !covers && <p className="mt-2 text-xs text-amber-300">La destination n’est pas dans ses zones couvertes.</p>}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : selectedDelivery.poolAttribution === "validation_vendeur" ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-slate-300">
                      Seuls les livreurs ayant demandé cette livraison peuvent être choisis.
                    </p>
                    {candidateOffers.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <b className="text-sm text-white">Aucune candidature pour le moment</b>
                        <p className="mt-1 text-xs text-slate-400">
                          La livraison reste visible dans le pool jusqu’à ce qu’un livreur candidate.
                        </p>
                      </div>
                    ) : (
                      candidateOffers.map(({ offer, courier }) => (
                        <div key={offer._id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <b className="block text-sm text-white">{courier?.nom || "Livreur"}</b>
                              <small className="text-slate-400">
                                {courier?.typeVehicule || "Véhicule non renseigné"} · {courier?.ville || "Zone non renseignée"}
                              </small>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="small good"
                                onClick={() => decideCandidate(offer._id, "acceptee")}
                              >
                                Choisir
                              </button>
                              <button
                                type="button"
                                className="small"
                                onClick={() => decideCandidate(offer._id, "rejetee")}
                              >
                                Refuser
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                    <span className="pill green">Aucune action requise</span>
                    <h3 className="mt-4 text-base font-black text-white">
                      En attente du premier livreur
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Cette livraison est proposée automatiquement aux livreurs éligibles.
                      Le premier qui l’accepte lui sera attribué immédiatement.
                    </p>
                    <p className="mt-3 text-xs text-slate-400">
                      Vous retrouverez ensuite le livreur choisi automatiquement dans « Mes livraisons ».
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Sélectionnez une livraison.</p>
            )}
          </div>
        </div>
      )}

    </section>
  );
}

/* ─────────────────────────── PAGES (config) ─────────────────────────── */

const pages = {
  "merchant/deliveries/new": ["Nouvelle livraison", "Créez une livraison et choisissez le livreur.", "delivery"],
  "merchant/deliveries": ["Mes livraisons", "Suivez et gérez vos expéditions.", "table"],
  "merchant/assign-courier": ["Attribuer les livraisons", "Choisissez un membre de votre équipe ou validez une candidature du pool.", "assign-courier"],
  "merchant/team": ["Mon équipe de livreurs", "Gérez vos partenariats réguliers avec des livreurs attitrés.", "team"],
  "merchant/messages": ["Messages & problèmes", "Retrouvez les échanges centralisés liés à vos dossiers.", "issue-messages"],
  "merchant/finance": ["Finances & Factures", "Consultez vos factures et gérez vos paiements.", "finance"],
  "courier/available": ["Livraisons disponibles", "Recherchez plus ou moins loin de votre zone, puis triez les opportunités.", "available"],
  "courier/deliveries": ["Mes livraisons", "Confirmez le retrait, utilisez la localisation et finalisez la remise.", "mine"],
  "courier/partnerships": ["Mes partenariats", "Acceptez ou refusez les propositions des commerçants et retrouvez vos partenaires actifs.", "courier-partnerships"],
  "courier/messages": ["Messages & problèmes", "Échangez avec les managers pour résoudre vos dossiers.", "issue-messages"],
  "courier/status": ["Mon statut de livreur", "Votre disponibilité détermine les livraisons proposées.", "status"],
  "courier/finance": ["Mes gains & Paiements", "Consultez vos bons de paiement et votre solde.", "finance"],
  "manager/applications": ["Demandes d'adhésion", "Étudiez les demandes des commerçants et livreurs.", "applications"],
  "manager/issues": ["Problèmes signalés", "Suivez les incidents de livraison et leurs résolutions.", "issues"],
  "manager/deliveries": ["Livraisons de mon périmètre", "Consultez les livraisons autorisées dans votre juridiction.", "table"],
  "manager/merchants": ["Commerçants partenaires", "Consultez et gérez les commerçants de votre périmètre.", "merchants"],
  "manager/couriers": ["Livreurs vérifiés", "Consultez et gérez les livreurs de votre périmètre.", "couriers"],
  "manager/finance": ["Gestion Financière", "Générez les factures, bons de paiement et supervisez les impayés.", "finance"],
  "manager/invite": ["Créer un utilisateur", "Créez et activez un vendeur ou un livreur dans votre zone.", "invite"],
  "super_manager/managers": ["Tous les managers", "Créez, recherchez et administrez les comptes managers.", "managers"],
  "super_manager/managers/create": ["Créer un manager", "Créez un compte manager avec un mot de passe temporaire.", "manager"],
  "super_manager/merchants": ["Tous les commerçants", "Cliquez sur un commerçant pour voir ses statistiques complètes.", "merchants"],
  "super_manager/couriers": ["Tous les livreurs", "Cliquez sur un livreur pour voir ses statistiques complètes.", "couriers"],
  "super_manager/deliveries": ["Toutes les livraisons", "Vision complète du flux de livraison.", "table"],
  "super_manager/issues": ["Incidents & bannissements", "Résolvez les incidents, escaladez ou arbitrez définitivement.", "issues"],
  "super_manager/finance": ["Supervision Financière", "Consultez les flux financiers de l'ensemble du réseau.", "finance"],
};

/* ─────────────────────────── EXPORT PRINCIPAL ─────────────────────────── */

export default function WorkspacePage({ role, section }) {
  const { viewModel } = useRelayFlow();
  const applicationsData = viewModel.applicationsData;
  const issuesData = viewModel.issuesData;

  // Résolution dynamique des routes
  const resolveSection = () => {
    const key = `${role}/${section}`;
    if (pages[key]) return pages[key];

    // Dossiers d'adhésion dynamiques (ex: manager/applications/MER-028)
    if (section.startsWith("applications/")) {
      const id = section.replace("applications/", "");
      const candidate = applicationsData.find((a) => a.id === id);
      const name = candidate ? candidate.name : id;
      return [`Dossier · ${id}`, `${name} — demande d'adhésion à étudier.`, "application-detail"];
    }

    // Incidents dynamiques (ex: manager/issues/INC-042)
    if (section.startsWith("issues/")) {
      const id = section.replace("issues/", "");
      const issue = issuesData.find((i) => i[0] === id);
      return [
        `Incident ${id}`,
        issue ? `${issue[1]} — ${issue[2]}` : "Détail de l'incident.",
        "issue-detail",
      ];
    }

    return null;
  };

  const page = resolveSection();

  if (!page)
    return (
      <div className="empty">
        <h1>Page à venir</h1>
        <Link className="button" href={`/${role}`}>Retour au tableau de bord</Link>
      </div>
    );

  const [title, desc, type] = page;

  return (
    <>
      {type !== "issue-detail" && <header className="page-header">
        <div>
          <p className="eyebrow">{role.replace("-", " ").toUpperCase()}</p>
          <h1>{title}</h1>
          <p>{desc}</p>
        </div>
        {type === "managers" ? (
          <Link href="/super_manager/managers/create" className="button">Créer un manager</Link>
        ) : (
          !["delivery", "assign-courier"].includes(type) && (
            <Link href={`/${role}`} className="button">Tableau de bord</Link>
          )
        )}
      </header>}

      {["delivery", "manager"].includes(type) ? (
        <Form type={type} />
      ) : type === "invite" ? (
        <InviteForm role={role} />
      ) : type === "finance" ? (
        <Finance role={role} />
      ) : type === "team" ? (
        <TeamManager />
      ) : type === "courier-partnerships" ? (
        <CourierPartnerships />
      ) : type === "issue-messages" ? (
        <IssueMessagesInbox />
      ) : type === "assign-courier" ? (
        <AssignCourier />
      ) : type === "status" ? (
        <CourierStatus />
      ) : ["managers", "merchants", "couriers"].includes(type) ? (
        <Directory type={type} role={role} />
      ) : type === "available" ? (
        <DeliverySearch />
      ) : type === "applications" ? (
        <ApplicationsManager />
      ) : type === "mine" ? (
        <CourierDeliveries />
      ) : type === "issues" ? (
        <Cards type={type} role={role} />
      ) : ["application-detail", "issue-detail"].includes(type) ? (
        <Detail type={type} section={section} role={role} />
      ) : (
        <GenericTable role={role} />
      )}
    </>
  );
}
