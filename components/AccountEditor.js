"use client";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "./AppShell";
import AuthGuard from "./AuthGuard";
import { useRelayFlow } from "../context/RelayFlowProvider";
import { useState, useEffect } from "react";
import FrenchLocationFields from "./FrenchLocationFields";
import { formatFrenchPhone } from "../lib/location";

export default function AccountEditor() {
  const params = useSearchParams();
  const router = useRouter();
  const { session, api, displayName, viewModel } = useRelayFlow();
  const role = ["merchant", "courier", "manager", "super_manager"].includes(params.get("role"))
    ? params.get("role")
    : session?.routeRole || "courier";

  const profile = viewModel.profile;
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [ville, setVille] = useState("");
  const [departement, setDepartement] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [zonesCouvertes, setZonesCouvertes] = useState([]);
  const [zoneDraft, setZoneDraft] = useState({
    ville: "",
    departement: "",
    codePostal: "",
    codeCommune: "",
    codeDepartement: "",
    coordonnees: null,
  });

  const email = session?.email || "";

  useEffect(() => {
    if (!profile) return;
    if (profile.type === "vendeur") {
      setNom(profile.raisonSociale || "");
      setTelephone(profile.telephone || "");
      setAdresse(profile.adresse || "");
      setVille(profile.ville || "");
      setDepartement(profile.departement || "");
      setCodePostal(profile.codePostal || "");
    } else if (profile.type === "livreur") {
      setNom(profile.nom || "");
      setAdresse(profile.adresse || "");
      setVille(profile.ville || "");
      setDepartement(profile.departement || "");
      setCodePostal(profile.codePostal || "");
      setZonesCouvertes(
        profile.zonesCouvertes?.length
          ? profile.zonesCouvertes
          : profile.ville
            ? [{
                ville: profile.ville,
                departement: profile.departement,
                codePostal: profile.codePostal,
                codeCommune: profile.codeCommune,
                codeDepartement: profile.codeDepartement,
                coordonnees: profile.coordonnees,
              }]
            : []
      );
    }
  }, [profile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!session) return;
    const payload = { password: password || undefined };
    if (profile?.type === "vendeur") {
      payload.raisonSociale = nom;
      payload.telephone = telephone;
      payload.adresse = adresse;
      payload.ville = ville;
      payload.departement = departement;
      payload.codePostal = codePostal;
      payload.zonesCouvertes = zonesCouvertes;
    } else if (profile?.type === "livreur") {
      payload.nom = nom;
      payload.adresse = adresse;
      payload.ville = ville;
      payload.departement = departement;
      payload.codePostal = codePostal;
    }
    api.updateProfile(session.compteId, payload);
    setSaved(true);
    setTimeout(() => router.push(`/${role}`), 800);
  };

  return (
    <AuthGuard role={role}>
      <AppShell role={role}>
      <header className="page-header">
        <div>
          <p className="eyebrow">MON COMPTE</p>
          <h1>Modifier mon profil</h1>
          <p>Informations liées à votre compte RelayFlow.</p>
        </div>
        <button className="button" onClick={() => router.push(`/${role}`)}>Retour</button>
      </header>
      <form className="form panel account-form" onSubmit={handleSubmit}>
        <label>Nom affiché<input value={nom || displayName} onChange={(e) => setNom(e.target.value)} /></label>
        <label>E-mail<input value={email} readOnly disabled /></label>
        {(profile?.type === "vendeur" || profile?.type === "livreur") && (
          <>
            {profile?.type === "vendeur" && (
              <label>Téléphone<input value={telephone} onChange={(e) => setTelephone(formatFrenchPhone(e.target.value))} /></label>
            )}
            <FrenchLocationFields
              address={adresse}
              city={ville}
              department={departement}
              postalCode={codePostal}
              onChange={(location) => {
                setAdresse(location.address);
                setVille(location.city);
                setDepartement(location.department);
                setCodePostal(location.postalCode);
              }}
            />
          </>
        )}
        {profile?.type === "livreur" && (
          <fieldset className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
            <legend className="px-2 text-sm font-bold text-white">Zones de livraison couvertes</legend>
            <div className="space-y-2">
              {zonesCouvertes.map((zone, index) => (
                <div key={`${zone.codeCommune || zone.ville}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/40 p-3">
                  <span className="text-sm text-slate-200">
                    <b>{zone.ville}</b>{zone.departement ? ` · ${zone.departement}` : ""}
                  </span>
                  <button
                    type="button"
                    className="small"
                    onClick={() => setZonesCouvertes((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    Retirer
                  </button>
                </div>
              ))}
              {zonesCouvertes.length === 0 && <p className="text-sm text-slate-400">Ajoutez au moins une ville ou un arrondissement.</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FrenchLocationFields
                showAddress={false}
                required={false}
                cityLabel="Ville ou arrondissement à couvrir"
                city={zoneDraft.ville}
                department={zoneDraft.departement}
                postalCode={zoneDraft.codePostal}
                onChange={(location) => setZoneDraft({
                  ville: location.city,
                  departement: location.department,
                  codePostal: location.postalCode,
                  codeCommune: location.cityCode,
                  codeDepartement: location.departmentCode,
                  coordonnees:
                    location.latitude != null && location.longitude != null
                      ? { lat: location.latitude, lng: location.longitude }
                      : null,
                })}
              />
            </div>
            <button
              type="button"
              className="small good"
              disabled={!zoneDraft.ville.trim()}
              onClick={() => {
                const duplicate = zonesCouvertes.some(
                  (zone) =>
                    (zoneDraft.codeCommune && zone.codeCommune === zoneDraft.codeCommune) ||
                    zone.ville?.toLowerCase() === zoneDraft.ville.toLowerCase()
                );
                if (!duplicate) setZonesCouvertes((current) => [...current, zoneDraft]);
                setZoneDraft({
                  ville: "",
                  departement: "",
                  codePostal: "",
                  codeCommune: "",
                  codeDepartement: "",
                  coordonnees: null,
                });
              }}
            >
              Ajouter cette zone
            </button>
          </fieldset>
        )}
        <label>Nouveau mot de passe<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Laisser vide pour ne pas modifier" /></label>
        {saved && <p className="success">✓ Profil enregistré.</p>}
        <button className="button" type="submit">Enregistrer</button>
      </form>
      </AppShell>
    </AuthGuard>
  );
}
