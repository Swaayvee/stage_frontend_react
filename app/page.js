"use client";
import Link from "next/link";
import { useState } from "react";

const destinations = [
  ["Commerçant", "/merchant", "Créer, attribuer et suivre vos livraisons."],
  ["Livreur", "/courier", "Choisir et réaliser les livraisons disponibles."],
  ["Manager", "/manager", "Étudier les adhésions et résoudre les incidents."],
  [
    "Super-manager",
    "/super-manager",
    "Vision globale, comptes managers et modération.",
  ],
];

export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <main className="landing">
      <div className="ambient-background">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-grid" />
      </div>
      <Link className="tracking-shortcut" href="/tracking/RF-2026-042">
        Suivre une livraison ↗
      </Link>
      <section className="hero">
        <p className="eyebrow">RELAYFLOW · LOGISTIQUE LOCALE</p>
        <h1>
          Chaque livraison
          <br />
          <em>à la bonne étape.</em>
        </h1>
        <p className="lead">
          RelayFlow met en relation commerçants, livreurs et points relais pour
          que chaque colis arrive simplement, avec une visibilité complète à
          chaque instant.
        </p>
        <div className="home-actions">
          <Link href="/login">Se connecter</Link>
          <Link href="/signup">S’inscrire</Link>
        </div>
        <div className="demo-entry">
          <button onClick={() => setDemoOpen(!demoOpen)}>
            {demoOpen
              ? "Fermer la démonstration"
              : "Continuer la démonstration"}{" "}
            <span>{demoOpen ? "↑" : "↓"}</span>
          </button>
          <p>Accès rapide aux interfaces de démonstration.</p>
        </div>
        {demoOpen && (
          <div className="role-grid">
            {destinations.map(([name, href, text]) => (
              <Link className="role-card" href={href} key={href}>
                <span>→</span>
                <h2>{name}</h2>
                <p>{text}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
