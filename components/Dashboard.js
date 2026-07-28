"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStatusColor } from "../lib/utils";

/* ─────────── CONTENU PAR RÔLE ─────────── */
const content = {
  merchant: {
    hello: "Bonjour, Maison Olive",
    sub: "Gardez le contrôle sur les livraisons de votre boutique.",
    primary: ["Créer une livraison", "/merchant/deliveries/new"],
    stats: [
      ["14", "Livraisons ce mois", "indigo", "/merchant/deliveries"],
      ["3", "En cours", "blue", "/merchant/deliveries"],
      ["2", "En attente d'attribution", "amber", "/merchant/assign-courier"],
      ["96%", "Livrées à temps", "emerald", "/merchant/deliveries"],
    ],
    actions: [
      ["Créer une livraison", "/merchant/deliveries/new"],
      ["Mes livraisons", "/merchant/deliveries"],
      ["Mon équipe de livreurs", "/merchant/team"],
      ["Mes finances", "/merchant/finance"],
    ],
    recentActivityTitle: "Vos commandes & livraisons",
    recentActivityDesc: "Dernières commandes et livraisons de votre boutique",
    chartData: [6, 9, 11, 8, 14, 14],
    chartLabel: "Livraisons / mois",
    donut: { value: 96, label: "À temps", color: "#6366f1" },
  },
  courier: {
    hello: "Bonjour, Lucas",
    sub: "Votre tournée du jour et les opportunités près de votre zone.",
    primary: ["Voir les livraisons disponibles", "/courier/available"],
    stats: [
      ["En ligne", "Statut actuel", "emerald", "/courier/status"],
      ["2", "À réaliser", "blue", "/courier/deliveries"],
      ["6", "Disponibles", "indigo", "/courier/available"],
      ["4.9 / 5", "Votre note", "amber", "/courier/deliveries"],
      ["24 €", "Gains aujourd'hui", "purple", "/courier/finance"],
    ],
    actions: [
      ["Voir les livraisons disponibles", "/courier/available"],
      ["Gérer mon statut", "/courier/status"],
      ["Mes livraisons", "/courier/deliveries"],
      ["Mes bons de paiement", "/courier/finance"],
    ],
    recentActivityTitle: "Vos livraisons en cours & à réaliser",
    recentActivityDesc: "Livraisons attribuées et étapes à confirmer",
    chartData: [18, 24, 32, 29, 38, 45],
    chartLabel: "Livraisons réalisées / mois",
    donut: { value: 98, label: "Réussies", color: "#10b981" },
  },
  manager: {
    label: "Manager",
    sub: "Gérez les validations et supervisez les problèmes.",
    primary: ["Inviter un utilisateur", "/manager/invite"],
    stats: [
      ["12", "Demandes à étudier", "amber", "/manager/applications"],
      ["4", "Problèmes ouverts", "red", "/manager/issues"],
      ["48", "Commerçants actifs", "emerald", "/manager/merchants"],
      ["73", "Livreurs vérifiés", "indigo", "/manager/couriers"],
    ],
    actions: [
      ["Inviter Vendeur/Livreur", "/manager/invite"],
      ["Commerçants actifs", "/manager/merchants"],
      ["Livreurs vérifiés", "/manager/couriers"],
      ["Traiter les problèmes", "/manager/issues"],
      ["Facturation & Finances", "/manager/finance"],
    ],
    recentActivityTitle: "Activité récente & Incidents majeurs",
    recentActivityDesc: "Dernières livraisons sensibles et incidents signalés",
    chartData: [8, 12, 10, 15, 11, 16],
    chartLabel: "Nouvelles adhésions / mois",
    barColors: ["#6366f1", "#10b981"],
    barLabels: ["Commerçants", "Livreurs"],
    chartDataB: [4, 7, 5, 9, 6, 9],
  },
  super_manager: {
    label: "Super-manager",
    sub: "Pilotez l'ensemble du réseau RelayFlow, les commerçants, livreurs et managers.",
    primary: ["Créer un manager", "/super_manager/managers"],
    stats: [
      ["126", "Commerçants", "emerald", "/super_manager/merchants"],
      ["214", "Livreurs", "indigo", "/super_manager/couriers"],
      ["18", "Livraisons actives", "blue", "/super_manager/deliveries"],
      ["5", "Incidents ouverts", "red", "/super_manager/issues"],
    ],
    actions: [
      ["Créer un manager", "/super_manager/managers"],
      ["Tous les commerçants", "/super_manager/merchants"],
      ["Tous les livreurs", "/super_manager/couriers"],
      ["Gérer les incidents", "/super_manager/issues"],
      ["Superviser les finances", "/super_manager/finance"],
    ],
    recentActivityTitle: "Flux réseau & Actions système",
    recentActivityDesc: "Alertes majeures, bannissements récents et livraisons clés",
    chartData: [92, 118, 134, 145, 178, 214],
    chartLabel: "Livreurs actifs cumulés",
    donut: { value: 87, label: "Réseau sain", color: "#6366f1" },
  },
};

