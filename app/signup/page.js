import Link from "next/link";

const profiles = [
  [
    "Commerçant",
    "/signup/merchant",
    "Une boutique ou un commerce avec un point de vente fixe.",
  ],
  [
    "E-commerçant",
    "/signup/ecommerce",
    "Une activité de vente en ligne, avec préparation de commandes.",
  ],
  [
    "Commerçant mobile",
    "/signup/mobile-merchant",
    "Une activité itinérante : marché, food truck ou vente mobile.",
  ],
  [
    "Livreur",
    "/signup/courier",
    "Vous souhaitez rejoindre le réseau de livraison RelayFlow.",
  ],
];

export default function SignupChoice() {
  return (
    <main className="auth-page">
      <div className="ambient-background" />
      <section className="choice-card">
        <Link href="/" className="brand">
          Relay<span>Flow</span>
        </Link>
        <p className="eyebrow">DEMANDE D’ADHÉSION</p>
        <h1>Quel est votre profil ?</h1>
        <p>
          Chaque activité possède son propre formulaire afin de constituer le
          dossier adapté.
        </p>
        <div className="signup-choices">
          {profiles.map(([title, href, text]) => (
            <Link href={href} key={href}>
              <span>→</span>
              <b>{title}</b>
              <small>{text}</small>
            </Link>
          ))}
        </div>
        <small className="choice-login">
          Vous avez déjà un compte ? <Link href="/login">Se connecter</Link>
        </small>
      </section>
    </main>
  );
}
