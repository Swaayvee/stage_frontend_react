"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getStatusColor } from "../lib/utils";
import { useRelayFlow } from "../context/RelayFlowProvider";
import { STATUT_LIVRAISON_LABEL } from "../lib/domain";
import { DeliveryModal } from "./WorkspacePage";

function BarChart({ data, labels, label }) {
  const max = Math.max(...data, 1);
  return (
    <div className="chart-block">
      <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{label}</p>
      <div className="grid h-40 grid-cols-6 gap-2 px-1">
        {data.map((val, i) => (
          <div key={i} className="grid min-w-0 grid-rows-[1fr_auto] gap-2">
            <div className="group relative flex min-h-0 items-end rounded-md bg-white/[0.025]">
              <span className="pointer-events-none absolute inset-x-0 top-1 text-center text-[0.62rem] font-bold text-indigo-200 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {val}
              </span>
              <div
                style={{
                  height: val > 0
                    ? `${Math.max(10, Math.round((val / max) * 100))}%`
                    : "2px",
                }}
                className={`w-full rounded-t-md transition-[height] duration-500 ${
                  val > 0
                    ? "bg-gradient-to-t from-indigo-600 to-indigo-400"
                    : "bg-white/10"
                }`}
                title={`${labels[i] || "Mois"} : ${val}`}
              />
            </div>
            <span className="text-[0.62rem] font-medium capitalize text-slate-500">{labels[i] || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        />
        <text x="44" y="44" textAnchor="middle" dy="0.35em" fill="white" fontSize="14" fontWeight="900">
          {value}%
        </text>
      </svg>
      <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function Dashboard({ role }) {
  const router = useRouter();
  const { displayName, viewModel } = useRelayFlow();
  const d = viewModel.dashboard;
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [animChart, setAnimChart] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimChart(true), 300);
    return () => clearTimeout(t);
  }, []);

  const config = useMemo(() => {
    const hello =
      role === "merchant" || role === "courier"
        ? `Bonjour, ${displayName}`
        : role === "manager"
          ? `Bonjour, ${displayName}`
          : `Bonjour, ${displayName}`;

    const byRole = {
      merchant: {
        hello,
        sub: "Gardez le contrôle sur les livraisons de votre boutique.",
        primary: ["Créer une livraison", "/merchant/deliveries/new"],
        stats: [
          [String(d.livraisonsMois), "Livraisons", "indigo", "/merchant/deliveries"],
          [String(d.enCours), "En cours", "blue", "/merchant/deliveries"],
          [String(d.soumises), "En attente d'attribution", "amber", "/merchant/assign-courier"],
          [`${d.onTime}%`, "Livrées à temps", "emerald", "/merchant/deliveries"],
        ],
        actions: [
          ["Créer une livraison", "/merchant/deliveries/new"],
          ["Mes livraisons", "/merchant/deliveries"],
          ["Mon équipe de livreurs", "/merchant/team"],
          ["Mes finances", "/merchant/finance"],
        ],
        recentActivityTitle: "Vos livraisons récentes",
        chartLabel: "Livraisons / mois",
        donut: { value: d.onTime, label: "À temps", color: "#6366f1" },
      },
      courier: {
        hello,
        sub: "Votre tournée du jour et les opportunités près de votre zone.",
        primary: ["Voir les livraisons disponibles", "/courier/available"],
        stats: [
          [d.statutOperationnel === "disponible" ? "Disponible" : d.statutOperationnel, "Statut actuel", d.statutOperationnel === "disponible" ? "emerald" : "amber", "/courier/status"],
          [String(d.enCours), "À réaliser", "blue", "/courier/deliveries"],
          [String(viewModel.availableDeliveries.length), "Disponibles", "indigo", "/courier/available"],
          [`${d.gainsMois.toFixed(2)} €`, "Gains (estim.)", "purple", "/courier/finance"],
        ],
        actions: [
          ["Voir les livraisons disponibles", "/courier/available"],
          ["Gérer mon statut", "/courier/status"],
          ["Mes livraisons", "/courier/deliveries"],
          ["Mes bons de paiement", "/courier/finance"],
        ],
        recentActivityTitle: "Vos livraisons en cours",
        chartLabel: "Livraisons réalisées / mois",
        donut: { value: d.onTime, label: "Réussies", color: "#10b981" },
      },
      manager: {
        hello,
        sub: "Gérez les comptes et supervisez les signalements de votre juridiction.",
        primary: ["Créer un utilisateur", "/manager/invite"],
        stats: [
          [String(viewModel.directoryData.merchants.length + viewModel.directoryData.couriers.length), "Comptes zone", "amber", "/manager/merchants"],
          [String(d.issuesOuverts), "Problèmes ouverts", "red", "/manager/issues"],
          [String(viewModel.directoryData.merchants.length), "Commerçants", "emerald", "/manager/merchants"],
          [String(viewModel.directoryData.couriers.length), "Livreurs", "indigo", "/manager/couriers"],
        ],
        actions: [
          ["Créer Vendeur/Livreur", "/manager/invite"],
          ["Commerçants actifs", "/manager/merchants"],
          ["Livreurs vérifiés", "/manager/couriers"],
          ["Traiter les problèmes", "/manager/issues"],
          ["Facturation & Finances", "/manager/finance"],
        ],
        recentActivityTitle: "Incidents récents",
        chartLabel: "Signalements / mois",
      },
      super_manager: {
        hello,
        sub: "Pilotez l'ensemble du réseau RelayFlow.",
        primary: ["Créer un manager", "/super_manager/managers/create"],
        stats: [
          [String(d.commercants), "Commerçants", "emerald", "/super_manager/merchants"],
          [String(d.livreurs), "Livreurs", "indigo", "/super_manager/couriers"],
          [String(d.enCours + d.soumises), "Livraisons actives", "blue", "/super_manager/deliveries"],
          [String(d.issuesOuverts), "Incidents ouverts", "red", "/super_manager/issues"],
        ],
        actions: [
          ["Créer un manager", "/super_manager/managers/create"],
          ["Tous les commerçants", "/super_manager/merchants"],
          ["Tous les livreurs", "/super_manager/couriers"],
          ["Gérer les incidents", "/super_manager/issues"],
          ["Superviser les finances", "/super_manager/finance"],
        ],
        recentActivityTitle: "Livraisons & incidents récents",
        chartLabel: "Livreurs actifs cumulés",
        donut: { value: Math.min(100, d.onTime + 20), label: "Réseau sain", color: "#6366f1" },
      },
    };
    return byRole[role] || byRole.merchant;
  }, [role, displayName, d, viewModel]);

  const chartData = useMemo(() => {
    if (role === "manager") return d.chart?.reports || [];
    if (role === "courier") return d.chart?.delivered || [];
    return d.chart?.deliveries || [];
  }, [role, d.chart]);

  const recentRows = useMemo(() => {
    const deliveryRows = viewModel.allDeliveriesData.map((row) => ({
      key: `delivery-${row[8]}`,
      kind: "delivery",
      reference: row[0],
      title: row[1],
      detail: row[2],
      status: row[3],
      tone: getStatusColor(row[3]),
      date: row[7],
      data: row,
    }));
    const issueRows = viewModel.issuesData.map((row) => ({
      key: `issue-${row[6]}`,
      kind: "issue",
      reference: row[0],
      title: row[1],
      detail: row[2],
      status: row[3],
      tone: getStatusColor(row[3]),
      date: row[8],
      data: row,
    }));
    if (role === "manager") return issueRows.slice(0, 3);
    if (role === "super_manager") {
      return [...deliveryRows, ...issueRows]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 4);
    }
    return deliveryRows.slice(0, 3);
  }, [role, viewModel]);

  const openRecentItem = (item) => {
    if (item.kind === "issue") {
      router.push(`/${role}/issues/${item.reference}`);
      return;
    }
    setSelectedDelivery(item.data);
  };

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
          <h1>{config.hello}</h1>
          <p>{config.sub}</p>
        </div>
        <Link className="button" href={config.primary[1]}>
          {config.primary[0]}
        </Link>
      </header>

      <section className="stats">
        {config.stats.map(([n, l, color, href]) => (
          <Link href={href || "#"} key={l} className="panel stat stat-link group">
            <strong className={`${colorMap[color] || "text-white"} group-hover:scale-105 transition-transform inline-block`}>
              {n}
            </strong>
            <span>{l}</span>
          </Link>
        ))}
      </section>

      <section className="dashboard-grid">
        <div className="panel table-panel">
          <div className="section-title">
            <div>
              <h2>{config.recentActivityTitle}</h2>
            </div>
            <Link href={role === "merchant" ? "/merchant/deliveries" : role === "courier" ? "/courier/deliveries" : `/${role}/issues`}>
              Tout voir
            </Link>
          </div>
          <div className="mt-4 w-full overflow-x-auto">
            {recentRows.length === 0 ? (
              <p className="text-sm text-slate-400 p-4">Aucune activité récente.</p>
            ) : (
              recentRows.map((item) => (
                <button
                  type="button"
                  className="grid w-full min-w-155 grid-cols-[1.1fr_1.2fr_1fr_auto] gap-3 border-0 border-t border-white/10 bg-transparent py-3 text-left text-sm text-slate-200 items-center cursor-pointer hover:bg-white/5"
                  key={item.key}
                  onClick={() => openRecentItem(item)}
                >
                  <b className="font-mono text-xs text-indigo-300">{item.reference}</b>
                  <span className="truncate font-medium">{item.title}</span>
                  <span className="truncate text-slate-400 text-xs">{item.detail}</span>
                  <span className="text-end"><span className={`pill ${item.tone}`}>{item.status}</span></span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-right-col">
          <div className="panel actions">
            <h2>Accès rapides</h2>
            {config.actions.map(([l, href]) => (
              <Link href={href} key={href}>{l}</Link>
            ))}
          </div>
          <div className="panel chart-panel">
            <BarChart
              data={animChart ? chartData : chartData.map(() => 0)}
              labels={d.chart?.labels || []}
              label={config.chartLabel}
            />
            {config.donut && (
              <div className="flex items-center justify-center pt-3 border-t border-white/10 mt-3">
                <Donut value={animChart ? config.donut.value : 0} label={config.donut.label} color={config.donut.color} />
              </div>
            )}
          </div>
        </div>
      </section>

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
