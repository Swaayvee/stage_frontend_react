"use client";
import Link from "next/link";
import { useState } from "react";

const content = {
  merchant: {
    hello: "Bonjour, Maison Olive",
    sub: "Gardez le contrôle sur les livraisons de votre boutique.",
    primary: ["Créer une livraison", "/merchant/deliveries/new"],
    stats: [
      ["14", "Livraisons ce mois"],
      ["3", "En cours"],
      ["2", "En attente d'attribution"],
      ["96%", "Livrées à temps"],
    ],
    actions: [
      ["Créer une livraison", "/merchant/deliveries/new"],
    ],
    recentActivityTitle: "Vos commandes & livraisons",
    recentActivityDesc: "Dernières commandes et livraisons de votre boutique",
  },
  courier: {
    hello: "Bonjour, Lucas",
    sub: "Votre tournée du jour et les opportunités près de votre zone.",
    primary: ["Voir les livraisons disponibles", "/courier/available"],
    stats: [
      ["En ligne", "Statut actuel"],
      ["2", "Livraisons à réaliser"],
      ["6", "Livraisons disponibles"],
      ["4.9 / 5", "Votre note"],
    ],
    actions: [
      ["Voir les livraisons disponibles", "/courier/available"],
      ["Gérer mon statut", "/courier/status"],
      ["Mes livraisons", "/courier/deliveries"],
    ],
    recentActivityTitle: "Vos livraisons",
    recentActivityDesc: "Livraisons en cours et à réaliser",
  },
  manager: {
    hello: "Bonjour, Sarah",
    sub: "Vous avez des demandes et incidents à traiter aujourd'hui.",
    primary: ["Étudier les adhésions", "/manager/applications"],
    stats: [
      ["12", "Demandes à étudier"],
      ["4", "Problèmes ouverts"],
      ["48", "Commerçants actifs"],
      ["73", "Livreurs vérifiés"],
    ],
    actions: [
      ["Étudier les adhésions", "/manager/applications"],
      ["Traiter les problèmes", "/manager/issues"],
    ],
    recentActivityTitle: "Incidents & bannissements",
    recentActivityDesc: "Derniers incidents et actions importantes",
  },
  "super-manager": {
    hello: "Vue globale",
    sub: "Pilotez le réseau RelayFlow et les accès de vos équipes.",
    primary: ["Créer un manager", "/super-manager/managers"],
    stats: [
      ["126", "Commerçants"],
      ["214", "Livreurs"],
      ["18", "Livraisons actives"],
      ["5", "Incidents ouverts"],
    ],
    actions: [
      ["Créer un manager", "/super-manager/managers"],
      ["Voir les livraisons", "/super-manager/deliveries"],
      ["Gérer les incidents", "/super-manager/issues"],
    ],
    recentActivityTitle: "Dernières informations majeures",
    recentActivityDesc: "Incidents majeurs, bannissements et livraisons récentes",
  },
};

const deliveriesByRole = {
  merchant: [
    ["RF-2026-042", "Maison Olive", "Lyon 2e", "En livraison", "blue"],
    ["RF-2026-041", "Atelier Céramique", "Villeurbanne", "À attribuer", "amber"],
    ["RF-2026-040", "Maison Olive", "Lyon 7e", "Livrée", "green"],
  ],
  courier: [
    ["RF-2026-042", "Maison Olive", "Lyon 2e", "En livraison", "blue"],
    ["RF-2026-041", "Atelier Céramique", "Villeurbanne", "En cours", "amber"],
  ],
  manager: [
    ["INC-042", "Colis non remis", "Maison Olive", "En attente", "red"],
    ["INC-039", "Retard signalé", "Atelier Nami", "Résolu", "green"],
  ],
  "super-manager": [
    ["BAN-012", "Livreur suspendu", "Infractions multiples", "Actif", "red"],
    ["INC-042", "Colis non remis", "Maison Olive", "En attente", "amber"],
  ],
};

function DeliveryModal({ delivery, role, onClose }) {
  if (!delivery) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <article className="mx-auto my-6 w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0d172b] p-5 shadow-2xl md:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">DÉTAILS DE LA LIVRAISON</p>
            <h2 className="m-0 text-2xl font-black tracking-tight">{delivery[0]}</h2>
            <p className="mt-1 text-sm text-slate-400">{delivery[1]} · {delivery[2]}</p>
          </div>
          <button className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10" onClick={onClose}>Fermer</button>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Informations</p>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-xs text-slate-500">Référence</dt>
                <dd className="text-sm">{delivery[0]}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{role === "manager" || role === "super-manager" ? "Titre" : "Commerçant"}</dt>
                <dd className="text-sm">{delivery[1]}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Destination</dt>
                <dd className="text-sm">{delivery[2]}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Statut</dt>
                <dd className="text-sm"><span className={"pill whitespace-nowrap " + delivery[4]}>{delivery[3]}</span></dd>
              </div>
            </dl>
          </div>
          {(role === "merchant" || role === "courier") && (
            <button className="w-full rounded-lg border border-indigo-300/30 bg-indigo-500/15 px-3 py-2 text-sm font-bold text-indigo-100 hover:bg-indigo-500/25">
              {role === "merchant" ? "Choisir un livreur" : "Accepter cette livraison"}
            </button>
          )}
        </div>
      </article>
    </div>
  );
}

export default function Dashboard({ role }) {
  const d = content[role];
  const deliveries = deliveriesByRole[role] || [];
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">TABLEAU DE BORD</p>
          <h1>{d.hello}</h1>
          <p>{d.sub}</p>
        </div>
        <Link className="button" href={d.primary[1]}>
          {d.primary[0]}
        </Link>
      </header>
      <section className="stats">
        {d.stats.map(([n, l]) => (
          <div className="panel stat" key={l}>
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </section>
      <section className="dashboard-grid">
        <div className="panel table-panel">
          <div className="section-title">
            <div>
              <h2>{d.recentActivityTitle}</h2>
              <p>{d.recentActivityDesc}</p>
            </div>
            <Link href={`/${role}/deliveries`}>Tout voir</Link>
          </div>
          <div className="mt-4 w-full overflow-x-auto">
            <div className="grid min-w-155 grid-cols-[1.1fr_1.2fr_1fr_auto] gap-3 border-t border-white/10 py-3 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-500">
              <span className="text-start">{role === "manager" || role === "super-manager" ? "Réf." : "Référence"}</span>
              <span className="text-start">{role === "courier" ? "Commerçant" : role === "manager" ? "Titre" : "Commerçant"}</span>
              <span className="text-start">Destination</span>
              <span className="text-end">Statut</span>
            </div>
            {deliveries.map((x) => (
              <div 
                className="grid min-w-155 grid-cols-[1.1fr_1.2fr_1fr_auto] gap-3 border-t border-white/10 py-3 text-sm text-slate-200 items-center cursor-pointer hover:bg-white/5 transition-colors" 
                key={x[0]}
                onClick={() => setSelectedDelivery(x)}
              >
                <b className="text-start truncate">{x[0]}</b>
                <span className="text-start truncate">{x[1]}</span>
                <span className="text-start truncate">{x[2]}</span>
                <span className="text-end"><span className={"pill whitespace-nowrap " + x[4]}>{x[3]}</span></span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel actions">
          <h2>Accès rapides</h2>
          {d.actions.map(([l, href]) => (
            <Link href={href} key={href}>
              {l}
              <span>→</span>
            </Link>
          ))}
        </div>
      </section>
      <DeliveryModal delivery={selectedDelivery} role={role} onClose={() => setSelectedDelivery(null)} />
    </>
  );
}
