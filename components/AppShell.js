"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationCenter from "./NotificationCenter";

const menus = {
  merchant: [
    ["Vue d'ensemble", "/merchant"],
    ["Nouvelle livraison", "/merchant/deliveries/new"],
    ["Mes livraisons", "/merchant/deliveries"],
    ["Assigner un livreur", "/merchant/assign-courier"],
  ],
  courier: [
    ["Mon tableau", "/courier"],
    ["Livraisons disponibles", "/courier/available"],
    ["Mes livraisons", "/courier/deliveries"],
    ["Mon statut", "/courier/status"],
  ],
  "mgr-9a8f2k4x": [
    ["Vue d'ensemble", "/mgr-9a8f2k4x"],
    ["Demandes d'adhésion", "/mgr-9a8f2k4x/applications"],
    ["Commerçants", "/mgr-9a8f2k4x/merchants"],
    ["Livreurs", "/mgr-9a8f2k4x/couriers"],
    ["Problèmes signalés", "/mgr-9a8f2k4x/issues"],
  ],
  "sm-3v8n1w9z": [
    ["Vue globale", "/sm-3v8n1w9z"],
    ["Managers", "/sm-3v8n1w9z/managers"],
    ["Commerçants", "/sm-3v8n1w9z/merchants"],
    ["Livreurs", "/sm-3v8n1w9z/couriers"],
    ["Livraisons", "/sm-3v8n1w9z/deliveries"],
    ["Incidents & bannissements", "/sm-3v8n1w9z/issues"],
  ],
};

const labels = {
  merchant: "Commerçant",
  courier: "Livreur",
  "mgr-9a8f2k4x": "Manager",
  "sm-3v8n1w9z": "Super-manager",
};

const names = {
  merchant: "Maison Olive",
  courier: "Lucas Martin",
  "mgr-9a8f2k4x": "Sarah Bernard",
  "sm-3v8n1w9z": "Alexandre Dubois",
};

export default function AppShell({ role, children }) {
  const pathname = usePathname();
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
            <b>{names[role]}</b>
            <small>{labels[role]} · Modifier mon compte</small>
          </Link>
          <div className="sidebar-bottom-row">
            <NotificationCenter role={role} />
            <Link href="/login">Déconnexion</Link>
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
        {children}
      </main>
    </div>
  );
}
