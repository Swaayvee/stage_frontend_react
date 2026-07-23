"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(() => import("./DeliveryMap"), { ssr: false });

import { getStatusColor } from "../lib/utils";
import {
  directoryData,
  allDeliveriesData,
  availableDeliveries,
  myDeliveries,
  issuesData,
  applicationsData,
  couriersForAssign,
} from "../lib/mockData";

/* ─────────────────────────── MACHINE D'ÉTATS LIVRAISON ─────────────────────────── */

const DELIVERY_WORKFLOW = [
  "Créée",
  "À attribuer",
  "Livreur assigné",
  "Retrait confirmé",
  "En livraison",
  "Livrée",
];

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

function DeliveryModal({ delivery, role, assignMode: initialAssignMode, onClose }) {
  const [assignMode, setAssignMode] = useState(initialAssignMode || false);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [assigned, setAssigned] = useState(false);
  const [reportIssue, setReportIssue] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [issueSent, setIssueSent] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(null);

  if (!delivery) return null;

  // delivery = [ref, merchant, destination, status, colorHint, courierName, address?, date?]
  const [ref, merchant, destination, rawStatus, , courierName, address, date] = delivery;
  const status = deliveryStatus || rawStatus;
  const color = getStatusColor(status);
  const canAssign = status === "À attribuer" || !courierName;

  // Actions contextuelles selon rôle et statut
  const getWorkflowAction = () => {
    if (role === "courier") {
      if (status === "Livreur assigné") return ["Confirmer le retrait chez le commerçant", () => setDeliveryStatus("Retrait confirmé"), "good"];
      if (status === "Retrait confirmé") return ["Confirmer la livraison au client", () => setDeliveryStatus("Livrée"), "good"];
      if (status === "En livraison") return ["Confirmer la livraison au client", () => setDeliveryStatus("Livrée"), "good"];
    }
    if (role === "merchant") {
      if (status === "Créée" || status === "À attribuer") return ["Annuler la livraison", () => setDeliveryStatus("Annulée"), "danger"];
    }
    if (role === "manager" || role === "super-manager") {
      return null; // dropdown affichera les options
    }
    return null;
  };

  const workflowAction = getWorkflowAction();

  const handleAssign = () => {
    if (!selectedCourier) return;
    setAssigned(true);
    setAssignMode(false);
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
              </dl>
            </div>

            {/* Section spéciale livreur : Carte & Navigation */}
            {role === "courier" && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="m-0 text-xs font-bold uppercase tracking-wider text-indigo-300">Itinéraire GPS & Navigation</p>
                  <span className="text-[0.68rem] text-slate-400 font-medium">Calcul des temps en temps réel sur la carte</span>
                </div>

                {/* Carte interactive OSRM */}
                <div className="h-[280px] w-full relative rounded-lg overflow-hidden border border-white/5 shadow-inner">
                  <DeliveryMap
                    courierMode="Vélo électrique"
                    merchantName={merchant}
                    clientAddress={address || destination}
                  />
                </div>

                {/* Navigation */}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || destination)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="button w-full text-center block"
                >
                  🗺️ Lancer la navigation Google Maps
                </a>
              </div>
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

              {/* Options réservées au commerçant : suivi public, copier et partager */}
              {role === "merchant" && (
                <div className="flex flex-wrap items-center gap-2 w-full pt-1">
                  <Link href={`/tracking/${ref}`} className="small flex-1 text-center bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25">
                    👁️ Suivi public
                  </Link>
                  <button
                    type="button"
                    className="small flex-1 text-center bg-white/5 border-white/15 text-slate-200 hover:bg-white/10"
                    onClick={() => {
                      const url = `${window.location.origin}/tracking/${ref}`;
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
                      const url = `${window.location.origin}/tracking/${ref}`;
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
                        onClick={() => { setIssueSent(true); setReportIssue(false); setIssueText(""); }}
                        disabled={!issueText.trim()}
                      >
                        Envoyer le signalement
                      </button>
                      <button className="small" onClick={() => setReportIssue(false)}>Annuler</button>
                    </div>
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
  const [sent, setSent] = useState(false);
  const [enablePublicLink, setEnablePublicLink] = useState(true);
  const [weight, setWeight] = useState("2.5");
  const [volume, setVolume] = useState("medium");

  if (type === "delivery") {
    return (
      <form
        className="form panel space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label>
            <span>Nom du client</span>
            <input type="text" required placeholder="Ex. Jean Dupont" />
          </label>
          <label>
            <span>Téléphone du client</span>
            <input type="tel" required placeholder="06 12 34 56 78" />
          </label>
          <label className="md:col-span-2">
            <span>Adresse de livraison</span>
            <input type="text" required placeholder="14 Rue Victor Hugo, 69002 Lyon" />
          </label>

          {/* Informations Colis : Poids & Volume */}
          <label>
            <span>Poids estimé du colis (kg)</span>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              placeholder="Ex. 2.5"
            />
          </label>
          <label>
            <span>Format / Volume du colis</span>
            <select value={volume} onChange={(e) => setVolume(e.target.value)}>
              <option value="small">📦 Petit (ex: enveloppe, petit objet)</option>
              <option value="medium">📦 Moyen (ex: boîte à chaussures, sac)</option>
              <option value="large">📦 Grand / Volumineux (ex: carton lourd, équipements)</option>
            </select>
          </label>

          <label>
            <span>Mode d'attribution au livreur</span>
            <select defaultValue="auto">
              <option value="auto">Automatique (Livreur le plus proche)</option>
              <option value="manual">Validation manuelle du commerçant</option>
            </select>
          </label>

          {/* Option : Générer un lien de suivi public pour le client */}
          <div className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-bold text-white block">🔗 Générer un lien de suivi public pour le client</span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Le client pourra suivre l'avancement de son colis en direct via un lien dédié qui lui sera envoyé.
              </span>
            </div>
            <input
              type="checkbox"
              checked={enablePublicLink}
              onChange={(e) => setEnablePublicLink(e.target.checked)}
              className="w-5 h-5 accent-indigo-500 cursor-pointer shrink-0"
            />
          </div>
        </div>

        {sent && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-emerald-400 font-bold text-sm">
            ✓ Livraison créée avec succès ! {enablePublicLink && "Lien de suivi généré pour le client."}
          </div>
        )}

        <button className="button w-full">Créer la livraison</button>
      </form>
    );
  }

  return (
    <form
      className="form panel"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <label>
        Prénom et nom
        <input type="text" required placeholder="Prénom Nom" />
      </label>
      <label>
        E-mail professionnel
        <input type="email" required placeholder="manager@relayflow.fr" />
      </label>
      <label>
        Zone ou périmètre
        <input type="text" required placeholder="Lyon Centre" />
      </label>
      <label>
        Mot de passe temporaire
        <input type="password" required placeholder="••••••••" />
      </label>
      {sent && <p className="success">✓ Enregistrement effectué avec succès.</p>}
      <button className="button">Créer le compte manager</button>
    </form>
  );
}

/* ─────────────────────────── DIRECTORY (commerçants/livreurs/managers) ─────────────────────────── */

function Directory({ type, role }) {
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
        : ["Référence", "Livreur", "Véhicule", "Zone"];

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
        <UserDetailModal user={selectedUser} type={type} onClose={() => setSelectedUser(null)} />
      )}
    </>
  );
}

/* ─────────────────────────── MODAL UTILISATEUR (super-manager / manager) ─────────────────────────── */

function UserDetailModal({ user, type, onClose }) {
  const isCourier = type === "couriers";
  const isMerchant = type === "merchants";

  const chartData = isCourier ? [18, 24, 32, 29, 38, 45] : isMerchant ? [25, 30, 42, 36, 48, 52] : [12, 15, 18, 20, 22, 25];
  const months = ["Fév", "Mar", "Avr", "Mai", "Juin", "Juil"];
  const maxVal = Math.max(...chartData);

  const recentActivity = isCourier
    ? [
        ["LIV-2026-042", "En livraison", "Maison Olive · Lyon 2e"],
        ["LIV-2026-039", "Livrée", "Atelier Nami · Lyon 7e"],
        ["LIV-2026-035", "Livrée", "Le Camion Vert · Villeurbanne"],
      ]
    : isMerchant
      ? [
          ["LIV-2026-042", "En livraison", "Client : Jean Dupont · Lyon 2e"],
          ["LIV-2026-038", "À attribuer", "Client : M. Leroy · Villeurbanne"],
          ["LIV-2026-033", "Livrée", "Client : Mme Blanc · Lyon 3e"],
        ]
      : [
          ["MGR-ACT-001", "Demande traitée", "MER-028 Épicerie des Canuts"],
          ["MGR-ACT-002", "Incident résolu", "INC-039 Retard Atelier Nami"],
        ];

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
              {isMerchant ? "🏪 COMMERÇANT" : isCourier ? "🚴 LIVREUR" : "🛡️ MANAGER"}
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
                <dt className="text-slate-400">{isCourier ? "Véhicule :" : isMerchant ? "Zone :" : "Périmètre :"}</dt>
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
                  <dt className="text-slate-400">{isCourier ? "Note :" : isMerchant ? "Volume :" : "Rôle :"}</dt>
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
                <dd className="font-bold text-emerald-400">Actif & Vérifié</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Inscrit depuis :</dt>
                <dd className="font-medium text-slate-300">14 Janvier 2025</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Statistiques Clés</p>
            <dl className="grid grid-cols-2 gap-2 text-center">
              {[
                [isCourier ? "Livraisons totales" : "Commandes/mois", isCourier ? "156" : "45"],
                ["Taux réussite", "98.4%"],
                ["Note moyenne", "4.9 / 5"],
                ["Incidents", "0 signalé"],
              ].map(([label, val]) => (
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
            <span className="text-[0.68rem] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              +14.2% ce mois
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
            {[["Ponctualité", "98.4%", "emerald"], ["Satisfaction clients", "97.0%", "indigo"]].map(([label, val, color]) => (
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
            {isCourier ? "Dernières livraisons" : isMerchant ? "Dernières commandes" : "Dernières actions"}
          </p>
          <div className="space-y-2">
            {recentActivity.map(([id, status, info]) => (
              <div key={id} className="flex items-center justify-between text-xs rounded-lg bg-black/20 px-3 py-2 border border-white/5">
                <div>
                  <span className="font-mono text-indigo-300 font-bold">{id}</span>
                  <span className="text-slate-400 ml-2">{info}</span>
                </div>
                <span className={`pill ${getStatusColor(status)}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions super-manager */}
        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button className="small danger text-xs">Suspendre le compte</button>
          <button className="small text-xs">Contacter par e-mail</button>
          <button className="small text-xs">Voir toutes les livraisons</button>
        </div>
      </article>
    </div>
  );
}

/* ─────────────────────────── LIVRAISONS DISPONIBLES (livreur) ─────────────────────────── */

function DeliverySearch() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("distance");
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const filtered = useMemo(
    () =>
      [...availableDeliveries]
        .filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) =>
          sort === "distance"
            ? parseFloat(a[1]) - parseFloat(b[1])
            : a[3].localeCompare(b[3]),
        ),
    [query, sort],
  );

  return (
    <>
      <div className="directory-toolbar">
        <input
          aria-label="Rechercher une livraison"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ville, commerçant ou référence…"
        />
        <select aria-label="Trier par" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="distance">Trier par distance</option>
          <option value="mode">Trier par mode d'attribution</option>
        </select>
      </div>
      <div className="cards">
        {filtered.map(([ref, distance, merchant, mode]) => (
          <article
            className="panel action-card cursor-pointer hover:border-indigo-400/50 transition-all"
            key={ref}
            onClick={() => setSelectedDelivery([ref, merchant, distance, "Disponible", "green", null])}
          >
            <span className="mini-label">
              {mode === "Automatique" ? "Acceptation automatique" : "Validation du commerçant"}
            </span>
            <h2 className="hover:text-indigo-300 transition-colors">{ref}</h2>
            <p>{merchant} · {distance}</p>
            <button className="small good">Accepter cette livraison</button>
          </article>
        ))}
      </div>

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

/* ─────────────────────────── DEMANDES D'ADHÉSION ─────────────────────────── */

function ApplicationsManager() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [states, setStates] = useState({});

  const zones = useMemo(() => [...new Set(applicationsData.map((a) => a.zone))], []);
  const statuses = useMemo(() => [...new Set(applicationsData.map((a) => a.status))], []);

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
  }, [query, typeFilter, zoneFilter, statusFilter, sort]);

  const merchantCount = applicationsData.filter((a) => a.type === "merchant").length;
  const courierCount = applicationsData.filter((a) => a.type === "courier").length;

  return (
    <section className="space-y-4">
      {/* Filtres rapides par type */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap gap-2">
          {[
            ["all", `Tous (${applicationsData.length})`, "indigo"],
            ["merchant", `🏪 Commerçants (${merchantCount})`, "emerald"],
            ["courier", `🚴 Livreurs (${courierCount})`, "purple"],
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
                      <button type="button" className="small good m-0 flex-1" onClick={() => setCardState(app.id, "Demande acceptée")}>Valider</button>
                      <button type="button" className="small danger m-0" onClick={() => setCardState(app.id, "Demande refusée")}>Rejeter</button>
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

/* ─────────────────────────── CARDS (livraisons livreur / incidents) ─────────────────────────── */

function Cards({ type, role }) {
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
    if (sortBy === "id-desc") return b[0].localeCompare(a[0]);
    if (sortBy === "id-asc") return a[0].localeCompare(b[0]);
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder={type === "issues" ? "Rechercher par ID (ex: INC-042), motif, commerce..." : "Rechercher une livraison (ex: LIV-2026-042, commerce, adresse)..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-black/40 border border-white/15 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400 transition-colors"
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
                  <option value="urgent">🔴 Priorité élevée / Urgent</option>
                  <option value="contact">🟡 À contacter</option>
                  <option value="resolved">🟢 Résolus</option>
                  <option value="suspended">⛔ Comptes suspendus</option>
                </>
              ) : (
                <>
                  <option value="retrait">🔵 Retrait confirmé</option>
                  <option value="livraison">🔹 En livraison</option>
                  <option value="livrée">🟢 Livrées</option>
                </>
              )}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-xs font-semibold text-slate-200 outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="id-desc">Plus récent (ID ↓)</option>
              <option value="id-asc">Plus ancien (ID ↑)</option>
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
          <span className="text-4xl mb-3 block">🔍</span>
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
            const currentLabel = states[id] || (type === "issues" ? title : title);
            const color = getStatusColor(currentLabel);

            if (type === "mine") {
              return (
                <article
                  className="panel action-card flex flex-col justify-between cursor-pointer hover:border-indigo-400/60 hover:shadow-2xl hover:shadow-indigo-950/40 transition-all p-5 border border-white/10 rounded-2xl bg-gradient-to-b from-[#0d172c] to-[#070d1e] relative overflow-hidden group"
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
                  {/* Neon indicator top border */}
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

                    {/* Step Timeline preview */}
                    <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          🏪
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-wider m-0">Point de retrait</p>
                          <p className="text-xs font-bold text-white m-0 group-hover:text-indigo-300 transition-colors truncate">
                            {merchant || title}
                          </p>
                        </div>
                      </div>

                      <div className="ml-3 border-l-2 border-dashed border-white/10 pl-5.5 py-0.5">
                        <span className="text-[0.65rem] font-medium text-slate-400">📦 Colis ~2.4 kg · Format moyen</span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          📍
                        </div>
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
                      {currentLabel === "Retrait confirmé" ? "🚀 Commencer le trajet" : currentLabel === "En livraison" ? "✅ Confirmer la remise" : "✓ Course terminée"}
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
                className="panel action-card flex flex-col justify-between cursor-pointer hover:border-indigo-400/50 hover:shadow-xl hover:shadow-red-950/20 transition-all p-5 border border-white/10 rounded-2xl bg-[#0b1329]/90 relative overflow-hidden group"
                key={id}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.location.href = `/${role}/issues/${id}`;
                  }
                }}
              >
                {/* Ligne d'accentuation latérale */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  currentLabel.toLowerCase().includes("résolu") ? "bg-emerald-500"
                  : currentLabel.toLowerCase().includes("suspendu") ? "bg-red-600"
                  : currentLabel.toLowerCase().includes("élevée") || currentLabel.toLowerCase().includes("urgent") ? "bg-red-500"
                  : "bg-amber-500"
                }`} />

                <div className="space-y-3 pl-1">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black tracking-wider text-red-300 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                        {id}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">⚠️ Signalement</span>
                    </div>
                    <span className={`pill ${getStatusColor(currentLabel)} font-extrabold text-[0.7rem]`}>
                      {currentLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white m-0 group-hover:text-red-300 transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs text-slate-400 m-0 mt-1 font-medium leading-relaxed">
                      {subtitle || merchant}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2 pl-1" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/${role}/issues/${id}`}
                    className="small flex-1 text-center font-bold text-xs py-2 bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25"
                  >
                    Ouvrir le dossier
                  </Link>
                  <button
                    className="small good m-0 text-xs font-bold py-2 px-3"
                    onClick={() => set(id, "Incident résolu")}
                  >
                    ✓ Résoudre
                  </button>
                  <button
                    className="small danger m-0 text-xs font-bold py-2 px-3"
                    onClick={() => set(id, "Compte suspendu")}
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
  const [online, setOnline] = useState(true);
  const [location, setLocation] = useState(false);
  const [coords, setCoords] = useState(null);
  const [radius, setRadius] = useState("5");
  const [locationError, setLocationError] = useState("");

  useEffect(() => {
    const savedOnline = localStorage.getItem("courier_online");
    if (savedOnline !== null) setOnline(savedOnline === "true");
    const savedCoords = localStorage.getItem("courier_coords");
    if (savedCoords) {
      try {
        setCoords(JSON.parse(savedCoords));
        setLocation(true);
      } catch (e) {}
    }
  }, []);

  const handleOnlineToggle = () => {
    const next = !online;
    setOnline(next);
    localStorage.setItem("courier_online", String(next));
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
        localStorage.setItem("courier_coords", JSON.stringify(c));
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
            onChange={(e) => setRadius(e.target.value)}
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
              {coords
                ? `📍 Position GPS : ${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E`
                : "Permet de recommander les livraisons proches et d'optimiser votre tournée."}
            </p>
          </div>
          <button
            className={`small ${location ? "good" : ""}`}
            onClick={requestLocation}
          >
            {location ? "✓ Position GPS partagée" : "Autoriser la géolocalisation"}
          </button>
        </div>
        {locationError && <p className="text-xs text-amber-300 font-medium m-0">{locationError}</p>}
      </div>
    </section>
  );
}

/* ─────────────────────────── DÉTAIL DOSSIER (application-detail / issue-detail) ─────────────────────────── */

function Detail({ type, section }) {
  const [status, setStatus] = useState("");

  const candidateId = section ? section.replace("applications/", "").replace("issues/", "") : null;
  const candidate = applicationsData.find((a) => a.id === candidateId);

  if (type === "application-detail") {
    const app = candidate || {
      id: candidateId || "MER-028",
      type: "merchant",
      name: "Épicerie des Canuts",
      applicant: "Jean Dupont (Gérant)",
      subtitle: "Épicerie fine & produits locaux",
      zone: "Lyon 4e",
      date: "2026-07-22",
      email: "contact@epiceriecanuts.fr",
      phone: "04 78 12 34 56",
      documents: ["Extrait KBIS (moins de 3 mois)", "Pièce d'identité gérant", "RIB professionnel"],
    };
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
                {isMerchant ? "🏪 Candidature Commerçant" : "🚴 Candidature Livreur"}
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
              {app.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors group cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors shrink-0">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-xs font-semibold text-slate-200 truncate">{doc}</p>
                    <p className="m-0 text-[0.65rem] text-slate-500 mt-0.5">Document PDF</p>
                  </div>
                  <span className="text-[0.65rem] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider pr-2">Ouvrir</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-3">
              <button className="button bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-emerald-900/20 shadow-lg text-sm font-bold px-6 py-2.5" onClick={() => setStatus("Dossier validé et compte activé avec succès")}>
                Approuver l'adhésion
              </button>
              <button className="button bg-red-900/50 hover:bg-red-900 border-red-500/30 text-red-100 text-sm font-bold px-6 py-2.5" onClick={() => setStatus("Demande refusée")}>
                Refuser
              </button>
            </div>
            <a href={`mailto:${app.email}`} className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              ✉️ Contacter le demandeur
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

  return (
    <section className="detail panel max-w-3xl p-0 overflow-hidden">
      {/* Hero header */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-600/10 to-transparent">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border bg-red-500/20 text-red-300 border-red-500/30">
            ⚠️ Incident signalé
          </span>
          <span className="text-xs font-mono text-slate-400 font-bold bg-black/20 px-2.5 py-1 rounded-md border border-white/10">{issue[0]}</span>
        </div>
        <h2 className="text-2xl font-black text-white m-0 mb-1 tracking-tight">{issue[1]}</h2>
        <p className="text-sm text-slate-300 m-0">{issue[2]}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            ["Référence incident", issue[0]],
            ["Statut", issue[3]],
            ["Commerce concerné", issue[4]],
            ["Adresse / Destination", issue[5]],
            ["Motif du signalement", issue[1]],
            ["Détails", issue[2]],
          ].map(([k, v]) => (
            <div key={k} className="bg-white/5 rounded-xl p-4 border border-white/5">
              <span className="block text-[0.65rem] font-bold text-slate-500 uppercase tracking-wider mb-1">{k}</span>
              <span className="text-slate-200 font-semibold text-sm">{v}</span>
            </div>
          ))}
        </div>

        {/* Timeline fictive */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Historique
          </h3>
          <div className="space-y-2">
            {[
              ["Aujourd'hui", "Incident signalé par le livreur ou le commerçant"],
              ["Équipe RelayFlow", "Prise en charge en cours — vérification des informations"],
              ["Prochaine étape", "Contact avec les parties concernées sous 24h"],
            ].map(([who, what]) => (
              <div key={who} className="flex items-start gap-3 text-xs rounded-lg bg-black/20 px-3 py-2.5 border border-white/5">
                <span className="font-bold text-slate-400 shrink-0 w-28">{who}</span>
                <span className="text-slate-300">{what}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
          <button className="small good" onClick={() => setStatus("Incident marqué comme résolu")}>✓ Marquer comme résolu</button>
          <button className="small danger" onClick={() => setStatus("Compte concerné suspendu")}>Suspendre le compte</button>
          <button className="small" onClick={() => setStatus("E-mail de contact envoyé")}>✉️ Contacter les parties</button>
        </div>

        {status && (
          <div className={`p-3 rounded-xl border text-sm font-bold flex items-center gap-2 ${
            status.includes('résolu') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : status.includes('suspendu') ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
            ✓ {status}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─────────────────────────── TABLEAU DE LIVRAISONS (générique) ─────────────────────────── */

function GenericTable({ role }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const filtered = useMemo(
    () =>
      [...allDeliveriesData]
        .filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase()))
        .filter((r) => statusFilter === "all" || r[3] === statusFilter)
        .sort((a, b) => (sort === "reference" ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]))),
    [query, sort, statusFilter],
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
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">Plus récent d'abord</option>
            <option value="reference">Trier par référence</option>
          </select>
          {(query || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => { setQuery(""); setStatusFilter("all"); setPage(1); }}
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
              key={r[0]}
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
          delivery={[selectedDelivery[0], selectedDelivery[1], selectedDelivery[2], selectedDelivery[3], null, selectedDelivery[4], selectedDelivery[5], selectedDelivery[6]]}
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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("distance");
  const [zone, setZone] = useState("all");
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const zones = [...new Set(couriersForAssign.map((c) => c[3]))];
  const filtered = [...couriersForAssign]
    .filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase()))
    .filter((r) => zone === "all" || r[3] === zone)
    .sort((a, b) => (sort === "distance" ? a[4] - b[4] : a[1].localeCompare(b[1])));

  return (
    <section className="space-y-4">
      <div className="directory-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom, référence ou véhicule…"
        />
        <select value={zone} onChange={(e) => setZone(e.target.value)}>
          <option value="all">Toutes les zones</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="distance">Trier par distance</option>
          <option value="name">Trier par nom</option>
        </select>
      </div>
      <div className="cards">
        {filtered.map((courier) => (
          <button
            type="button"
            onClick={() => { setSelected(courier); setConfirmed(false); }}
            className="panel action-card text-left transition hover:-translate-y-0.5 hover:border-indigo-300/60"
            key={courier[0]}
          >
            <span className="mini-label">{courier[3]} · {courier[4].toFixed(1)} km</span>
            <h2>{courier[0]} · {courier[1]}</h2>
            <p>{courier[2]}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-bold text-indigo-200">Sélectionner</span>
              <span className="text-xs font-bold text-amber-300">{courier[5]}</span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm flex items-start justify-center"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
        >
          <article
            className="my-8 w-full max-w-lg rounded-2xl border border-white/15 bg-[#0d172b] p-5 shadow-2xl md:p-7 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="eyebrow mb-1">CONFIRMATION DE LIVREUR</p>
                <h2 className="m-0 text-xl font-black tracking-tight text-white">{selected[1]}</h2>
                <p className="mt-1 text-sm text-slate-400">{selected[0]} · {selected[2]}</p>
              </div>
              <button className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 shrink-0" onClick={() => setSelected(null)}>Fermer</button>
            </div>
            {confirmed ? (
              <p className="text-emerald-400 font-bold text-sm">✓ Livreur {selected[1]} assigné avec succès à votre livraison.</p>
            ) : (
              <>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Détails du livreur</p>
                  <dl className="space-y-2 text-sm">
                    {[["Référence", selected[0]], ["Nom", selected[1]], ["Véhicule", selected[2]], ["Zone", selected[3]], ["Distance", `${selected[4]} km`], ["Note", selected[5]]].map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-white/5 pb-1 last:border-0 last:pb-0">
                        <dt className="text-slate-400">{k}</dt>
                        <dd className="font-semibold text-slate-200">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <button className="button w-full border-0 text-center" onClick={() => setConfirmed(true)}>Confirmer ce livreur</button>
              </>
            )}
          </article>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────── PAGES (config) ─────────────────────────── */

const pages = {
  "merchant/deliveries/new": ["Nouvelle livraison", "Créez une livraison et choisissez le livreur.", "delivery"],
  "merchant/deliveries": ["Mes livraisons", "Suivez et gérez vos expéditions.", "table"],
  "merchant/assign-courier": ["Choisir un livreur", "Sélectionnez un livreur pour votre livraison.", "assign-courier"],
  "courier/available": ["Livraisons disponibles", "Recherchez plus ou moins loin de votre zone, puis triez les opportunités.", "available"],
  "courier/deliveries": ["Mes livraisons", "Confirmez le retrait, utilisez la localisation et finalisez la remise.", "mine"],
  "courier/status": ["Mon statut de livreur", "Votre disponibilité détermine les livraisons proposées.", "status"],
  "manager/applications": ["Demandes d'adhésion", "Étudiez les demandes des commerçants et livreurs.", "applications"],
  "manager/issues": ["Problèmes signalés", "Suivez les incidents de livraison et leurs résolutions.", "issues"],
  "manager/merchants": ["Commerçants partenaires", "Consultez et gérez les commerçants de votre périmètre.", "merchants"],
  "manager/couriers": ["Livreurs vérifiés", "Consultez et gérez les livreurs de votre périmètre.", "couriers"],
  "super-manager/managers": ["Tous les managers", "Créez, recherchez et administrez les comptes managers.", "managers"],
  "super-manager/managers/create": ["Créer un manager", "Créez un compte manager avec un mot de passe temporaire.", "manager"],
  "super-manager/merchants": ["Tous les commerçants", "Cliquez sur un commerçant pour voir ses statistiques complètes.", "merchants"],
  "super-manager/couriers": ["Tous les livreurs", "Cliquez sur un livreur pour voir ses statistiques complètes.", "couriers"],
  "super-manager/deliveries": ["Toutes les livraisons", "Vision complète du flux de livraison.", "table"],
  "super-manager/issues": ["Incidents & bannissements", "Résolvez les incidents et suspendez les comptes si nécessaire.", "issues"],
};

/* ─────────────────────────── EXPORT PRINCIPAL ─────────────────────────── */

export default function WorkspacePage({ role, section }) {
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
      <header className="page-header">
        <div>
          <p className="eyebrow">{role.replace("-", " ").toUpperCase()}</p>
          <h1>{title}</h1>
          <p>{desc}</p>
        </div>
        {type === "managers" ? (
          <Link href="/super-manager/managers/create" className="button">Créer un manager</Link>
        ) : (
          !["delivery", "assign-courier"].includes(type) && (
            <Link href={`/${role}`} className="button">Tableau de bord</Link>
          )
        )}
      </header>

      {["delivery", "manager"].includes(type) ? (
        <Form type={type} />
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
      ) : ["issues", "mine"].includes(type) ? (
        <Cards type={type} role={role} />
      ) : ["application-detail", "issue-detail"].includes(type) ? (
        <Detail type={type} section={section} />
      ) : (
        <GenericTable role={role} />
      )}
    </>
  );
}
