"use client";
import Link from "next/link";
import { use, useState } from "react";

const specs = {
  merchant: {
    title: "Devenir commerçant partenaire",
    text: "Votre demande sera étudiée par un manager.",
    fields: [
      "Nom du commerce",
      "SIRET",
      "Nom du responsable",
      "E-mail",
      "Téléphone",
      "Adresse du commerce",
      "Ville / zone de collecte",
      "Horaires d’ouverture",
    ],
  },
  ecommerce: {
    title: "Devenir e-commerçant partenaire",
    text: "Décrivez votre activité de vente en ligne. Un manager étudiera votre demande.",
    fields: [
      "Nom de l’enseigne ou site e-commerce",
      "SIRET",
      "URL de la boutique en ligne",
      "Nom du responsable",
      "E-mail",
      "Téléphone",
      "Adresse de préparation des commandes",
      "Volume moyen de colis par semaine",
    ],
  },
  "mobile-merchant": {
    title: "Devenir commerçant mobile",
    text: "Votre dossier permet d’organiser les collectes adaptées à votre activité itinérante.",
    fields: [
      "Nom de l’activité",
      "SIRET",
      "Nom du responsable",
      "E-mail",
      "Téléphone",
      "Type d’activité mobile",
      "Villes et zones habituelles",
      "Jours et créneaux de présence",
      "Point de collecte privilégié",
    ],
  },
};
function CourierFields() {
  const [vehicle, setVehicle] = useState("");
  const hasPlate = ["scooter", "car", "van"].includes(vehicle);
  return (
    <>
      <label>
        Prénom et nom
        <input required placeholder="Prénom et nom" />
      </label>
      <label>
        E-mail
        <input required type="email" placeholder="nom@exemple.fr" />
      </label>
      <label>
        Téléphone
        <input required type="tel" placeholder="Téléphone" />
      </label>
      <label>
        Zone de livraison
        <input required placeholder="Ex. Lyon 3e et 7e" />
      </label>
      <label>
        Moyen de transport
        <select
          required
          value={vehicle}
          onChange={(e) => setVehicle(e.target.value)}
        >
          <option value="" disabled>
            Choisir un moyen
          </option>
          <option value="bike">Vélo / vélo électrique</option>
          <option value="scooter">Scooter</option>
          <option value="car">Voiture</option>
          <option value="van">Utilitaire</option>
        </select>
      </label>
      {hasPlate && (
        <>
          <label>
            Marque et modèle du véhicule
            <input required placeholder="Ex. Peugeot Kisbee" />
          </label>
          <label>
            Immatriculation du véhicule
            <input required placeholder="AA-123-BB" />
          </label>
          <label>
            Numéro de permis
            <input required placeholder="Numéro de permis" />
          </label>
        </>
      )}
      <label>
        Pièce justificative (PDF ou image)
        <input required type="file" accept=".pdf,image/*" />
      </label>
    </>
  );
}
export default function Signup({ params }) {
  const [done, setDone] = useState(false);
  const role = use(params).role,
    s = specs[role];
  if (role !== "courier" && !s)
    return (
      <main className="auth-page">
        Ce rôle ne dispose pas d’inscription publique.
      </main>
    );
  const title = role === "courier" ? "Demande d’intégration livreur" : s.title;
  const text =
    role === "courier"
      ? "Complétez votre dossier. Un manager vérifiera vos informations et justificatifs."
      : s.text;
  return (
    <main className="auth-page">
      <div className="ambient-background" />
      <form
        className="auth-card signup"
        onSubmit={(e) => {
          e.preventDefault();
          setDone(true);
        }}
      >
        <Link href="/" className="brand">
          Relay<span>Flow</span>
        </Link>
        <p className="eyebrow">ADHÉSION · {role.toUpperCase()}</p>
        <h1>{title}</h1>
        <p>{text}</p>
        {role === "courier" ? (
          <CourierFields />
        ) : (
          s.fields.map((f) => (
            <label key={f}>
              {f}
              <input required placeholder={f} />
            </label>
          ))
        )}
        {done && (
          <p className="success">
            ✓ Demande envoyée. Vous recevrez une réponse après étude.
          </p>
        )}
        <button className="button login-btn">Envoyer ma demande</button>
        <small>
          Déjà un compte ? <Link href="/login">Se connecter</Link>
        </small>
      </form>
    </main>
  );
}
