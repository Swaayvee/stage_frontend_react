"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <div className="ambient-background">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-grid" />
      </div>
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
      </section>
    </main>
  );
}
