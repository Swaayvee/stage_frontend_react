"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationCenter from "./NotificationCenter";
import { useRelayFlowOptional } from "../context/RelayFlowProvider";

const menus = {
  merchant: [
    ["Vue d'ensemble", "/merchant"],
    ["Nouvelle livraison", "/merchant/deliveries/new"],
    ["Mes livraisons", "/merchant/deliveries"],
    ["Attribuer les livraisons", "/merchant/assign-courier"],
    ["Mon équipe", "/merchant/team"],
    ["Messages & problèmes", "/merchant/messages"],
    ["Finances & Factures", "/merchant/finance"],
  ],
  courier: [
    ["Mon tableau", "/courier"],
    ["Livraisons disponibles", "/courier/available"],
    ["Mes livraisons", "/courier/deliveries"],
    ["Mes partenariats", "/courier/partnerships"],
    ["Messages & problèmes", "/courier/messages"],
    ["Mon statut", "/courier/status"],
    ["Mes gains", "/courier/finance"],
  ],
  manager: [
    ["Vue d'ensemble", "/manager"],
    ["Créer un utilisateur", "/manager/invite"],
    ["Demandes d'adhésion", "/manager/applications"],
    ["Commerçants", "/manager/merchants"],
    ["Livreurs", "/manager/couriers"],
    ["Livraisons", "/manager/deliveries"],
    ["Problèmes signalés", "/manager/issues"],
    ["Finances & Facturation", "/manager/finance"],
  ],
  super_manager: [
    ["Vue globale", "/super_manager"],
    ["Managers", "/super_manager/managers"],
    ["Commerçants", "/super_manager/merchants"],
    ["Livreurs", "/super_manager/couriers"],
    ["Livraisons", "/super_manager/deliveries"],
    ["Incidents & bannissements", "/super_manager/issues"],
    ["Finances globales", "/super_manager/finance"],
  ],
};

const labels = {
  merchant: "Commerçant",
  courier: "Livreur",
  "manager": "Manager",
  "super_manager": "Super Manager",
};

const fallbackNames = {
  merchant: "Maison Olive",
  courier: "Lucas Martin",
  manager: "Sarah Bernard",
  super_manager: "Super Manager",
};

export default function AppShell({ role, children }) {
  const pathname = usePathname();
  const ctx = useRelayFlowOptional();
  const displayName = ctx?.displayName || fallbackNames[role];
  const items = menus[role] || [];

  return (
    <div className="app-shell">
      <div className="ambient-background">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-orb ambient-orb-three" />
        <span className="ambient-grid" />
      </div>
      <aside className="sidebar">
        <Link href="/" className="brand">
          Relay<span>Flow</span>
        </Link>
        <p className="sidebar-role">ESPACE {labels[role].toUpperCase()}</p>
        <nav>
          {items.map(([label, href]) => {
            const hasExactMatch = items.some((i) => i[1] === pathname);
            const isActive =
              pathname === href ||
              (!hasExactMatch &&
                href !== `/${role}` &&
                pathname.startsWith(href + "/"));
            return (
              <Link key={href} href={href} className={isActive ? "active" : ""}>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <Link className="profile-link" href={`/account?role=${role}`}>
            <b>{displayName}</b>
            <small>{labels[role]} · Modifier mon compte</small>
          </Link>
          <div className="sidebar-bottom-row">
            <NotificationCenter role={role} />
            <Link
              href="/login"
              onClick={() => ctx?.api?.logout?.()}
            >
              Déconnexion
            </Link>
          </div>
        </div>
      </aside>
      <main className="content">
        <div className="mobile-head">
          <Link href="/" className="brand">
            Relay<span>Flow</span>
          </Link>
          <div className="flex items-center gap-3">
            <NotificationCenter role={role} />
            <span>{labels[role]}</span>
          </div>
        </div>
        <div key={pathname} className="route-transition">
          {children}
        </div>
      </main>
    </div>
  );
}