const deliveriesByRole = {
  merchant: [
    ["LIV-2026-042", "Maison Olive", "Lyon 2e · 14 Rue Victor Hugo", "En livraison", "blue", "Maya Richard"],
    ["LIV-2026-041", "Atelier Céramique", "Villeurbanne · 8 Av. Thiers", "À attribuer", "amber", null],
    ["LIV-2026-040", "Maison Olive", "Lyon 7e · 22 Grande Rue", "Livrée", "green", "Karim Diallo"],
  ],
  courier: [
    ["LIV-2026-042", "Maison Olive", "Lyon 2e · 14 Rue Victor Hugo", "En livraison", "blue", "Lucas Martin"],
    ["LIV-2026-039", "Épicerie des Canuts", "Lyon 4e · 5 Pl. de la Croix-Rousse", "Retrait confirmé", "amber", "Lucas Martin"],
    ["LIV-2026-037", "Atelier Nami", "Lyon 3e · 12 Rue Garibaldi", "Livrée", "green", "Lucas Martin"],
  ],
  manager: [
    ["INC-042", "Colis non remis", "Maison Olive · Client absent", "Urgent", "red", "Maya Richard"],
    ["INC-039", "Retard signalé", "Atelier Nami · 38 min de retard", "En cours", "amber", "Inès Laurent"],
    ["LIV-2026-042", "Livraison prioritaire", "Lyon 2e · Maison Olive", "En livraison", "blue", "Maya Richard"],
  ],
  "super_manager": [
    ["BAN-012", "Livreur suspendu", "Infractions multiples · Marc Leroy", "Suspendu", "red", "Marc Leroy"],
    ["INC-042", "Incident actif", "Maison Olive · 14 Rue Victor Hugo", "Urgent", "red", "Maya Richard"],
    ["LIV-2026-050", "Maison Olive", "Villeurbanne · Grand Large", "En livraison", "blue", "Karim Diallo"],
  ],
};

const months = ["Fév", "Mar", "Avr", "Mai", "Juin", "Juil"];

