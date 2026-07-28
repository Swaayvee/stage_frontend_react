"use client";
import { useState } from "react";
import Link from "next/link";

/* -- Composants spécifiques par rôle -- */

function MerchantFinance() {
  const [reportIssue, setReportIssue] = useState(false);
  const [issueSent, setIssueSent] = useState(false);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">FINANCES & FACTURES</p>
        <h1 className="text-2xl font-black text-white">Votre situation financière</h1>
        <p className="text-slate-400">Consultez vos factures d'abonnement et réglez vos frais.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Abonnement RelayFlow</h2>
          <div className="text-3xl font-black text-white mb-1">19,90 € <span className="text-sm font-medium text-slate-400">/ mois</span></div>
          <p className="text-xs text-slate-400 font-medium mb-4">Statut: <span className="text-emerald-400 font-bold">Actif</span> (Renouvellement le 14 Août)</p>
          <button className="button small">Gérer mon abonnement</button>
        </div>
        <div className="panel bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Factures en attente</h2>
          <div className="text-3xl font-black text-red-400 mb-1">19,90 €</div>
          <p className="text-xs text-slate-400 font-medium mb-4">Facture Juillet 2026 - À régler avant le 30/07</p>
          <button className="button small bg-indigo-600 border-indigo-500">Payer maintenant</button>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="section-title">
          <h2>Historique des factures</h2>
        </div>
        <div className="table">
          <div className="row table-head">
            <span>Réf. Facture</span>
            <span>Période</span>
            <span>Montant</span>
            <span>Statut</span>
          </div>
          {[
            ["FAC-2026-06", "01/06 - 30/06", "19,90 €", "Payée"],
            ["FAC-2026-05", "01/05 - 31/05", "19,90 €", "Payée"],
          ].map(([id, period, amount, status]) => (
            <div className="row" key={id}>
              <span className="font-mono text-indigo-300 font-semibold">{id}</span>
              <span className="text-slate-200">{period}</span>
              <span className="font-bold text-white">{amount}</span>
              <span className="text-emerald-400 font-bold">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Litige Paiement */}
      <div className="panel">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Ouvrir un litige de facturation</h2>
        {issueSent ? (
          <p className="text-sm font-semibold text-emerald-400">✓ Signalement de facturation envoyé avec succès. Un gestionnaire vous contactera.</p>
        ) : !reportIssue ? (
          <button className="small border-red-500/30 text-red-300 hover:bg-red-500/10" onClick={() => setReportIssue(true)}>
            Signaler un problème de paiement ou facture
          </button>
        ) : (
          <div className="space-y-3 mt-3">
            <textarea
              placeholder="Décrivez l'erreur de facturation..."
              className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white"
              rows={3}
            />
            <div className="flex gap-2">
              <button className="small good" onClick={() => { setIssueSent(true); setReportIssue(false); }}>Envoyer</button>
              <button className="small" onClick={() => setReportIssue(false)}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CourierFinance() {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">MES GAINS & PAIEMENTS</p>
        <h1 className="text-2xl font-black text-white">Vos finances</h1>
        <p className="text-slate-400">Consultez vos bons de paiement et vos livraisons facturées.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Solde à verser (Juillet)</h2>
          <div className="text-3xl font-black text-emerald-400 mb-1">112,50 €</div>
          <p className="text-xs text-slate-400 font-medium mb-4">75 livraisons × 1,50 € <br/>Le versement s'effectue automatiquement en fin de mois.</p>
        </div>
        <div className="panel bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Total gagné (Année)</h2>
          <div className="text-3xl font-black text-white mb-1">1 245,00 €</div>
          <p className="text-xs text-slate-400 font-medium mb-4">830 livraisons traitées (Livrées)</p>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="section-title">
          <h2>Vos Bons de Paiement</h2>
        </div>
        <div className="table">
          <div className="row table-head">
            <span>Réf. Bon</span>
            <span>Période</span>
            <span>Livraisons</span>
            <span>Montant</span>
            <span>Statut</span>
          </div>
          {[
            ["BON-2026-06", "Juin 2026", "120", "180,00 €", "Payé"],
            ["BON-2026-05", "Mai 2026", "98", "147,00 €", "Payé"],
          ].map(([id, period, qty, amount, status]) => (
            <div className="row" key={id}>
              <span className="font-mono text-purple-300 font-semibold">{id}</span>
              <span className="text-slate-200">{period}</span>
              <span className="text-slate-400">{qty} courses</span>
              <span className="font-bold text-white">{amount}</span>
              <span className="text-emerald-400 font-bold">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ManagerFinance() {
  const [successMsg, setSuccessMsg] = useState("");

  const generateInvoice = () => {
    setSuccessMsg("✓ Facture générée avec succès pour les commerçants de votre zone.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const generateVoucher = () => {
    setSuccessMsg("✓ Bon de paiement généré avec succès pour les livreurs.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">JURIDICTION : LYON CENTRE</p>
        <h1 className="text-2xl font-black text-white">Gestion Financière</h1>
        <p className="text-slate-400">Générez les factures et bons de paiement pour votre zone, et supervisez les impayés.</p>
      </header>

      {successMsg && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-emerald-400 font-bold text-sm">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Commerçants (Factures)</h2>
          <p className="text-xs text-slate-400 mb-4">Abonnement fixe de 19,90€ / mois.</p>
          <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5 mb-4">
            <span className="text-sm font-medium text-slate-300">Impayés actuels</span>
            <span className="text-red-400 font-bold">2 vendeurs (39,80 €)</span>
          </div>
          <button className="button small w-full bg-indigo-600 border-indigo-500" onClick={generateInvoice}>
            Générer les factures (Juillet)
          </button>
        </div>
        
        <div className="panel bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Livreurs (Bons de paiement)</h2>
          <p className="text-xs text-slate-400 mb-4">Rémunération fixe de 1,50€ / livraison terminée.</p>
          <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5 mb-4">
            <span className="text-sm font-medium text-slate-300">Soldes en attente</span>
            <span className="text-amber-400 font-bold">14 livreurs (480,00 €)</span>
          </div>
          <button className="button small w-full bg-emerald-600 border-emerald-500" onClick={generateVoucher}>
            Générer les bons de paiement
          </button>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="section-title">
          <h2>Dossiers Financiers en anomalie (Impayés / Litiges)</h2>
        </div>
        <div className="table">
          <div className="row table-head">
            <span>Réf. ID</span>
            <span>Utilisateur</span>
            <span>Rôle</span>
            <span>Montant en jeu</span>
            <span>Statut</span>
            <span>Action</span>
          </div>
          {[
            ["MER-018", "Boutique Mode", "Commerçant", "19,90 €", "Impayé (15j)"],
            ["LIV-102", "Marc Leroy", "Livreur", "45,00 €", "Litige paiement"],
          ].map(([id, name, role, amount, status]) => (
            <div className="row items-center" key={id}>
              <span className="font-mono text-slate-400 font-bold">{id}</span>
              <span className="text-slate-200">{name}</span>
              <span className="text-xs font-bold text-slate-500 uppercase">{role}</span>
              <span className="font-bold text-white">{amount}</span>
              <span className="text-red-400 font-bold text-xs">{status}</span>
              <span><Link href={`/manager/issues/${id}`} className="small text-xs px-2 py-1">Voir</Link></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SuperManagerFinance() {
  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">VUE GLOBALE SANS RESTRICTION</p>
        <h1 className="text-2xl font-black text-white">Supervision Financière</h1>
        <p className="text-slate-400">Consultez les flux financiers de l'ensemble du réseau RelayFlow.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="panel bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">Revenus Abonnements (Mois)</h2>
          <div className="text-3xl font-black text-emerald-400">2 507,40 €</div>
          <p className="text-xs text-slate-400 mt-2">126 commerçants actifs × 19,90€</p>
        </div>
        <div className="panel bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">Charges Livreurs (Mois)</h2>
          <div className="text-3xl font-black text-amber-400">1 860,00 €</div>
          <p className="text-xs text-slate-400 mt-2">1240 livraisons × 1,50€</p>
        </div>
        <div className="panel bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">Total Impayés Globaux</h2>
          <div className="text-3xl font-black text-red-400">159,20 €</div>
          <p className="text-xs text-slate-400 mt-2">8 commerçants en retard</p>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="directory-toolbar">
          <input placeholder="Rechercher vendeur/livreur ou ID..." />
          <select>
            <option>Toutes les zones (Pays)</option>
            <option>Département: Hérault</option>
            <option>Ville: Lyon</option>
          </select>
          <select>
            <option>Tous les rôles</option>
            <option>Commerçants</option>
            <option>Livreurs</option>
          </select>
        </div>
        
        <div className="table mt-4">
          <div className="row table-head">
            <span>ID</span>
            <span>Utilisateur</span>
            <span>Zone</span>
            <span>Solde actuel</span>
            <span>Dernière opération</span>
          </div>
          {[
            ["MER-028", "Épicerie des Canuts", "Lyon 4e", "+19.90 € (Réglé)", "14/07/2026"],
            ["LIV-214", "Karim Diallo", "Villeurbanne", "-45.00 € (À verser)", "15/07/2026"],
          ].map(([id, name, zone, balance, date]) => (
            <div className="row" key={id}>
              <span className="font-mono text-slate-400">{id}</span>
              <span className="font-bold text-white">{name}</span>
              <span className="text-slate-400">{zone}</span>
              <span className={`font-bold ${balance.includes('+') ? 'text-emerald-400' : 'text-amber-400'}`}>{balance}</span>
              <span className="text-slate-500">{date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Finance({ role }) {
  if (role === "merchant") return <MerchantFinance />;
  if (role === "courier") return <CourierFinance />;
  if (role === "manager") return <ManagerFinance />;
  if (role === "super_manager") return <SuperManagerFinance />;
  return <p>Rôle inconnu</p>;
}
