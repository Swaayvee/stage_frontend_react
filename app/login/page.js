import Link from "next/link";
export default function Login() {
  return (
    <main className="auth-page">
      <div className="ambient-background" />
      <form className="auth-card" action="/merchant">
        <Link href="/" className="brand">
          Relay<span>Flow</span>
        </Link>
        <p className="eyebrow">CONNEXION</p>
        <h1>Bienvenue</h1>
        <p>Votre espace est déterminé automatiquement par votre compte.</p>
        <label>
          Identifiant ou e-mail
          <input name="login" placeholder="nom@exemple.fr" required />
        </label>
        <label>
          Mot de passe
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </label>
        <button className="button login-btn">Se connecter</button>
        <small>
          Pas encore inscrit ? <Link href="/signup">Déposer une demande</Link>
        </small>
      </form>
    </main>
  );
}
