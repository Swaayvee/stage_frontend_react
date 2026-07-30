import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="error-page">
      <div className="ambient-background" />
      <section className="error-card">
        <Link href="/" className="brand">Relay<span>Flow</span></Link>
        <p className="error-card__code">ERREUR 404</p>
        <h1>Page introuvable</h1>
        <p>
          Le lien est peut-être incorrect ou la page a été déplacée.
        </p>
        <div className="error-card__actions">
          <Link href="/" className="button">Retour à l’accueil</Link>
        </div>
      </section>
    </main>
  );
}
