"use client";
import Link from "next/link";
import { use, useState } from "react";
export default function Tracking({ params }) {
  const [location, setLocation] = useState(false);
  const { reference } = use(params);
  return (
    <main className="tracking">
      <div className="ambient-background" />
      <div className="tracking-card">
        <Link href="/" className="brand">
          Relay<span>Flow</span>
        </Link>
        <p className="eyebrow">SUIVI PUBLIC · {reference}</p>
        <h1>Votre livraison est en route</h1>
        <p className="tracking-copy">
          Votre colis a été récupéré par Lucas Martin. Il vous contactera par
          SMS ou appel avant son arrivée.
        </p>
        <div className="progress">
          <i />
          <i />
          <i className="pending" />
        </div>
        <div className="tracking-steps">
          <span>Colis préparé</span>
          <span>Récupéré</span>
          <span>En livraison</span>
          <span>Livré</span>
        </div>
        <div className="map">
          <span>Position du livreur</span>
          <b>●</b>
          <small>
            {location
              ? "Position partagée · mise à jour il y a 2 min"
              : "La localisation n’est pas encore partagée par le livreur."}
          </small>
        </div>
        <button onClick={() => setLocation(!location)} className="small">
          {location
            ? "Masquer la simulation"
            : "Simuler la localisation du livreur"}
        </button>
        <div className="contact">
          <b>Une question ?</b>
          <p>
            Le livreur vous contacte par le canal choisi par le commerçant :
            SMS, appel ou messagerie.
          </p>
        </div>
      </div>
    </main>
  );
}
