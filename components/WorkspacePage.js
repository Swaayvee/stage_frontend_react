"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

const pages = {
  "merchant/deliveries/new": [
    "Nouvelle livraison",
    "Créez une livraison et choisissez le livreur.",
    "delivery",
  ],
  "merchant/deliveries": [
    "Mes livraisons",
    "Suivez et gérez vos expéditions.",
    "table",
  ],
  "merchant/assign-courier": [
    "Assigner un livreur",
    "Sélectionnez un livreur pour votre livraison.",
    "assign-courier",
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
    "Demandes d'adhésion",
    "Étudiez les demandes des commerçants et livreurs.",
    "applications",
  ],
  "manager/applications/MER-028": [
    "Dossier d'adhésion · MER-028",
    "Épicerie des Canuts — demande commerçant à étudier.",
    "application-detail",
  ],
  "manager/applications/LIV-156": [
    "Dossier d'adhésion · LIV-156",
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
    "Retard signalé sur une livraison de l'Atelier Nami.",
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
    "Recherchez et cliquez pour voir les détails complets.",
    "merchants",
  ],
  "super-manager/couriers": [
    "Tous les livreurs",
    "Recherchez et cliquez pour voir les détails complets.",
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
          ["Mode d'attribution", "select"],
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
          {t === "select" ? (
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
function Directory({ type, role }) {
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState("name"),
    [zone, setZone] = useState("all"),
    [selectedUser, setSelectedUser] = useState(null);
  const rows = directory[type];
  const zones = [...new Set(rows.map((r) => r[3]))];
  const filtered = useMemo(
    () =>
      [...rows]
        .filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase()))
        .filter((r) => zone === "all" || r[3] === zone)
        .sort((a, b) => (sort === "zone" ? a[3].localeCompare(b[3]) : a[1].localeCompare(b[1]))),
    [rows, query, sort, zone],
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
        <select aria-label="Filtrer par zone" value={zone} onChange={(e) => setZone(e.target.value)}>
          <option value="all">Toutes les zones</option>
          {zones.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="Trier" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="name">Trier par nom</option>
          <option value="zone">Trier par zone</option>
        </select>
        <span>{filtered.length} résultat(s)</span>
      </div>
      <div className="table">
        <div className="row table-head">
          {labels.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        {filtered.map((r) => (
          <div 
            className={role === "super-manager" ? "row cursor-pointer hover:bg-white/5 transition-colors" : "row"}
            key={r[0]}
            onClick={() => role === "super-manager" && setSelectedUser(r)}
          >
            {r.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        ))}
      </div>
      {selectedUser && <UserDetailModal user={selectedUser} type={type} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}

function UserDetailModal({ user, type, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <article className="mx-auto my-6 w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0d172b] p-5 shadow-2xl md:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{type === "merchants" ? "COMMERÇANT" : type === "couriers" ? "LIVREUR" : "MANAGER"}</p>
            <h2 className="m-0 text-2xl font-black tracking-tight">{user[0]}</h2>
            <p className="mt-1 text-sm text-slate-400">{user[1]}</p>
          </div>
          <button className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10" onClick={onClose}>Fermer</button>
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Informations</p>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-xs text-slate-500">Référence</dt>
                <dd className="text-sm font-mono">{user[0]}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Nom</dt>
                <dd className="text-sm">{user[1]}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">E-mail</dt>
                <dd className="text-sm">{user[2]}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{type === "couriers" ? "Véhicule" : "Zone / Périmètre"}</dt>
                <dd className="text-sm">{user[3]}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Statistiques</p>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-slate-500">Statut</dt>
                <dd className="text-sm font-bold text-emerald-300">Actif</dd>
              </div>
              {type === "couriers" && (
                <>
                  <div>
                    <dt className="text-xs text-slate-500">Note</dt>
                    <dd className="text-sm font-bold">4.9 / 5</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Livraisons</dt>
                    <dd className="text-sm font-bold">156</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Taux réussite</dt>
                    <dd className="text-sm font-bold text-emerald-300">98%</dd>
                  </div>
                </>
              )}
              {type === "merchants" && (
                <>
                  <div>
                    <dt className="text-xs text-slate-500">Livraisons/mois</dt>
                    <dd className="text-sm font-bold">45</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Taux réussite</dt>
                    <dd className="text-sm font-bold text-emerald-300">97%</dd>
                  </div>
                </>
              )}
            </dl>
          </div>
          <button className="w-full rounded-lg border border-indigo-300/30 bg-indigo-500/15 px-3 py-2 text-sm font-bold text-indigo-100 hover:bg-indigo-500/25">
            Voir le détail complet
          </button>
        </div>
      </article>
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
    [radius, setRadius] = useState("5"),
    [locationError, setLocationError] = useState("");
  
  const requestLocation = () => {
    if (!navigator.geolocation) return setLocationError("La géolocalisation n'est pas disponible sur cet appareil.");
    setLocationError("Demande de permission en cours...");
    navigator.geolocation.getCurrentPosition(
      () => { 
        setLocation(true); 
        setLocationError(""); 
      },
      (error) => {
        const messages = {
          1: "Permission refusée : veuillez autoriser l'accès à votre localisation dans les paramètres.",
          2: "Position indisponible : vérifiez votre connexion GPS.",
          3: "Délai d'attente dépassé : réessayez dans un moment.",
        };
        setLocationError(messages[error.code] || "Erreur de géolocalisation.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };
  
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
            <option value="3">Jusqu'à 3 km</option>
            <option value="5">Jusqu'à 5 km</option>
            <option value="10">Jusqu'à 10 km</option>
            <option value="20">Jusqu'à 20 km</option>
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
            onClick={requestLocation}
          >
            {location ? "Localisation autorisée" : "Autoriser"}
          </button>
        </div>
        {locationError && <p className="m-0 text-xs text-amber-300 mt-2">{locationError}</p>}
      </div>
    </section>
  );
}
function Detail({ type }) {
  const [status, setStatus] = useState(""),
    [reportIssue, setReportIssue] = useState(false),
    [issueDescription, setIssueDescription] = useState("");
  
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
          Valider l'adhésion
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
      <h2>Détail de l'incident</h2>
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
      
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3>Signaler un problème</h3>
        <p className="text-sm text-slate-400">Si vous avez rencontré un problème avec cette livraison, signalez-le.</p>
        {!reportIssue ? (
          <button 
            className="small" 
            onClick={() => setReportIssue(true)}
          >
            Signaler un problème
          </button>
        ) : (
          <div className="space-y-3 mt-3">
            <label>
              Description du problème
              <textarea 
                placeholder="Décrivez le problème rencontré..." 
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400"
                rows={4}
              />
            </label>
            <div className="flex gap-3">
              <button 
                className="small good"
                onClick={() => {
                  setStatus("Problème signalé avec succès");
                  setReportIssue(false);
                  setIssueDescription("");
                }}
              >
                Envoyer
              </button>
              <button 
                className="small"
                onClick={() => setReportIssue(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
function GenericTable({ role }) {
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState("recent"),
    [page, setPage] = useState(1),
    [selectedDelivery, setSelectedDelivery] = useState(null),
    [assignMode, setAssignMode] = useState(false);

  const allDeliveries = [
    ["LIV-2026-042", "Maison Olive", "Lyon 2e", "En livraison", "Maya Richard"],
    ["LIV-2026-041", "Atelier Nami", "Lyon 7e", "À attribuer", null],
    ["LIV-2026-040", "Le Camion Vert", "Villeurbanne", "Livrée", "Karim Diallo"],
    ["LIV-2026-039", "Épicerie des Canuts", "Lyon 4e", "En livraison", "Inès Laurent"],
    ["LIV-2026-038", "Maison Olive", "Villeurbanne", "À attribuer", null],
    ["LIV-2026-037", "Atelier Céramique", "Lyon 3e", "Livrée", "Maya Richard"],
  ];

  const filtered = useMemo(
    () =>
      [...allDeliveries]
        .filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => (sort === "reference" ? a[0].localeCompare(b[0]) : 0)),
    [query, sort],
  );

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const start = (page - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(start, start + itemsPerPage);

  const getStatusColor = (status) => {
    if (status === "En livraison") return "blue";
    if (status === "À attribuer") return "amber";
    return "green";
  };

  const handleRowClick = (delivery) => {
    setSelectedDelivery(delivery);
    setAssignMode(delivery[4] === null);
  };

  return (
    <>
      <div className="panel table-panel">
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            className="min-w-[220px] flex-1 rounded-lg border border-blue-200/25 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une livraison…"
          />
          <select
            className="rounded-lg border border-blue-200/25 bg-slate-950 px-3 py-2 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recent">Trier par récent</option>
            <option value="reference">Trier par référence</option>
          </select>
        </div>
        <div className="table">
          <div className="row table-head">
            <span>Référence</span>
            <span>Commerçant</span>
            <span>Destination</span>
            <span>Statut</span>
            {role === "courier" && <span>Livreur</span>}
          </div>
          {paginatedItems.map((r, i) => (
            <div 
              className="row cursor-pointer hover:bg-white/5 transition-colors" 
              key={r[0]}
              onClick={() => handleRowClick(r)}
            >
              <span>{r[0]}</span>
              <span>{r[1]}</span>
              <span>{r[2]}</span>
              <span className={`pill ${getStatusColor(r[3])}`}>{r[3]}</span>
              {role === "courier" && <span>{r[4] || "-"}</span>}
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between px-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm disabled:opacity-50"
            >
              ← Précédent
            </button>
            <span className="text-sm text-slate-400">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm disabled:opacity-50"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>

      {selectedDelivery && (
        <DeliveryModal 
          delivery={selectedDelivery} 
          role={role}
          assignMode={assignMode}
          onClose={() => setSelectedDelivery(null)}
          onAssign={() => setAssignMode(true)}
        />
      )}
    </>
  );
}

function DeliveryModal({ delivery, role, assignMode, onClose, onAssign }) {
  const [selectedCourier, setSelectedCourier] = useState(null);

  const couriers = [
    ["LIV-103", "Maya Richard", "Vélo électrique", "4.9 / 5"],
    ["LIV-121", "Karim Diallo", "Scooter", "4.7 / 5"],
    ["LIV-144", "Inès Laurent", "Voiture", "4.8 / 5"],
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <article className="mx-auto my-6 w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0d172b] p-5 shadow-2xl md:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{assignMode ? "ASSIGNER UN LIVREUR" : "DÉTAILS DE LA LIVRAISON"}</p>
            <h2 className="m-0 text-2xl font-black tracking-tight">{delivery[0]}</h2>
            <p className="mt-1 text-sm text-slate-400">{delivery[1]} · {delivery[2]}</p>
          </div>
          <button className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10" onClick={onClose}>Fermer</button>
        </div>

        {!assignMode ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Informations</p>
              <dl className="mt-3 space-y-2">
                <div>
                  <dt className="text-xs text-slate-500">Référence</dt>
                  <dd className="text-sm">{delivery[0]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Commerçant</dt>
                  <dd className="text-sm">{delivery[1]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Destination</dt>
                  <dd className="text-sm">{delivery[2]}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Statut</dt>
                  <dd className="text-sm"><span className={`pill ${delivery[3] === "En livraison" ? "blue" : delivery[3] === "À attribuer" ? "amber" : "green"}`}>{delivery[3]}</span></dd>
                </div>
                {delivery[4] && (
                  <div>
                    <dt className="text-xs text-slate-500">Livreur</dt>
                    <dd className="text-sm">{delivery[4]}</dd>
                  </div>
                )}
              </dl>
            </div>
            {delivery[3] === "À attribuer" && (
              <button 
                onClick={onAssign}
                className="w-full rounded-lg border border-indigo-300/30 bg-indigo-500/15 px-3 py-2 text-sm font-bold text-indigo-100 hover:bg-indigo-500/25"
              >
                Assigner un livreur
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Livreurs disponibles</p>
              <div className="mt-3 space-y-2">
                {couriers.map((courier) => (
                  <button
                    key={courier[0]}
                    onClick={() => setSelectedCourier(courier)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selectedCourier === courier
                        ? "border-indigo-400 bg-indigo-500/15"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">{courier[1]} ({courier[0]})</div>
                        <div className="text-xs text-slate-400">{courier[2]}</div>
                      </div>
                      <div className="text-xs font-bold text-amber-300">{courier[3]}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onClose()}
                disabled={!selectedCourier}
                className="flex-1 rounded-lg border border-indigo-300/30 bg-indigo-500/15 px-3 py-2 text-sm font-bold text-indigo-100 hover:bg-indigo-500/25 disabled:opacity-50"
              >
                Confirmer l'assignation
              </button>
              <button
                onClick={() => {}}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

function AssignCourier() {
  const [query, setQuery] = useState(""),
    [sort, setSort] = useState("distance"),
    [zone, setZone] = useState("all"),
    [selected, setSelected] = useState(null);
  
  const couriers = [
    ["LIV-103", "Maya Richard", "Vélo électrique", "Lyon 3e", 2.1],
    ["LIV-121", "Karim Diallo", "Scooter", "Villeurbanne", 4.5],
    ["LIV-144", "Inès Laurent", "Voiture", "Lyon 7e", 8.2],
  ];
  
  const zones = [...new Set(couriers.map((c) => c[3]))];
  const filtered = [...couriers]
    .filter((r) => r.join(" ").toLowerCase().includes(query.toLowerCase()))
    .filter((r) => zone === "all" || r[3] === zone)
    .sort((a, b) => sort === "distance" ? a[4] - b[4] : a[1].localeCompare(b[1]));
  
  return (
    <section className="space-y-4">
      <div className="directory-toolbar delivery-filter">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom, référence ou véhicule…"
        />
        <select value={zone} onChange={(e) => setZone(e.target.value)}>
          <option value="all">Toutes les zones</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="distance">Trier par distance</option>
          <option value="name">Trier par nom</option>
        </select>
      </div>
      <div className="cards">
        {filtered.map((courier) => (
          <button 
            type="button" 
            onClick={() => setSelected(courier)} 
            className="panel action-card text-left transition hover:-translate-y-0.5 hover:border-indigo-300/60" 
            key={courier[0]}
          >
            <span className="mini-label">{courier[3]}</span>
            <h2>{courier[0]} · {courier[1]}</h2>
            <p>{courier[2]} · {courier[4].toFixed(1)} km</p>
            <span className="text-xs font-bold text-indigo-200">Sélectionner →</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <article className="mx-auto my-6 w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0d172b] p-5 shadow-2xl md:p-7" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">CONFIRMATION DE LIVREUR</p>
                <h2 className="m-0 text-2xl font-black tracking-tight">{selected[1]}</h2>
                <p className="mt-1 text-sm text-slate-400">{selected[0]} · {selected[2]}</p>
              </div>
              <button className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10" onClick={() => setSelected(null)}>Fermer</button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="m-0 text-xs font-bold uppercase tracking-wider text-slate-400">Détails du livreur</p>
                <dl className="mt-3 space-y-2">
                  <div><dt className="text-xs text-slate-500">Référence</dt><dd className="text-sm">{selected[0]}</dd></div>
                  <div><dt className="text-xs text-slate-500">Nom</dt><dd className="text-sm">{selected[1]}</dd></div>
                  <div><dt className="text-xs text-slate-500">Véhicule</dt><dd className="text-sm">{selected[2]}</dd></div>
                  <div><dt className="text-xs text-slate-500">Zone</dt><dd className="text-sm">{selected[3]}</dd></div>
                  <div><dt className="text-xs text-slate-500">Distance</dt><dd className="text-sm">{selected[4]} km</dd></div>
                </dl>
              </div>
              <button className="button w-full border-0">Confirmer ce livreur</button>
            </div>
          </article>
        </div>
      )}
    </section>
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
          !["delivery", "assign-courier"].includes(type) && (
            <Link href={`/${role}`} className="button">
              ← Tableau de bord
            </Link>
          )
        )}
      </header>
      {["delivery", "manager"].includes(type) ? (
        <Form type={type} />
      ) : type === "assign-courier" ? (
        <AssignCourier />
      ) : type === "status" ? (
        <CourierStatus />
      ) : ["managers", "merchants", "couriers"].includes(type) ? (
        <Directory type={type} role={role} />
      ) : type === "available" ? (
        <DeliverySearch />
      ) : ["applications", "issues", "mine"].includes(type) ? (
        <Cards type={type} role={role} />
      ) : ["application-detail", "issue-detail"].includes(type) ? (
        <Detail type={type} />
      ) : (
        <GenericTable role={role} />
      )}
    </>
  );
}
