"use client";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "./AppShell";

export default function AccountEditor() {
  const params = useSearchParams(),
    router = useRouter();
  const role = ["merchant", "courier", "manager", "super_manager"].includes(
    params.get("role"),
  )
    ? params.get("role")
    : "courier";
  const profile = {
    merchant: ["Maison Olive", "contact@maisonolive.fr", "04 72 00 12 34"],
    courier: ["Lucas Martin", "lucas@exemple.fr", "06 12 34 56 78"],
    "manager": ["Sarah Bernard", "sarah.bernard@relayflow.fr", "06 41 20 86 12"],
    "super_manager": [
      "Alexandre Dubois",
      "alexandre@relayflow.fr",
      "06 33 15 42 70",
    ],
  }[role];
  return (
    <AppShell role={role}>
      <header className="page-header">
        <div>
          <p className="eyebrow">MON COMPTE</p>
          <h1>Modifier mon profil</h1>
          <p>Vos informations actuelles sont déjà renseignées.</p>
        </div>
        <button className="button" onClick={() => router.push(`/${role}`)}>
          Retour au tableau de bord
        </button>
      </header>
      <form
        className="form panel account-form"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/${role}`);
        }}
      >
        <label>
          Nom affiché
          <input defaultValue={profile[0]} />
        </label>
        <label>
          E-mail
          <input defaultValue={profile[1]} />
        </label>
        <label>
          Téléphone
          <input defaultValue={profile[2]} />
        </label>
        <label>
          Nouveau mot de passe
          <input
            type="password"
            placeholder="Laisser vide pour ne pas modifier"
          />
        </label>
        <p className="form-hint">
          Après l’enregistrement, vous retournerez automatiquement sur votre
          tableau de bord.
        </p>
        <button className="button">Enregistrer les modifications</button>
      </form>
    </AppShell>
  );
}
