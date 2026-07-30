"use client";
import { useState } from "react";
import { useRelayFlow } from "../context/RelayFlowProvider";

export default function TeamManager() {
  const { session, api, viewModel, state } = useRelayFlow();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [livreurRef, setLivreurRef] = useState("");
  const [courierSearchOpen, setCourierSearchOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [revoking, setRevoking] = useState(null);
  const team = viewModel.partenariats;
  const seller = state?.vendeurs?.find((item) => item.compteId === session?.compteId);
  const unavailableCourierIds = new Set(
    (state?.partenariats || [])
      .filter(
        (partnership) =>
          partnership.vendeurId === seller?._id &&
          ["actif", "en_attente"].includes(partnership.statut)
      )
      .map((partnership) => partnership.livreurId)
  );
  const normalize = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  const courierQuery = normalize(livreurRef);
  const availableCouriers = (state?.livreurs || [])
    .filter((courier) => {
      const account = state?.comptes?.find((item) => item._id === courier.compteId);
      return (
        account?.role === "livreur" &&
        account.statutCompte === "actif" &&
        !unavailableCourierIds.has(courier._id)
      );
    })
    .filter((courier) =>
      !courierQuery ||
      normalize(
        `${courier._id} ${courier.nom} ${courier.ville} ${courier.departement} ${courier.typeVehicule}`
      ).includes(courierQuery)
    )
    .slice(0, 6);

  const handleInvite = (e) => {
    e.preventDefault();
    if (!session) return;
    if (!livreurRef) {
      setInviteError("Sélectionnez un livreur existant dans la liste.");
      return;
    }
    const r = api.proposerPartenariat(session.compteId, livreurRef, message);
    if (r.ok) {
      setInviteSent(true);
      setInviteError("");
      setCourierSearchOpen(false);
    } else {
      setInviteError(r.error);
    }
  };

  const handleRevoke = (partenariatId) => {
    if (!session) return;
    api.revoquerPartenariat(session.compteId, partenariatId);
    setRevoking(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">PARTENARIATS LIVREURS</p>
        <h1 className="text-2xl font-black text-white">Mon équipe de livreurs</h1>
        <p className="text-slate-400">
          Gérez vos partenariats réguliers. Les livraisons en mode « équipe » ne sont proposées qu'aux partenaires actifs.
        </p>
      </header>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-center justify-between gap-4">
        <div>
          <span className="text-sm font-bold text-white block">Proposer un partenariat</span>
          <span className="text-xs text-slate-400 mt-0.5 block">Recherchez un livreur déjà inscrit sur RelayFlow.</span>
        </div>
        <button className="button small shrink-0" onClick={() => { setShowInvite(!showInvite); setInviteSent(false); }}>
          {showInvite ? "Annuler" : "+ Ajouter un livreur"}
        </button>
      </div>

      {showInvite && (
        <form className="panel form space-y-4" onSubmit={handleInvite}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="location-autocomplete">
              <label htmlFor="partnership-courier-search">
                <span>Livreur existant</span>
                <input
                  id="partnership-courier-search"
                  type="text"
                  required
                  autoComplete="off"
                  value={
                    state?.livreurs?.find((courier) => courier._id === livreurRef)?.nom ||
                    livreurRef
                  }
                  onFocus={() => setCourierSearchOpen(true)}
                  onBlur={() => setTimeout(() => setCourierSearchOpen(false), 120)}
                  onChange={(event) => {
                    setLivreurRef(event.target.value);
                    setCourierSearchOpen(true);
                    setInviteSent(false);
                    setInviteError("");
                  }}
                  placeholder="Commencez à saisir un nom ou une ville…"
                  aria-autocomplete="list"
                  aria-expanded={courierSearchOpen}
                  aria-controls="partnership-courier-results"
                />
              </label>
              {courierSearchOpen && (
                <ul
                  id="partnership-courier-results"
                  role="listbox"
                  className="location-autocomplete__list"
                >
                  {availableCouriers.length ? (
                    availableCouriers.map((courier) => (
                      <li key={courier._id} role="option" aria-selected={livreurRef === courier._id}>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setLivreurRef(courier._id);
                            setCourierSearchOpen(false);
                            setInviteError("");
                          }}
                        >
                          <strong>{courier.nom}</strong>
                          <small>
                            {courier.ville || "Ville non renseignée"} · {courier.typeVehicule || "Véhicule non renseigné"}
                          </small>
                        </button>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-3 text-xs text-slate-400">
                      Aucun livreur inscrit ne correspond à cette recherche.
                    </li>
                  )}
                </ul>
              )}
            </div>
            <label>
              <span>Message (optionnel)</span>
              <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Bonjour, je souhaite…" />
            </label>
          </div>
          {inviteError && <p className="text-red-400 text-sm font-bold">{inviteError}</p>}
          {inviteSent ? (
            <p className="text-emerald-400 font-bold text-sm">✓ Demande de partenariat envoyée.</p>
          ) : (
            <button
              className="button w-full"
              type="submit"
              disabled={!state?.livreurs?.some((courier) => courier._id === livreurRef)}
            >
              Envoyer la demande
            </button>
          )}
        </form>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Membres de mon équipe ({team.length})
        </h2>
        {team.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
            <p className="text-slate-400 text-sm">Aucun partenariat pour le moment.</p>
          </div>
        )}
        {team.map((courier) => {
          const [id, name, vehicle, zone, , status, partId, rawStatut, delivered] = courier;
          const isActive = rawStatut === "actif";
          return (
            <article key={partId} className="panel p-0 overflow-hidden flex flex-col sm:flex-row">
              <div className={`w-full sm:w-1.5 h-1.5 sm:h-auto ${isActive ? "bg-emerald-500" : "bg-amber-500"} shrink-0`} />
              <div className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-white">{name}</span>
                    <span className="font-mono text-[0.65rem] text-slate-400">{id}</span>
                    <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full border ${
                      isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>{status}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 mt-1 text-xs text-slate-400">
                    <span>{vehicle}</span>
                    <span>{zone}</span>
                    <span>{delivered || 0} livraisons ensemble</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {revoking === partId ? (
                    <>
                      <button className="small danger text-xs" onClick={() => handleRevoke(partId)}>Confirmer</button>
                      <button className="small text-xs" onClick={() => setRevoking(null)}>Annuler</button>
                    </>
                  ) : (
                    <button className="small border-red-500/30 text-red-300 text-xs" onClick={() => setRevoking(partId)}>
                      Révoquer
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
