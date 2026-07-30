"use client";
import Link from "next/link";
import { use, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRelayFlow } from "../../../context/RelayFlowProvider";
import FrenchLocationFields from "../../../components/FrenchLocationFields";
import { formatFrenchPhone } from "../../../lib/location";

const specs = {
  merchant: {
    title: "Devenir commerçant partenaire",
    eyebrow: "ADHÉSION COMMERÇANT",
    icon: "🏪",
    desc: "Sélectionnez votre type d'activité (physique, e-commerce ou mobile) pour remplir votre dossier adapté.",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/25",
    accentText: "text-emerald-300",
    gradient: "from-emerald-600/10 to-transparent",
    redirect: "/merchant/login",
  },
  courier: {
    title: "Devenir livreur RelayFlow",
    eyebrow: "ADHÉSION LIVREUR",
    icon: "🚴",
    desc: "Complétez votre dossier. Un manager vérifiera vos informations et justificatifs avant validation.",
    accentBg: "bg-purple-500/10",
    accentBorder: "border-purple-500/25",
    accentText: "text-purple-300",
    gradient: "from-purple-600/10 to-transparent",
    redirect: "/courier/login",
    fileLabel: "Pièce d'identité (CNI ou passeport, PDF ou image)",
  },
};

function MerchantForm({ merchantType, setMerchantType }) {
  return (
    <>
      {/* Type Selector Tabs */}
      <fieldset className="signup-fieldset">
        <legend className="signup-legend">Type d'activité commerçante</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: "physical",
              title: "Commerçant physique",
              icon: "🏪",
              desc: "Boutique / Point de vente fixe",
            },
            {
              id: "ecommerce",
              title: "E-commerçant",
              icon: "🌐",
              desc: "Boutique en ligne & Expéditions",
            },
            {
              id: "mobile",
              title: "Commerçant mobile",
              icon: "🚚",
              desc: "Marchés, Food-truck & Pop-up",
            },
          ].map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setMerchantType(item.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col cursor-pointer ${
                merchantType === item.id
                  ? "bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-900/20"
                  : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200"
              }`}
            >
              <span className="text-2xl mb-1">{item.icon}</span>
              <span className="text-sm font-black text-white">{item.title}</span>
              <span className="text-[0.68rem] opacity-75 mt-0.5">{item.desc}</span>
            </button>
          ))}
        </div>
      </fieldset>

      {merchantType === "physical" && (
        <>
          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Informations de la boutique physique</legend>
            <div className="signup-grid">
              <label className="signup-label">
                <span>Nom du commerce / Enseigne <span className="text-red-400">*</span></span>
                <input required placeholder="Ex. Maison Olive" />
              </label>
              <label className="signup-label">
                <span>Numéro SIRET <span className="text-red-400">*</span></span>
                <input required placeholder="Ex. 123 456 789 00012" />
              </label>
              <label className="signup-label">
                <span>Nom du gérant / responsable <span className="text-red-400">*</span></span>
                <input required placeholder="Prénom Nom" />
              </label>
              <label className="signup-label">
                <span>Secteur d'activité <span className="text-red-400">*</span></span>
                <input required placeholder="Ex. Épicerie fine, Mode, Fleuriste…" />
              </label>
            </div>
          </fieldset>

          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Point de vente & Contact</legend>
            <div className="signup-grid">
              <FrenchLocationFields
                addressName="adressePointVente"
                cityName="villePointVente"
                departmentName="departementPointVente"
                postalCodeName="codePostalPointVente"
                addressLabel="Adresse exacte du magasin"
              />
              <label className="signup-label">
                <span>E-mail professionnel <span className="text-red-400">*</span></span>
                <input required type="email" placeholder="contact@maisonolive.fr" />
              </label>
              <label className="signup-label">
                <span>Téléphone de la boutique <span className="text-red-400">*</span></span>
                <input required type="tel" placeholder="04 78 12 34 56" />
              </label>
              <label className="signup-label col-span-full">
                <span>Horaires d'ouverture au public <span className="text-red-400">*</span></span>
                <input required placeholder="Ex. Lundi au Samedi 09:00 - 19:30" />
              </label>
            </div>
          </fieldset>

          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Espace de collecte & Colis</legend>
            <div className="signup-grid">
              <label className="signup-label">
                <span>Emplacement du point de retrait <span className="text-red-400">*</span></span>
                <select required className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400">
                  <option value="">Sélectionnez un emplacement</option>
                  <option value="counter">Comptoir principal</option>
                  <option value="backroom">Réserve dédiée en arrière-boutique</option>
                  <option value="shelf">Rayon / Étagère dédiée</option>
                </select>
              </label>
              <label className="signup-label">
                <span>Volume moyen de colis / jour</span>
                <input placeholder="Ex. 15-30 colis" />
              </label>
            </div>
          </fieldset>
        </>
      )}

      {merchantType === "ecommerce" && (
        <>
          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Informations E-commerce</legend>
            <div className="signup-grid">
              <label className="signup-label">
                <span>Nom de la boutique en ligne <span className="text-red-400">*</span></span>
                <input required placeholder="Ex. Atelier Nami E-shop" />
              </label>
              <label className="signup-label">
                <span>URL du site Web / Boutique <span className="text-red-400">*</span></span>
                <input required type="url" placeholder="https://www.atelier-nami.fr" />
              </label>
              <label className="signup-label">
                <span>Numéro SIRET <span className="text-red-400">*</span></span>
                <input required placeholder="Ex. 987 654 321 00045" />
              </label>
              <label className="signup-label">
                <span>Responsable Logistique / Expéditions <span className="text-red-400">*</span></span>
                <input required placeholder="Prénom Nom" />
              </label>
            </div>
          </fieldset>

          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Atelier / Entrepôt de préparation (Lieu de collecte)</legend>
            <div className="signup-grid">
              <FrenchLocationFields
                addressName="adresseEntrepot"
                cityName="villeEntrepot"
                departmentName="departementEntrepot"
                postalCodeName="codePostalEntrepot"
                addressLabel="Adresse de l'entrepôt ou atelier"
              />
              <label className="signup-label">
                <span>E-mail service expéditions <span className="text-red-400">*</span></span>
                <input required type="email" placeholder="expeditions@atelier-nami.fr" />
              </label>
              <label className="signup-label">
                <span>Téléphone direct logistique <span className="text-red-400">*</span></span>
                <input required type="tel" placeholder="06 99 88 77 66" />
              </label>
            </div>
          </fieldset>

          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Plateforme Web & Volume</legend>
            <div className="signup-grid">
              <label className="signup-label">
                <span>CMS / Solution E-commerce <span className="text-red-400">*</span></span>
                <select required className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400">
                  <option value="">Choisir la plateforme</option>
                  <option value="shopify">Shopify</option>
                  <option value="woocommerce">WooCommerce / WordPress</option>
                  <option value="prestashop">PrestaShop</option>
                  <option value="custom">Solution sur mesure / API</option>
                </select>
              </label>
              <label className="signup-label">
                <span>Transporteurs actuels</span>
                <input placeholder="Ex. Colissimo, Mondial Relay..." />
              </label>
              <label className="signup-label col-span-full">
                <span>Nombre d'expéditions estimé / jour</span>
                <input placeholder="Ex. 30 à 80 commandes par jour" />
              </label>
            </div>
          </fieldset>
        </>
      )}

      {merchantType === "mobile" && (
        <>
          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Informations Commerce Itinérant</legend>
            <div className="signup-grid">
              <label className="signup-label">
                <span>Nom du commerce ambulant / Enseigne <span className="text-red-400">*</span></span>
                <input required placeholder="Ex. Le Camion Gourmand" />
              </label>
              <label className="signup-label">
                <span>Format mobile <span className="text-red-400">*</span></span>
                <select required className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-400">
                  <option value="">Sélectionner le format</option>
                  <option value="foodtruck">Food Truck / Camion aménagé</option>
                  <option value="market">Stand de marché itinérant</option>
                  <option value="trailer">Remorque / Triporteur mobile</option>
                  <option value="popup">Pop-up store éphémère</option>
                </select>
              </label>
              <label className="signup-label">
                <span>Numéro SIRET <span className="text-red-400">*</span></span>
                <input required placeholder="Ex. 456 789 123 00078" />
              </label>
              <label className="signup-label">
                <span>Nom de l'exploitant / gérant <span className="text-red-400">*</span></span>
                <input required placeholder="Prénom Nom" />
              </label>
            </div>
          </fieldset>

          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Emplacements, Marchés & Contact</legend>
            <div className="signup-grid">
              <label className="signup-label">
                <span>E-mail de contact itinérant <span className="text-red-400">*</span></span>
                <input required type="email" placeholder="contact@camiongourmand.fr" />
              </label>
              <label className="signup-label">
                <span>Téléphone portable professionnel <span className="text-red-400">*</span></span>
                <input required type="tel" placeholder="06 41 20 86 12" />
              </label>
              <label className="signup-label col-span-full">
                <span>Marchés & Zones de présence habituelles <span className="text-red-400">*</span></span>
                <input required placeholder="Ex. Marché Croix-Rousse (Mar/Ven), Place Bellecour (Mer/Sam)" />
              </label>
              <FrenchLocationFields
                showAddress={false}
                cityName="villeRattachement"
                departmentName="departementRattachement"
                postalCodeName="codePostalRattachement"
              />
            </div>
          </fieldset>

          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Véhicule & Matériel mobile</legend>
            <div className="signup-grid">
              <label className="signup-label">
                <span>Plaque d'immatriculation du véhicule <span className="text-red-400">*</span></span>
                <input required placeholder="Ex. FK-892-XZ" />
              </label>
              <label className="signup-label">
                <span>N° carte commerçant ambulant <span className="text-red-400">*</span></span>
                <input required placeholder="Ex. CARTE-AMB-2026-99" />
              </label>
            </div>
          </fieldset>
        </>
      )}
    </>
  );
}

function CourierForm() {
  const [vehicle, setVehicle] = useState("");
  const hasPlate = ["scooter", "car", "van"].includes(vehicle);

  return (
    <>
      <fieldset className="signup-fieldset">
        <legend className="signup-legend">Zone d'activité</legend>
        <div className="signup-grid">
          <label className="signup-label">
            <span>Zone de livraison <span className="text-red-400">*</span></span>
            <input required placeholder="Ex. Lyon 3e et 7e" />
          </label>
        </div>
      </fieldset>

      <fieldset className="signup-fieldset">
        <legend className="signup-legend">Moyen de transport</legend>
        <div className="signup-grid">
          <label className="signup-label">
            <span>Type de véhicule <span className="text-red-400">*</span></span>
            <select name="typeVehicule" required value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              <option value="" disabled>Choisir un moyen de transport</option>
              <option value="bike">Vélo / vélo électrique</option>
              <option value="scooter">Scooter / moto</option>
              <option value="car">Voiture</option>
              <option value="van">Utilitaire / fourgon</option>
            </select>
          </label>
          {hasPlate && (
            <>
              <label className="signup-label">
                <span>Marque et modèle <span className="text-red-400">*</span></span>
                <input required placeholder="Peugeot Kisbee 125" />
              </label>
              <label className="signup-label">
                <span>Immatriculation <span className="text-red-400">*</span></span>
                <input required placeholder="AA-123-BB" />
              </label>
              <label className="signup-label">
                <span>Numéro de permis <span className="text-red-400">*</span></span>
                <input required placeholder="Numéro de permis de conduire" />
              </label>
            </>
          )}
        </div>
      </fieldset>

      <fieldset className="signup-fieldset">
        <legend className="signup-legend">Statut professionnel</legend>
        <div className="signup-grid">
          <label className="signup-label">
            <span>Statut juridique <span className="text-red-400">*</span></span>
            <select required>
              <option value="" disabled>Choisir un statut</option>
              <option>Auto-entrepreneur</option>
              <option>Micro-entreprise</option>
              <option>EIRL / SASU</option>
            </select>
          </label>
          <label className="signup-label">
            <span>Numéro SIRET</span>
            <input placeholder="Si applicable" />
          </label>
        </div>
      </fieldset>
    </>
  );
}

function SignupContent({ role, spec }) {
  const { api } = useRelayFlow();
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const searchParams = useSearchParams();
  const initialType = searchParams ? searchParams.get("type") : null;
  const [merchantType, setMerchantType] = useState(
    ["physical", "ecommerce", "mobile"].includes(initialType) ? initialType : "physical"
  );
  const handleFormInput = (event) => {
    if (event.target instanceof HTMLInputElement && event.target.type === "tel") {
      event.target.value = formatFrenchPhone(event.target.value);
      const valid = event.target.value.replace(/\D/g, "").length === 10;
      event.target.setCustomValidity(valid ? "" : "Saisissez un numéro français de 10 chiffres.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }
    const data = new FormData(e.currentTarget);
    const profil = {};
    e.currentTarget.querySelectorAll("input, select, textarea").forEach((field, index) => {
      if (field.type === "password" || field.type === "file") return;
      const label = field.closest("label")?.querySelector("span")?.textContent?.trim();
      const key = field.name || label || `champ_${index + 1}`;
      if (field.value) profil[key] = field.value;
    });
    const documents = [...e.currentTarget.querySelectorAll('input[type="file"]')]
      .flatMap((field) => [...(field.files || [])])
      .map((file) => ({ nom: file.name, type: file.type, taille: file.size }));
    const result = await api.submitApplication({
      role: role === "merchant" ? "vendeur" : "livreur",
      email: data.get("email"),
      telephone: data.get("telephone"),
      ville: data.get("ville"),
      departement: data.get("departement"),
      codeCommune: data.get("codeCommune"),
      codeDepartement: data.get("codeDepartement"),
      codePostal: data.get("codePostal"),
      nom: data.get("displayName"),
      raisonSociale: role === "merchant" ? data.get("displayName") : "",
      adresse: data.get("adresse"),
      typeVehicule: data.get("typeVehicule"),
      password: data.get("password"),
      profil,
      documents,
    });
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    setDone(true);
  };

  const merchantFileLabel =
    merchantType === "ecommerce"
      ? "Extrait KBIS (moins de 3 mois) et Justificatif de propriété du nom de domaine (PDF ou image)"
      : merchantType === "mobile"
      ? "Extrait KBIS, Carte de commerçant ambulant et Carte grise (PDF ou image)"
      : "Extrait KBIS (moins de 3 mois) et Bail commercial / Justificatif de local (PDF ou image)";

  return (
    <div className="signup-wrapper">
      {/* Header */}
      <div className={`signup-header bg-gradient-to-r ${spec.gradient}`}>
        <Link href="/" className="brand mb-4 block p-0">
          Relay<span>Flow</span>
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">
            {role === "merchant"
              ? merchantType === "ecommerce"
                ? "🌐"
                : merchantType === "mobile"
                ? "🚚"
                : "🏪"
              : spec.icon}
          </span>
          <div>
            <p className={`eyebrow m-0 ${spec.accentText}`}>{spec.eyebrow}</p>
            <h1 className="text-2xl font-black text-white m-0 tracking-tight">
              {role === "merchant"
                ? merchantType === "ecommerce"
                  ? "Adhésion E-commerçant"
                  : merchantType === "mobile"
                  ? "Adhésion Commerçant mobile"
                  : "Adhésion Commerçant physique"
                : spec.title}
            </h1>
          </div>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed m-0">{spec.desc}</p>
      </div>

      {done ? (
        <div className="signup-success">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-black text-white mb-2">Demande envoyée avec succès !</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-4">
            Votre dossier a bien été reçu. Un manager RelayFlow l'examinera et vous contactera
            sous <strong className="text-white">2 à 5 jours ouvrés</strong>.
          </p>
          <p className="text-xs text-slate-500">
            Votre accès sera activé dès que la demande aura été acceptée.
          </p>
          <Link href={`/${role}/login`} className={`mt-4 inline-flex items-center gap-2 rounded-lg border ${spec.accentBorder} ${spec.accentBg} px-4 py-2 text-sm font-bold ${spec.accentText}`}>
            Aller à la connexion
          </Link>
        </div>
      ) : (
        <form className="signup-form" onSubmit={handleSubmit} onInput={handleFormInput}>
          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Identité, localisation et accès</legend>
            <div className="signup-grid">
              <label className="signup-label">
                <span>{role === "merchant" ? "Nom commercial" : "Prénom et nom"} <span className="text-red-400">*</span></span>
                <input name="displayName" required minLength={2} maxLength={100} autoComplete="name" />
              </label>
              <label className="signup-label">
                <span>E-mail <span className="text-red-400">*</span></span>
                <input name="email" required type="email" maxLength={254} autoComplete="email" />
              </label>
              <label className="signup-label">
                <span>Téléphone <span className="text-red-400">*</span></span>
                <input name="telephone" required type="tel" inputMode="numeric" placeholder="06 12 34 56 78" autoComplete="tel" />
              </label>
              <FrenchLocationFields />
              <label className="signup-label">
                <span>Mot de passe souhaité <span className="text-red-400">*</span></span>
                <input name="password" required type="password" minLength={10} maxLength={128} autoComplete="new-password" />
              </label>
            </div>
          </fieldset>
          {role === "courier" ? (
            <CourierForm />
          ) : (
            <MerchantForm merchantType={merchantType} setMerchantType={setMerchantType} />
          )}

          {/* Fichier justificatif */}
          <fieldset className="signup-fieldset">
            <legend className="signup-legend">Justificatif obligatoire</legend>
            <label className="signup-label col-span-full">
              <span>
                {role === "merchant" ? merchantFileLabel : spec.fileLabel} <span className="text-red-400">*</span>
              </span>
              <input type="file" accept=".pdf,image/*" required />
            </label>
          </fieldset>

          <div className="signup-footer">
            {submitError && <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">{submitError}</p>}
            <p className="text-xs text-slate-500 leading-relaxed">
              En soumettant ce formulaire, vous acceptez que vos données soient traitées par RelayFlow
              dans le cadre de l'étude de votre demande d'adhésion.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <button type="submit" className={`button border-0 px-8 py-3 text-sm font-black shadow-lg`}>
                Envoyer ma demande
              </button>
              <Link href="/signup" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                Changer de profil
              </Link>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Déjà un compte ?{" "}
              <Link href={`/${role}/login`} className={`font-bold ${spec.accentText}`}>
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      )}
    </div>
  );
}

export default function Signup({ params }) {
  const role = use(params).role;
  const spec = specs[role];

  if (!spec) {
    return (
      <main className="auth-page">
        <div className="ambient-background" />
        <section className="auth-card">
          <Link href="/" className="brand">Relay<span>Flow</span></Link>
          <p className="text-slate-400">
            Ce profil ne dispose pas d'inscription publique.{" "}
            <Link href="/signup" className="text-indigo-300">Retour</Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page" style={{ alignItems: "flex-start", paddingTop: "2rem", paddingBottom: "2rem" }}>
      <div className="ambient-background">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-grid" />
      </div>

      <Suspense fallback={<div className="text-white text-center p-8">Chargement du formulaire…</div>}>
        <SignupContent role={role} spec={spec} />
      </Suspense>
    </main>
  );
}
