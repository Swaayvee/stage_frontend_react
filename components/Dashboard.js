import Link from "next/link";

const content = {
  merchant: {
    hello: "Bonjour, Maison Olive",
    sub: "Gardez le contrôle sur les livraisons de votre boutique.",
    primary: ["Créer une livraison", "/merchant/deliveries/new"],
    stats: [
      ["14", "Livraisons ce mois"],
      ["3", "En cours"],
      ["2", "En attente d’attribution"],
      ["96%", "Livrées à temps"],
    ],
    actions: [
      ["Créer une livraison", "/merchant/deliveries/new"],
      ["Consulter les livreurs", "/merchant/couriers"],
      ["Gérer les points relais", "/merchant/relay-points"],
    ],
  },
  courier: {
    hello: "Bonjour, Lucas",
    sub: "Votre tournée du jour et les opportunités près de votre zone.",
    primary: ["Voir les livraisons disponibles", "/courier/available"],
    stats: [
      ["En ligne", "Statut actuel"],
      ["2", "Livraisons à réaliser"],
      ["6", "Livraisons disponibles"],
      ["4.9 / 5", "Votre note"],
    ],
    actions: [
      ["Voir les livraisons disponibles", "/courier/available"],
      ["Gérer mon statut", "/courier/status"],
      ["Mes livraisons", "/courier/deliveries"],
    ],
  },
  manager: {
    hello: "Bonjour, Sarah",
    sub: "Vous avez des demandes et incidents à traiter aujourd’hui.",
    primary: ["Étudier les adhésions", "/manager/applications"],
    stats: [
      ["12", "Demandes à étudier"],
      ["4", "Problèmes ouverts"],
      ["48", "Commerçants actifs"],
      ["73", "Livreurs vérifiés"],
    ],
    actions: [
      ["Étudier les adhésions", "/manager/applications"],
      ["Traiter les problèmes", "/manager/issues"],
    ],
  },
  "super-manager": {
    hello: "Vue globale",
    sub: "Pilotez le réseau RelayFlow et les accès de vos équipes.",
    primary: ["Créer un manager", "/super-manager/managers"],
    stats: [
      ["126", "Commerçants"],
      ["214", "Livreurs"],
      ["18", "Livraisons actives"],
      ["5", "Incidents ouverts"],
    ],
    actions: [
      ["Créer un manager", "/super-manager/managers"],
      ["Voir les livraisons", "/super-manager/deliveries"],
      ["Gérer les incidents", "/super-manager/issues"],
    ],
  },
};
const deliveries = [
  ["RF-2026-042", "Maison Olive", "Lyon 2e", "En livraison", "blue"],
  ["RF-2026-041", "Atelier Céramique", "Villeurbanne", "À attribuer", "amber"],
  ["RF-2026-040", "Maison Olive", "Lyon 7e", "Livrée", "green"],
];
export default function Dashboard({ role }) {
  const d = content[role];
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">TABLEAU DE BORD</p>
          <h1>{d.hello}</h1>
          <p>{d.sub}</p>
        </div>
        <Link className="button" href={d.primary[1]}>
          {d.primary[0]}
        </Link>
      </header>
      <section className="stats">
        {d.stats.map(([n, l]) => (
          <div className="panel stat" key={l}>
            <strong>{n}</strong>
            <span>{l}</span>
          </div>
        ))}
      </section>
      <section className="dashboard-grid">
        <div className="panel table-panel">
          <div className="section-title">
            <div>
              <h2>Activité récente</h2>
              <p>Dernières livraisons du réseau</p>
            </div>
            <Link href={`/${role}/deliveries`}>Tout voir →</Link>
          </div>
          <div className="table">
            <div className="row table-head">
              <span>Référence</span>
              <span>Commerçant</span>
              <span>Destination</span>
              <span>Statut</span>
            </div>
            {deliveries.map((x) => (
              <div className="row" key={x[0]}>
                <b>{x[0]}</b>
                <span>{x[1]}</span>
                <span>{x[2]}</span>
                <span className={"pill " + x[4]}>{x[3]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel actions">
          <h2>Accès rapides</h2>
          {d.actions.map(([l, href]) => (
            <Link href={href} key={href}>
              {l}
              <span>→</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
