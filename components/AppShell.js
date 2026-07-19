"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = {
  merchant: [
    ["Vue d’ensemble", "/merchant", "▦"],
    ["Nouvelle livraison", "/merchant/deliveries/new", "＋"],
    ["Livraisons", "/merchant/deliveries", "□"],
    ["Livreurs", "/merchant/couriers", "♙"],
    ["Points relais", "/merchant/relay-points", "⌖"],
  ],
  courier: [
    ["Mon tableau", "/courier", "▦"],
    ["Livraisons disponibles", "/courier/available", "□"],
    ["Mes livraisons", "/courier/deliveries", "✓"],
    ["Mon statut", "/courier/status", "◌"],
  ],
  manager: [
    ["Vue d’ensemble", "/manager", "▦"],
    ["Demandes d’adhésion", "/manager/applications", "□"],
    ["Problèmes signalés", "/manager/issues", "!"],
  ],
  "super-manager": [
    ["Vue globale", "/super-manager", "▦"],
    ["Managers", "/super-manager/managers", "♙"],
    ["Commerçants", "/super-manager/merchants", "⌂"],
    ["Livreurs", "/super-manager/couriers", "♧"],
    ["Livraisons", "/super-manager/deliveries", "□"],
    ["Incidents & bannissements", "/super-manager/issues", "!"],
  ],
};
const labels = {
  merchant: "Commerçant",
  courier: "Livreur",
  manager: "Manager",
  "super-manager": "Super-manager",
};
export default function AppShell({ role, children }) {
  const pathname = usePathname(),
    items = menus[role];
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
          {items.map(([label, href, icon]) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "active" : ""}
            >
              <i>{icon}</i>
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link className="profile-link" href={`/account?role=${role}`}>
            <b>
              {role === "merchant"
                ? "Maison Olive"
                : role === "courier"
                  ? "Lucas Martin"
                  : role === "manager"
                    ? "Sarah Bernard"
                    : "Alexandre Dubois"}
            </b>
            <small>{labels[role]} · Modifier mon compte</small>
          </Link>
          <Link href="/login">Déconnexion</Link>
        </div>
      </aside>
      <main className="content">
        <div className="mobile-head">
          <Link href="/" className="brand">
            Relay<span>Flow</span>
          </Link>
          <span>{labels[role]}</span>
        </div>
        {children}
      </main>
    </div>
  );
}
