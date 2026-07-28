"use client";
import { useState } from "react";

// Données fictives de partenaires livreurs de l'équipe
const teamData = [
  ["LIV-007", "Lucas Martin", "Vélo électrique", "Lyon Centre", "4.9 ★", "Partenaire actif", "67 livraisons ensemble"],
  ["LIV-012", "Fatima Benali", "Scooter", "Lyon 3e / 7e", "4.8 ★", "Partenaire actif", "42 livraisons ensemble"],
  ["LIV-033", "Pierre Valentin", "Vélo classique", "Villeurbanne", "4.7 ★", "En attente de confirmation", "0 livraison ensemble"],
];

export default function TeamManager() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [revoked, setRevoked] = useState([]);
  const [team, setTeam] = useState(teamData);

  const handleRevoke = (id) => {
    setTeam((t) => t.filter((c) => c[0] !== id));
    setRevoking(null);
    setRevoked((r) => [...r, id]);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">PARTENARIATS LIVREURS</p>
        <h1 className="text-2xl font-black text-white">Mon équipe de livreurs</h1>
        <p className="text-slate-400">
          Gérez vos partenariats réguliers. Les membres de votre équipe reçoivent vos livraisons en priorité
          avant le pool général de la plateforme.
        </p>
      </header>

      {/* CTA Inviter un livreur */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 flex items-center justify-between gap-4">
        <div>
          <span className="text-sm font-bold text-white block">🤝 Proposer un partenariat à un livreur</span>
          <span className="text-xs text-slate-400 mt-0.5 block">
            Trouvez un livreur de confiance et invitez-le à rejoindre votre équipe.
          </span>
        </div>
        <button className="button small shrink-0" onClick={() => { setShowInvite(!showInvite); setInviteSent(false); }}>
          {showInvite ? "Annuler" : "+ Ajouter un livreur"}
        </button>
      </div>

      {/* Formulaire d'invitation partenariat */}
      {showInvite && (
        <form
          className="panel form space-y-4"
          onSubmit={(e) => { e.preventDefault(); setInviteSent(true); }}
        >
          <p className="eyebrow">DEMANDE DE PARTENARIAT</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label>
              <span>Référence ou nom du livreur</span>
              <input type="text" required placeholder="LIV-XXX ou Nom Prénom" />
            </label>
            <label>
              <span>Message d'invitation (optionnel)</span>
              <input type="text" placeholder="Bonjour, je souhaite vous proposer..." />
            </label>
          </div>
          {inviteSent ? (
            <p className="text-emerald-400 font-bold text-sm">
              ✓ Demande de partenariat envoyée ! Le livreur recevra une notification.
            </p>
          ) : (
            <button className="button w-full">Envoyer la demande de partenariat</button>
          )}
        </form>
      )}

      {/* Liste des partenaires */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Membres de mon équipe ({team.length})
        </h2>

        {team.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-8 text-center">
            <p className="text-slate-400 text-sm">Vous n'avez pas encore de livreurs partenaires.</p>
          </div>
        )}

        {team.map((courier) => {
          const [id, name, vehicle, zone, rating, status, stats] = courier;
          const isActive = status === "Partenaire actif";
          return (
            <article
              key={id}
              className="panel p-0 overflow-hidden flex flex-col sm:flex-row items-stretch transition hover:border-indigo-400/30"
            >
              {/* Color bar */}
              <div className={`w-full sm:w-1.5 h-1.5 sm:h-auto ${isActive ? "bg-emerald-500" : "bg-amber-500"} shrink-0`} />
              
              <div className="p-4 flex-1 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar placeholder */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                  🚴
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-white">{name}</span>
                    <span className="font-mono text-[0.65rem] text-slate-400">{id}</span>
                    <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full border ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-400">
                    <span>🚲 {vehicle}</span>
                    <span>📍 {zone}</span>
                    <span>⭐ {rating}</span>
                    <span>📦 {stats}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button className="small text-xs">Contacter</button>
                  {revoking === id ? (
                    <div className="flex gap-1">
                      <button
                        className="small danger text-xs"
                        onClick={() => handleRevoke(id)}
                      >
                        Confirmer
                      </button>
                      <button className="small text-xs" onClick={() => setRevoking(null)}>Annuler</button>
                    </div>
                  ) : (
                    <button
                      className="small border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs"
                      onClick={() => setRevoking(id)}
                    >
                      Révoquer
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {revoked.length > 0 && (
          <p className="text-xs text-slate-500 font-medium">
            {revoked.length} partenariat(s) révoqué(s) dans cette session.
          </p>
        )}
      </div>

      {/* Info bloc */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400 space-y-1">
        <span className="text-white font-bold block text-sm">ℹ️ Comment fonctionne l'équipe ?</span>
        <p>Lorsque vous créez une livraison, les membres de votre équipe reçoivent une proposition en priorité avant le pool général.</p>
        <p>Si aucun membre de votre équipe n'accepte dans les <strong className="text-slate-200">5 minutes</strong>, la livraison est diffusée à l'ensemble des livreurs disponibles.</p>
      </div>
    </div>
  );
}
