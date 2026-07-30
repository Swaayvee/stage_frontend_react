"use client";

import Link from "next/link";

export default function ErrorPage({ reset }) {
  return (
    <main className="error-page">
      <div className="ambient-background" />
      <section className="error-card">
        <Link href="/" className="brand">Relay<span>Flow</span></Link>
        <p className="error-card__code">UNE ERREUR EST SURVENUE</p>
        <h1>Cette page n’a pas pu être affichée</h1>
        <p>
          Vos données ne sont pas perdues. Vous pouvez réessayer ou revenir à l’accueil.
        </p>
        <div className="error-card__actions">
          <button type="button" className="button" onClick={reset}>Réessayer</button>
          <Link href="/" className="small">Retour à l’accueil</Link>
        </div>
      </section>
    </main>
  );
}
