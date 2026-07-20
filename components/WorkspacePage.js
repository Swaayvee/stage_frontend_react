"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

const pages = {
  "merchant/deliveries/new": [
    "Nouvelle livraison",
    "Créez une livraison et choisissez son mode d’attribution.",
    "delivery",
  ],
  "merchant/deliveries": [
    "Mes livraisons",
    "Suivez et gérez vos expéditions.",
    "table",
  ],
  "merchant/couriers": [
    "Liste des livreurs",
    "Livreurs disponibles dans vos zones.",
    "table",
  ],
  "merchant/relay-points": [
    "Points relais",
    "Informez le point relais lorsqu’un livreur ne peut pas assurer la livraison.",
    "relay",
  ],
  "courier/available": [
    "Livraisons disponibles",
    "Recherchez plus ou moins loin de votre zone, puis triez les opportunités.",
    "available",
  ],
  "courier/deliveries": [
    "Mes livraisons",
    "Confirmez le retrait, utilisez la localisation et finalisez la remise.",
    "mine",
  ],
  "courier/status": [
    "Mon statut de livreur",
    "Votre disponibilité détermine les livraisons proposées.",
    "status",
  ],
  "manager/applications": [
    "Demandes d’adhésion",
    "Étudiez les demandes des commerçants et livreurs.",
    "applications",
  ],
  "manager/applications/MER-028": [
    "Dossier d’adhésion · MER-028",
    "Épicerie des Canuts — demande commerçant à étudier.",
    "application-detail",
  ],
  "manager/applications/LIV-156": [
    "Dossier d’adhésion · LIV-156",
    "Nora Petit — demande livreur à étudier.",
    "application-detail",
  ],
  "manager/issues": [
    "Problèmes signalés",
    "Suivez les incidents de livraison et leurs résolutions.",
    "issues",
  ],
  "manager/issues/INC-042": [
    "Incident INC-042",
    "Colis non remis : le client était absent lors de la livraison.",
    "issue-detail",
  ],
  "manager/issues/INC-039": [
    "Incident INC-039",
    "Retard signalé sur une livraison de l’Atelier Nami.",
    "issue-detail",
  ],
  "super-manager/managers": [
    "Tous les managers",
    "Créez, recherchez et administrez les comptes managers.",
    "managers",
  ],
  "super-manager/managers/create": [
    "Créer un manager",
    "Créez un compte manager avec un mot de passe temporaire.",
    "manager",
  ],
  "super-manager/merchants": [
    "Tous les commerçants",
    "Recherchez les commerces de toute la plateforme.",
    "merchants",
  ],
  "super-manager/couriers": [
    "Tous les livreurs",
    "Recherchez et contrôlez les livreurs de tout le réseau.",
    "couriers",
  ],
  "super-manager/deliveries": [
    "Toutes les livraisons",
    "Vision complète du flux de livraison.",
    "table",
  ],
  "super-manager/issues": [
    "Incidents & bannissements",
    "Résolvez les incidents et suspendez les comptes si nécessaire.",
    "issues",
  ],
  "super-manager/issues/INC-042": [
    "Incident INC-042",
    "Colis non remis : le client était absent lors de la livraison.",
    "issue-detail",
  ],
  "super-manager/issues/INC-039": [
    "Incident INC-039",
    "Retard signalé sur une livraison de l’Atelier Nami.",
    "issue-detail",
  ],
};
const directory = {
  managers: [
    ["MGR-001", "Sarah Bernard", "sarah.bernard@relayflow.fr", "Lyon Centre"],
    ["MGR-002", "Mehdi Benali", "mehdi.benali@relayflow.fr", "Rhône Nord"],
    [
      "MGR-003",
      "Clara Fontaine",
      "clara.fontaine@relayflow.fr",
      "Villeurbanne",
    ],
  ],
  merchants: [
    ["MER-014", "Maison Olive", "commerce@maisonolive.fr", "Lyon 2e"],
    ["ECM-021", "Atelier Nami", "bonjour@atelier-nami.fr", "Lyon 7e"],
    ["MOB-007", "Le Camion Vert", "contact@camionvert.fr", "Lyon Métropole"],
  ],
  couriers: [
    ["LIV-103", "Maya Richard", "Vélo électrique", "Lyon 3e"],
    ["LIV-121", "Karim Diallo", "Scooter", "Villeurbanne"],
    ["LIV-144", "Inès Laurent", "Voiture", "Lyon 7e"],
  ],
};
const deliveries = [
  ["LIV-2026-051", "1,8 km · Lyon 3e", "Atelier Nami", "Automatique"],
  ["LIV-2026-052", "3,2 km · Villeurbanne", "Maison Olive", "Manuelle"],
  ["LIV-2026-053", "6,7 km · Lyon 9e", "Le Camion Vert", "Automatique"],
];
function Form({ type }) {
  const [sent, setSent] = useState(false);
  const fields =
    type === "delivery"
      ? [
          ["Nom du client", "text"],
          ["Téléphone du client", "tel"],
          ["Adresse de livraison", "text"],
          ["Point relais (si nécessaire)", "text"],
          ["Mode d’attribution", "select"],
        ]
      : type === "relay"
        ? [
            ["Point relais", "select"],
            ["Référence de la livraison", "text"],
            ["Message au point relais", "textarea"],
          ]
        : [
            ["Prénom et nom", "text"],
            ["E-mail professionnel", "email"],
            ["Zone ou périmètre", "text"],
            ["Mot de passe temporaire", "password"],
          ];
  return (
    <form
      className="form panel"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      {fields.map(([l, t]) => (
        <label key={l}>
          {l}
          {t === "textarea" ? (
            <textarea placeholder={l} />
          ) : t === "select" ? (
            <select defaultValue="">
              <option value="" disabled>
                Choisir une option
              </option>
              <option>Automatique</option>
              <option>Validation manuelle</option>
            </select>
          ) : (
            <input type={t} placeholder={l} />
          )}
        </label>
      ))}
      {sent && (
        <p className="success">✓ Enregistrement effectué avec succès.</p>
      )}
      <button className="button">
        {type === "delivery" ? "Créer la livraison" : "Créer le compte manager"}
      </button>
    </form>
  );
}
function Directory({ type }) {
  const [query, setQuery] = useState("");
  const rows = directory[type];
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        r.join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [rows, query],
  );
  const labels =
    type === "managers"
      ? ["Référence", "Manager", "E-mail", "Périmètre"]
      : type === "merchants"
        ? ["Référence", "Commerce", "E-mail", "Ville"]
        : ["Référence", "Livreur", "Véhicule", "Zone"];
  return (
    <div className="panel table-panel">
      <div className="directory-toolbar">
        <input
          aria-label="Rechercher"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Rechercher un ${type === "merchants" ? "commerçant" : type === "couriers" ? "livreur" : "manager"}…`}
        />
        <span>{filtered.length} résultat(s)</span>
      </div>
      <div className="table">
        <div className="row table-head">
          {labels.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        {filtered.map((r) => (
          <div className="row" key={r[0]}>
            {r.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
function DeliverySearch() {
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState("distance");
  const filtered = useMemo(
    () =>
      [...deliveries]
        .filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) =>
          sort === "distance"
            ? parseFloat(a[1]) - parseFloat(b[1])
            : a[3].localeCompare(b[3]),
        ),
    [query, sort],
  );
  return (
    <>
      <div className="directory-toolbar delivery-filter">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ville, commerçant ou référence…"
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="distance">Trier par distance</option>
          <option value="mode">Trier par mode d’attribution</option>
        </select>
      </div>
      <div className="cards">
        {filtered.map(([ref, distance, merchant, mode]) => (
          <article className="panel action-card" key={ref}>
            <span className="mini-label">
              {mode === "Automatique"
                ? "Acceptation automatique"
                : "Validation du commerçant"}
            </span>
            <h2>{ref}</h2>
            <p>
              {merchant} · {distance}
            </p>
            <button className="small good">Accepter cette livraison</button>
          </article>
        ))}
      </div>
    </>
  );
}
function Cards({ type, role }) {
  const [states, setStates] = useState({});
  const items =
    type === "applications"
      ? [
          [
            "MER-028",
            "Demande commerçant",
            "Épicerie des Canuts · Lyon 4e",
            "Dossier complet",
          ],
          [
            "LIV-156",
            "Demande livreur",
            "Nora Petit · Vélo électrique",
            "Justificatif à vérifier",
          ],
        ]
      : type === "issues"
        ? [
            [
              "INC-042",
              "Colis non remis",
              "Maison Olive · Client absent",
              "Priorité élevée",
            ],
            [
              "INC-039",
              "Retard signalé",
              "Atelier Nami · 38 min",
              "À contacter",
            ],
          ]
        : [
            [
              "LIV-2026-042",
              "Retrait confirmé",
              "Maison Olive",
              "Contacter le client",
            ],
            ["LIV-2026-037", "Livrée", "Atelier Nami", "Terminée"],
          ];
  const set = (id, value) => setStates((s) => ({ ...s, [id]: value }));
  return (
    <div className="cards">
      {items.map(([id, title, subtitle, label]) => (
        <article className="panel action-card" key={id}>
          <span className="mini-label">{states[id] || label}</span>
          <h2>
            {id} · {title}
          </h2>
          <p>{subtitle}</p>
          <div>
            {type === "applications" ? (
              <>
                <Link className="small" href={`/manager/applications/${id}`}>
                  Voir le dossier
                </Link>
                <button
                  className="small good"
                  onClick={() => set(id, "Demande acceptée")}
                >
                  Accepter
                </button>
                <button
                  className="small danger"
                  onClick={() => set(id, "Demande refusée")}
                >
                  Refuser
                </button>
              </>
            ) : type === "issues" ? (
              <>
                <Link
                  className="small inline-flex items-center justify-center text-center"
                  href={`/${role}/issues/${id}`}
                >
                  Voir l’incident
                </Link>
                <button
                  className="small good"
                  onClick={() => set(id, "Incident résolu")}
                >
                  Résoudre
                </button>
                <button
                  className="small danger"
                  onClick={() => set(id, "Compte suspendu")}
                >
                  Suspendre
                </button>
              </>
            ) : (
              <>
                <button
                  className="small good"
                  onClick={() => set(id, "Étape confirmée")}
                >
                  Confirmer l’étape
                </button>
                <button className="small">Itinéraire / contacter</button>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
function CourierStatus() {
  const [online, setOnline] = useState(true),
    [location, setLocation] = useState(false),
    [radius, setRadius] = useState("5");
  return (
    <section className="status-panel panel">
      <div className="status-hero">
        <div>
          <p className="eyebrow">DISPONIBILITÉ</p>
          <h2>{online ? "Vous êtes disponible" : "Vous êtes indisponible"}</h2>
          <p>
            {online
              ? "Vous recevez actuellement des propositions de livraison."
              : "Aucune nouvelle livraison ne vous sera proposée."}
          </p>
        </div>
        <button
          onClick={() => setOnline(!online)}
          className={`status-toggle ${online ? "is-on" : ""}`}
          aria-label="Changer la disponibilité"
        >
          <i />
        </button>
      </div>
      <div className="status-settings">
        <label>
          Zone de recherche
          <select value={radius} onChange={(e) => setRadius(e.target.value)}>
            <option value="3">Jusqu’à 3 km</option>
            <option value="5">Jusqu’à 5 km</option>
            <option value="10">Jusqu’à 10 km</option>
            <option value="20">Jusqu’à 20 km</option>
          </select>
          <small>
            Vous pourrez toujours consulter les livraisons plus éloignées
            manuellement.
          </small>
        </label>
        <div className="location-row">
          <div>
            <b>Partager ma localisation</b>
            <p>
              Permet de recommander les livraisons proches et de suivre la
              tournée.
            </p>
          </div>
          <button
            className={`small ${location ? "good" : ""}`}
            onClick={() => setLocation(!location)}
          >
            {location ? "Localisation autorisée" : "Autoriser"}
          </button>
        </div>
      </div>
    </section>
  );
}
function Detail({ type }) {
  const [status, setStatus] = useState("");
  if (type === "application-detail")
    return (
      <section className="detail panel">
        <h2>Dossier de demande</h2>
        <dl>
          <div>
            <dt>Profil</dt>
            <dd>Commerçant / Livreur partenaire</dd>
          </div>
          <div>
            <dt>Identité</dt>
            <dd>Dossier vérifié</dd>
          </div>
          <div>
            <dt>Justificatif</dt>
            <dd>Pièce jointe disponible (PDF)</dd>
          </div>
          <div>
            <dt>Zone</dt>
            <dd>Lyon Métropole</dd>
          </div>
        </dl>
        <button
          className="small good"
          onClick={() => setStatus("Demande acceptée")}
        >
          Valider l’adhésion
        </button>
        <button
          className="small danger"
          onClick={() => setStatus("Demande refusée")}
        >
          Refuser
        </button>
        {status && <p className="action-feedback">✓ {status}</p>}
      </section>
    );
  return (
    <section className="detail panel">
      <h2>Détail de l’incident</h2>
      <dl>
        <div>
          <dt>Livraison</dt>
          <dd>LIV-2026-042</dd>
        </div>
        <div>
          <dt>Signalement</dt>
          <dd>Client absent, colis non remis.</dd>
        </div>
        <div>
          <dt>Compte concerné</dt>
          <dd>LIV-103 · Maya Richard</dd>
        </div>
        <div>
          <dt>Historique</dt>
          <dd>Le livreur a tenté de joindre le client à 16:42.</dd>
        </div>
      </dl>
      <button
        className="small good"
        onClick={() => setStatus("Incident marqué comme résolu")}
      >
        Marquer comme résolu
      </button>
      <button
        className="small danger"
        onClick={() => setStatus("Compte concerné suspendu")}
      >
        Suspendre le compte concerné
      </button>
      {status && <p className="action-feedback">✓ {status}</p>}
    </section>
  );
}
function GenericTable() {
  return (
    <div className="panel table-panel">
      <div className="table">
        <div className="row table-head">
          <span>Référence</span>
          <span>Commerçant</span>
          <span>Destination</span>
          <span>Statut</span>
        </div>
        {[
          ["LIV-2026-042", "Maison Olive", "Lyon 2e", "En livraison"],
          ["LIV-2026-041", "Atelier Nami", "Lyon 7e", "À attribuer"],
          ["LIV-2026-040", "Le Camion Vert", "Villeurbanne", "Livrée"],
        ].map((r, i) => (
          <div className="row" key={r[0]}>
            {r.map((x, j) => (
              <span
                key={x}
                className={
                  j === 3
                    ? `pill ${i === 0 ? "blue" : i === 1 ? "amber" : "green"}`
                    : ""
                }
              >
                {x}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
export default function WorkspacePage({ role, section }) {
  const page = pages[`${role}/${section}`];
  if (!page)
    return (
      <div className="empty">
        <h1>Page à venir</h1>
        <Link className="button" href={`/${role}`}>
          Retour au tableau de bord
        </Link>
      </div>
    );
  const [title, desc, type] = page;
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">{role.replace("-", " ").toUpperCase()}</p>
          <h1>{title}</h1>
          <p>{desc}</p>
        </div>
        {type === "managers" ? (
          <Link href="/super-manager/managers/create" className="button">
            Créer un manager
          </Link>
        ) : (
          type !== "delivery" && (
            <Link href={`/${role}`} className="button">
              ← Tableau de bord
            </Link>
          )
        )}
      </header>
      {["delivery", "relay", "manager"].includes(type) ? (
        <Form type={type} />
      ) : type === "status" ? (
        <CourierStatus />
      ) : ["managers", "merchants", "couriers"].includes(type) ? (
        <Directory type={type} />
      ) : type === "available" ? (
        <DeliverySearch />
      ) : ["applications", "issues", "mine"].includes(type) ? (
        <Cards type={type} role={role} />
      ) : ["application-detail", "issue-detail"].includes(type) ? (
        <Detail type={type} />
      ) : (
        <GenericTable />
      )}
    </>
  );
}