/* ─────────── GRAPHIQUE EN BARRES SVG ─────────── */
function BarChart({ data, dataB, label, labelsAB }) {
  const max = Math.max(...data, ...(dataB || []));
  return (
    <div className="chart-block">
      <div className="flex items-center justify-between mb-3">
        <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <span className="text-[0.68rem] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          +{Math.round(((data[5] - data[0]) / data[0]) * 100)}% sur 6 mois
        </span>
      </div>
      <div className="h-32 flex items-end justify-between gap-1.5 px-1">
        {data.map((val, i) => {
          const pct = Math.round((val / max) * 100);
          const pctB = dataB ? Math.round((dataB[i] / max) * 100) : null;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[0.62rem] font-bold text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
                {val}
              </span>
              <div className="w-full flex gap-0.5 items-end h-24">
                <div
                  style={{ height: `${pct}%` }}
                  className="flex-1 bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-purple-400 transition-all rounded-t-sm"
                />
                {pctB !== null && (
                  <div
                    style={{ height: `${pctB}%` }}
                    className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-teal-400 transition-all rounded-t-sm"
                  />
                )}
              </div>
              <span className="text-[0.62rem] font-medium text-slate-500">{months[i]}</span>
            </div>
          );
        })}
      </div>
      {labelsAB && (
        <div className="flex items-center gap-4 mt-2 px-1">
          {labelsAB.map((l, i) => (
            <span key={l} className="flex items-center gap-1.5 text-[0.65rem] font-semibold text-slate-400">
              <span className={`w-2 h-2 rounded-full ${i === 0 ? "bg-indigo-400" : "bg-emerald-400"}`} />
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────── GRAPHIQUE DONUT SVG ─────────── */
function Donut({ value, label, color }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
        <text x="44" y="44" textAnchor="middle" dy="0.35em" fill="white" fontSize="14" fontWeight="900">
          {value}%
        </text>
      </svg>
      <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ─────────── MODAL LIVRAISON ─────────── */
function DeliveryModal({ delivery, role, onClose }) {
  if (!delivery) return null;
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm flex items-start justify-center"
      role="dialog" aria-modal="true" onClick={onClose}
    >
      <article
        className="my-8 w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0d172b] p-5 shadow-2xl md:p-7 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="eyebrow mb-1">DÉTAILS DE LA LIVRAISON</p>
            <h2 className="m-0 text-2xl font-black tracking-tight text-white">{delivery[0]}</h2>
            <p className="mt-1 text-sm text-slate-400">{delivery[1]} · {delivery[2]}</p>
          </div>
          <button
            className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 shrink-0"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="m-0 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Informations</p>
          <dl className="grid grid-cols-1 gap-2.5 text-sm md:grid-cols-2">
            {[
              ["Référence", delivery[0]],
              ["Statut", delivery[3]],
              ["Commerçant / Origine", delivery[1]],
              ["Destination", delivery[2]],
              ["Livreur assigné", delivery[5] || "Aucun (À attribuer)"],
              ["Attribution", delivery[5] ? "Validée" : "En attente"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[0.65rem] font-bold uppercase text-slate-500">{k}</dt>
                <dd className="mt-0.5 font-semibold text-slate-200">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {role === "merchant" && !delivery[5] && (
            <Link href="/merchant/assign-courier" className="button flex-1 text-center">
              Choisir un livreur
            </Link>
          )}
          <Link href={`/tracking/${delivery[0]}`} className="small flex-1 text-center">
            Suivi public
          </Link>
        </div>
      </article>
    </div>
  );
}

/* ─────────── DASHBOARD PRINCIPAL ─────────── */
export default function Dashboard({ role }) {
  const d = content[role];
  const deliveries = deliveriesByRole[role] || [];
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [courierStatus, setCourierStatus] = useState("En ligne");
  const [animChart, setAnimChart] = useState(false);

  useEffect(() => {
    if (role === "courier") {
      const saved = localStorage.getItem("courier_online");
      if (saved !== null) setCourierStatus(saved === "true" ? "En ligne" : "Hors ligne");
    }
    const t = setTimeout(() => setAnimChart(true), 300);
    return () => clearTimeout(t);
  }, [role]);

  const statsToDisplay = d.stats.map(([val, lbl, color, href]) => {
    if (role === "courier" && lbl === "Statut actuel") return [courierStatus, lbl, courierStatus === "En ligne" ? "emerald" : "amber", href];
    return [val, lbl, color, href];
  });

  const colorMap = {
    indigo: "text-indigo-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    red: "text-red-400",
    purple: "text-purple-400",
  };

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

      {/* Stats cliquables */}
      <section className="stats">
        {statsToDisplay.map(([n, l, color, href]) => (
          <Link href={href || "#"} key={l} className="panel stat stat-link group">
            <strong className={`${colorMap[color] || "text-white"} group-hover:scale-105 transition-transform inline-block`}>
              {n}
            </strong>
            <span>{l}</span>
          </Link>
        ))}
      </section>



      {/* Grille principale */}
      <section className="dashboard-grid">
        {/* Tableau activité */}
        <div className="panel table-panel">
          <div className="section-title">
            <div>
              <h2>{d.recentActivityTitle}</h2>
              <p>{d.recentActivityDesc}</p>
            </div>
            <Link href={role === "merchant" ? "/merchant/deliveries" : role === "courier" ? "/courier/deliveries" : `/${role}/deliveries`}>
              Tout voir
            </Link>
          </div>
          <div className="mt-4 w-full overflow-x-auto">
            <div className="grid min-w-155 grid-cols-[1.1fr_1.2fr_1fr_auto] gap-3 border-t border-white/10 py-3 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-500">
              <span className="text-start">{role === "manager" || role === "super_manager" ? "Réf." : "Référence"}</span>
              <span className="text-start">{role === "courier" ? "Commerçant" : role === "manager" ? "Titre" : "Commerçant"}</span>
              <span className="text-start">Destination / Info</span>
              <span className="text-end">Statut</span>
            </div>
            {deliveries.map((x) => (
              <div
                className="grid min-w-155 grid-cols-[1.1fr_1.2fr_1fr_auto] gap-3 border-t border-white/10 py-3 text-sm text-slate-200 items-center cursor-pointer hover:bg-white/5 transition-colors"
                key={x[0]}
                onClick={() => setSelectedDelivery(x)}
              >
                <b className="text-start truncate font-mono text-xs text-indigo-300">{x[0]}</b>
                <span className="text-start truncate font-medium">{x[1]}</span>
                <span className="text-start truncate text-slate-400 text-xs">{x[2]}</span>
                <span className="text-end">
                  <span className={`pill whitespace-nowrap ${x[4]}`}>{x[3]}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite : accès rapides + graphique */}
        <div className="dashboard-right-col">
          {/* Accès rapides */}
          <div className="panel actions">
            <h2>Accès rapides</h2>
            {d.actions.map(([l, href]) => (
              <Link href={href} key={href}>{l}</Link>
            ))}
          </div>

          {/* Graphique barres */}
          <div className="panel chart-panel">
            <BarChart
              data={animChart ? d.chartData : d.chartData.map(() => 0)}
              dataB={d.chartDataB}
              label={d.chartLabel}
              labelsAB={d.barLabels}
            />
            {d.donut && (
              <div className="flex items-center justify-center pt-3 border-t border-white/10 mt-3">
                <Donut value={animChart ? d.donut.value : 0} label={d.donut.label} color={d.donut.color} />
              </div>
            )}
          </div>
        </div>
      </section>

      <DeliveryModal delivery={selectedDelivery} role={role} onClose={() => setSelectedDelivery(null)} />
    </>
  );
}
