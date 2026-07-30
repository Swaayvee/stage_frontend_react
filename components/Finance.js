"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRelayFlow } from "../context/RelayFlowProvider";
import {
  TARIF_ABONNEMENT_MENSUEL,
  TARIF_LIVRAISON_UNITAIRE,
  TARIF_LIVRAISON_VENDEUR,
} from "../lib/domain";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

function fmtMoney(n) {
  return `${Number(n).toFixed(2).replace(".", ",")} €`;
}

function statutFacture(s) {
  if (s === "payee") return "Payée";
  if (s === "en_litige") return "En litige";
  return "Émise";
}

function FinancialLines({ record }) {
  const lines = record?.lignes || [];
  return (
    <div className="finance-lines">
      <div className="finance-lines__head">
        <span>Détail</span><span>Qté</span><span>Prix unitaire</span><span>Montant</span>
      </div>
      {lines.map((line, index) => (
        <div className="finance-lines__row" key={`${line.type}-${line.livraisonId || index}`}>
          <span>
            <b>{line.libelle}</b>
            {line.referenceLivraison && <small>{line.referenceLivraison}</small>}
          </span>
          <span>{line.quantite}</span>
          <span>{fmtMoney(line.prixUnitaire)}</span>
          <strong className={line.montant === 0 ? "text-emerald-400" : ""}>
            {fmtMoney(line.montant)}
          </strong>
        </div>
      ))}
      {!lines.length && <p className="p-4 text-sm text-slate-500">Aucune ligne détaillée.</p>}
    </div>
  );
}

function FinanceExplainer({ audience }) {
  if (audience === "merchant") {
    return (
      <section className="panel finance-explainer">
        <div>
          <p className="eyebrow">COMMENT EST CALCULÉE MA FACTURE ?</p>
          <h2>Un abonnement mensuel, puis uniquement les livraisons terminées</h2>
        </div>
        <ol>
          <li><b>{fmtMoney(TARIF_ABONNEMENT_MENSUEL)}</b><span>Abonnement mensuel</span></li>
          <li><b>+ {fmtMoney(TARIF_LIVRAISON_VENDEUR)}</b><span>Par livraison équipe ou pool livrée</span></li>
          <li><b>+ {fmtMoney(0)}</b><span>Pour une livraison effectuée en propre</span></li>
        </ol>
      </section>
    );
  }
  return (
    <section className="panel finance-explainer">
      <div>
        <p className="eyebrow">COMMENT SUIS-JE PAYÉ ?</p>
        <h2>Chaque livraison terminée rapporte {fmtMoney(TARIF_LIVRAISON_UNITAIRE)}</h2>
      </div>
      <ol>
        <li><b>1</b><span>Le gain est prévu pendant la course</span></li>
        <li><b>2</b><span>La remise confirmée attend son bon</span></li>
        <li><b>3</b><span>Le bon émis est ensuite marqué payé</span></li>
      </ol>
    </section>
  );
}

function MerchantFinance() {
  const { session, api, viewModel } = useRelayFlow();
  const { factures, abonnement } = viewModel.finance;
  const economy = viewModel.finance.economie;
  const [reportIssue, setReportIssue] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [issueSent, setIssueSent] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const facturesEnAttente = factures.filter((f) => f.statut === "emise");
  const montantEnAttente = facturesEnAttente.reduce(
    (total, facture) => total + facture.montant,
    0
  );

  const submitIssue = () => {
    if (!session || !issueText.trim()) return;
    api.createSignalement(session.compteId, {
      type: "probleme_paiement",
      description: issueText,
    });
    setIssueSent(true);
    setReportIssue(false);
  };

  return (
    <div className="space-y-6">
      <FinanceExplainer audience="merchant" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="panel p-4 bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Abonnement RelayFlow</h2>
          <div className="text-3xl font-black text-white mb-1">
            {fmtMoney(abonnement?.montantMensuel || TARIF_ABONNEMENT_MENSUEL)} <span className="text-sm text-slate-400">/ mois</span>
          </div>
          <p className="text-xs text-slate-400">Statut : <span className="text-emerald-400 font-bold">{abonnement?.statut || "actif"}</span></p>
        </div>
        <div className="panel p-4 bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Frais de livraison</h2>
          <div className="text-3xl font-black text-white mb-1">{fmtMoney(economy.coutsLivraisonsVendeur)}</div>
          <p className="text-xs text-slate-400">
            {economy.livraisonsFacturables} livraison(s) livrée(s) à {fmtMoney(TARIF_LIVRAISON_VENDEUR)}
          </p>
        </div>
        <div className="panel p-4 bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Livraisons propres</h2>
          <div className="text-3xl font-black text-emerald-400 mb-1">{fmtMoney(0)}</div>
          <p className="text-xs text-slate-400">
            {economy.livraisonsPropres} trajet(s) sans frais · {fmtMoney(economy.economieLivraisonsPropres)} économisés
          </p>
        </div>
        <div className="panel p-4 bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Factures en attente</h2>
          <div className="text-3xl font-black text-red-400 mb-1">{fmtMoney(montantEnAttente)}</div>
          <p className="text-xs text-slate-400">
            {facturesEnAttente.length
              ? `${facturesEnAttente.length} facture(s) émise(s) non réglée(s)`
              : "Aucune facture en attente"}
          </p>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="section-title"><h2>Historique des factures</h2></div>
        <div className="table">
          <div className="row table-head">
            <span>Réf.</span><span>Période</span><span>Montant</span><span>Statut</span>
          </div>
          {factures.map((f) => (
            <button type="button" className="row w-full text-left hover:bg-white/5" key={f._id} onClick={() => setSelectedInvoice(f)}>
              <span className="font-mono text-indigo-300">{f._id}</span>
              <span>{fmtDate(f.periodeDebut)} — {fmtDate(f.periodeFin)}</span>
              <span className="font-bold">{fmtMoney(f.montant)}</span>
              <span className={f.statut === "payee" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{statutFacture(f.statut)}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedInvoice && (
        <section className="panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">DÉTAIL DE LA FACTURE</p>
              <h2 className="m-0 text-xl font-black text-white">{selectedInvoice._id}</h2>
              <p className="mt-1 text-xs text-slate-400">
                {fmtDate(selectedInvoice.periodeDebut)} — {fmtDate(selectedInvoice.periodeFin)}
              </p>
            </div>
            <button type="button" className="small" onClick={() => setSelectedInvoice(null)}>Fermer</button>
          </div>
          <div className="finance-breakdown">
            <div><span>Abonnement</span><b>{fmtMoney(selectedInvoice.montantAbonnement || 0)}</b></div>
            <div><span>Livraisons facturées</span><b>{fmtMoney(selectedInvoice.montantLivraisons || 0)}</b></div>
            <div><span>Livraisons propres</span><b>{selectedInvoice.nombreLivraisonsPropres || 0} à 0 €</b></div>
          </div>
          <FinancialLines record={selectedInvoice} />
          <div className="finance-total">
            <span>Total</span><strong>{fmtMoney(selectedInvoice.montant)}</strong>
          </div>
        </section>
      )}

      <div className="panel p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Litige de facturation</h2>
        {issueSent ? (
          <p className="text-emerald-400 text-sm font-bold">✓ Signalement envoyé à votre manager.</p>
        ) : !reportIssue ? (
          <button className="small border-red-500/30 text-red-300" onClick={() => setReportIssue(true)}>Signaler un problème de paiement</button>
        ) : (
          <div className="space-y-3">
            <textarea value={issueText} onChange={(e) => setIssueText(e.target.value)} className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-2 text-sm text-white" rows={3} placeholder="Décrivez le litige…" />
            <div className="flex gap-2">
              <button className="small good" onClick={submitIssue}>Envoyer</button>
              <button className="small" onClick={() => setReportIssue(false)}>Annuler</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CourierFinance() {
  const { viewModel } = useRelayFlow();
  const { bons } = viewModel.finance;
  const economy = viewModel.finance.economie;
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const solde = bons.filter((b) => b.statut === "emis").reduce((s, b) => s + b.montantTotal, 0);
  const totalPercu = bons
    .filter((b) => b.statut === "paye")
    .reduce((s, b) => s + b.montantTotal, 0);

  return (
    <div className="space-y-6">
      <FinanceExplainer audience="courier" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="panel p-4 bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Gains prévus</h2>
          <div className="text-3xl font-black text-indigo-300">{fmtMoney(economy.gainsLivreurPrevus)}</div>
          <p className="text-xs text-slate-400">{economy.livraisonsLivreurEnCours} livraison(s) encore en cours</p>
        </div>
        <div className="panel p-4 bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">À mettre sur un bon</h2>
          <div className="text-3xl font-black text-amber-300">{fmtMoney(economy.gainsLivreurEnAttenteBon)}</div>
          <p className="text-xs text-slate-400">{economy.livraisonsLivreurEnAttenteBon} livraison(s) terminée(s), pas encore regroupée(s)</p>
        </div>
        <div className="panel p-4 bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Bons à verser</h2>
          <div className="text-3xl font-black text-emerald-400">{fmtMoney(solde)}</div>
          <p className="text-xs text-slate-400">Bons émis, en attente du versement</p>
        </div>
        <div className="panel p-4 bg-[#0d172b]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Total perçu</h2>
          <div className="text-3xl font-black text-white">{fmtMoney(totalPercu)}</div>
          <p className="text-xs text-slate-400">Uniquement les bons marqués comme payés</p>
        </div>
      </div>
      <div className="panel table-panel">
        <div className="section-title"><h2>Bons de paiement</h2></div>
        <div className="table">
          <div className="row table-head">
            <span>Réf.</span><span>Période</span><span>Livraisons</span><span>Montant</span><span>Statut</span>
          </div>
          {bons.map((b) => (
            <button type="button" className="row w-full text-left hover:bg-white/5" key={b._id} onClick={() => setSelectedVoucher(b)}>
              <span className="font-mono text-purple-300">{b._id}</span>
              <span>{fmtDate(b.periodeDebut)} — {fmtDate(b.periodeFin)}</span>
              <span>{b.nombreLivraisonsTraitees}</span>
              <span className="font-bold">{fmtMoney(b.montantTotal)}</span>
              <span className={b.statut === "paye" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{b.statut === "paye" ? "Payé" : "Émis"}</span>
            </button>
          ))}
        </div>
      </div>
      {selectedVoucher && (
        <section className="panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">DÉTAIL DU BON DE PAIEMENT</p>
              <h2 className="m-0 text-xl font-black text-white">{selectedVoucher._id}</h2>
            </div>
            <button type="button" className="small" onClick={() => setSelectedVoucher(null)}>Fermer</button>
          </div>
          <FinancialLines record={selectedVoucher} />
          <div className="finance-total">
            <span>Total à verser</span><strong>{fmtMoney(selectedVoucher.montantTotal)}</strong>
          </div>
        </section>
      )}
    </div>
  );
}

function ManagerFinance() {
  const { session, api, viewModel } = useRelayFlow();
  const { impayes, soldesLivreurs, factures, bons } = viewModel.finance;
  const merchants = viewModel.directoryData.merchants;
  const couriers = viewModel.directoryData.couriers;
  const previousMonth = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const [documentType, setDocumentType] = useState("facture");
  const [billingMonth, setBillingMonth] = useState(previousMonth);
  const [vendeurId, setVendeurId] = useState(merchants[0]?.[0] || "");
  const [livreurId, setLivreurId] = useState(couriers[0]?.[0] || "");
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [msg, setMsg] = useState(null);

  const period = useMemo(() => {
    const [year, month] = billingMonth.split("-").map(Number);
    return [
      new Date(year, month - 1, 1).toISOString(),
      new Date(year, month, 0, 23, 59, 59, 999).toISOString(),
    ];
  }, [billingMonth]);
  const activeActorId = documentType === "facture" ? vendeurId : livreurId;
  const previewResult = useMemo(() => {
    if (!session?.compteId || !activeActorId) {
      return { ok: false, error: "Aucun acteur disponible dans votre périmètre." };
    }
    return documentType === "facture"
      ? api.previewFacture(session.compteId, vendeurId, period[0], period[1])
      : api.previewBonPaiement(session.compteId, livreurId, period[0], period[1]);
  }, [api, session?.compteId, documentType, vendeurId, livreurId, activeActorId, period]);
  const preview = previewResult.preview;
  const operations = useMemo(
    () => [...factures, ...bons]
      .filter((operation) =>
        historyFilter === "all" ||
        (historyFilter === "factures" && operation.vendeurId) ||
        (historyFilter === "bons" && operation.livreurId) ||
        (historyFilter === "pending" && ["emise", "emis", "en_litige"].includes(operation.statut))
      )
      .sort((a, b) => new Date(b.dateEmission || 0) - new Date(a.dateEmission || 0)),
    [factures, bons, historyFilter]
  );
  const totalImpayes = impayes.reduce((sum, invoice) => sum + invoice.montant, 0);
  const totalAVerser = soldesLivreurs.reduce((sum, voucher) => sum + voucher.montantTotal, 0);

  const actorName = (operation) => operation.vendeurId
    ? merchants.find(([id]) => id === operation.vendeurId)?.[1] || operation.vendeurId
    : couriers.find(([id]) => id === operation.livreurId)?.[1] || operation.livreurId;

  const generateDocument = () => {
    if (!previewResult.ok || !session) return;
    const result = documentType === "facture"
      ? api.genererFacture(session.compteId, vendeurId, period[0], period[1])
      : api.genererBonPaiement(session.compteId, livreurId, period[0], period[1]);
    if (!result.ok) {
      setMsg({ type: "error", text: result.error });
      return;
    }
    const operation = result.facture || result.bon;
    setMsg({
      type: "success",
      text: documentType === "facture"
        ? `Facture ${operation._id} créée et envoyée au commerçant.`
        : `Bon ${operation._id} créé et envoyé au livreur.`,
    });
    setSelectedOperation(operation);
  };

  const recordPayment = (operation) => {
    const isInvoice = Boolean(operation.vendeurId);
    const label = isInvoice ? "le règlement de cette facture" : "le versement de ce bon";
    if (typeof window !== "undefined" && !window.confirm(`Confirmer ${label} ?`)) return;
    const result = isInvoice
      ? api.marquerFacturePayee(session?.compteId, operation._id)
      : api.marquerBonPaye(session?.compteId, operation._id);
    if (!result.ok) {
      setMsg({ type: "error", text: result.error });
      return;
    }
    setMsg({
      type: "success",
      text: isInvoice
        ? "Règlement commerçant enregistré et notifié."
        : "Versement livreur enregistré et notifié.",
    });
    setSelectedOperation(null);
  };

  return (
    <div className="manager-billing">
      <section className="billing-summary">
        <article><span>Factures à encaisser</span><b>{fmtMoney(totalImpayes)}</b><small>{impayes.length} document(s)</small></article>
        <article><span>Bons à verser</span><b>{fmtMoney(totalAVerser)}</b><small>{soldesLivreurs.length} document(s)</small></article>
        <article><span>Documents suivis</span><b>{factures.length + bons.length}</b><small>Dans votre périmètre</small></article>
      </section>

      {msg && <div className={`billing-feedback is-${msg.type}`}>{msg.text}</div>}

      <section className="billing-workspace">
        <div className="billing-builder panel">
          <div className="billing-builder__header">
            <div><p className="eyebrow">NOUVEAU DOCUMENT</p><h2>Préparer une clôture mensuelle</h2></div>
            <div className="billing-tabs" role="tablist" aria-label="Type de document">
              <button className={documentType === "facture" ? "active" : ""} onClick={() => setDocumentType("facture")}>Facture commerçant</button>
              <button className={documentType === "bon" ? "active" : ""} onClick={() => setDocumentType("bon")}>Bon livreur</button>
            </div>
          </div>

          <div className="billing-fields">
            <label>
              <span>Mois clôturé</span>
              <input type="month" value={billingMonth} onChange={(event) => setBillingMonth(event.target.value)} />
            </label>
            <label>
              <span>{documentType === "facture" ? "Commerçant facturé" : "Livreur rémunéré"}</span>
              {documentType === "facture" ? (
                <select value={vendeurId} onChange={(event) => setVendeurId(event.target.value)}>
                  {merchants.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              ) : (
                <select value={livreurId} onChange={(event) => setLivreurId(event.target.value)}>
                  {couriers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              )}
            </label>
          </div>

          {previewResult.ok ? (
            <div className="billing-preview">
              <div className="billing-preview__heading">
                <div>
                  <span>Aperçu avant génération</span>
                  <h3>{preview.acteurNom}</h3>
                  <p>{fmtDate(preview.periodeDebut)} — {fmtDate(preview.periodeFin)}</p>
                </div>
                <strong>{fmtMoney(preview.montant ?? preview.montantTotal)}</strong>
              </div>
              <div className="billing-preview__metrics">
                {documentType === "facture" ? (
                  <>
                    <div><span>Abonnement</span><b>{fmtMoney(preview.montantAbonnement)}</b></div>
                    <div><span>Livraisons payantes</span><b>{preview.nombreLivraisonsFacturees}</b></div>
                    <div><span>Livraisons propres</span><b>{preview.nombreLivraisonsPropres}</b></div>
                  </>
                ) : (
                  <>
                    <div><span>Livraisons rémunérées</span><b>{preview.nombreLivraisonsTraitees}</b></div>
                    <div><span>Tarif unitaire</span><b>{fmtMoney(preview.tarifUnitaire)}</b></div>
                    <div><span>Total à verser</span><b>{fmtMoney(preview.montantTotal)}</b></div>
                  </>
                )}
              </div>
              <FinancialLines record={preview} />
              <button type="button" className="button billing-generate" onClick={generateDocument}>
                Confirmer et générer {documentType === "facture" ? "la facture" : "le bon"}
              </button>
            </div>
          ) : (
            <div className="billing-preview-error">
              <b>Document non générable</b>
              <p>{previewResult.error}</p>
              <small>Choisissez une autre personne ou un autre mois, ou ouvrez le document existant dans l’historique.</small>
              {previewResult.existingId && (
                <button
                  type="button"
                  className="small mt-3"
                  onClick={() => {
                    const existing = [...factures, ...bons].find(
                      (operation) => operation._id === previewResult.existingId
                    );
                    if (existing) setSelectedOperation(existing);
                  }}
                >
                  Ouvrir {previewResult.existingId}
                </button>
              )}
            </div>
          )}
        </div>

        <aside className="billing-guide panel">
          <p className="eyebrow">FONCTIONNEMENT</p>
          <h2>Un cycle en quatre étapes</h2>
          <ol>
            <li><b>1</b><span>Choisir un mois terminé et un acteur de votre zone.</span></li>
            <li><b>2</b><span>Vérifier chaque ligne calculée avant la création.</span></li>
            <li><b>3</b><span>Générer une seule fois le document pour cette période.</span></li>
            <li><b>4</b><span>Enregistrer le règlement ou le versement après confirmation réelle.</span></li>
          </ol>
          <p className="billing-guide__security">Les montants sont calculés depuis les livraisons terminées. Les actions sont contrôlées selon votre rôle et votre juridiction.</p>
        </aside>
      </section>

      <section className="billing-history panel">
        <div className="billing-history__header">
          <div><p className="eyebrow">HISTORIQUE</p><h2>Factures et bons de paiement</h2></div>
          <select value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}>
            <option value="all">Tous les documents</option>
            <option value="factures">Factures uniquement</option>
            <option value="bons">Bons uniquement</option>
            <option value="pending">En attente de paiement</option>
          </select>
        </div>
        <div className="billing-documents">
          {operations.map((operation) => {
            const isInvoice = Boolean(operation.vendeurId);
            const paid = ["payee", "paye"].includes(operation.statut);
            return (
              <button key={operation._id} type="button" onClick={() => setSelectedOperation(operation)}>
                <span className={`billing-document__type ${isInvoice ? "is-invoice" : "is-voucher"}`}>
                  {isInvoice ? "Facture" : "Bon"}
                </span>
                <span><b>{operation._id}</b><small>{actorName(operation)} · {fmtDate(operation.periodeDebut)} — {fmtDate(operation.periodeFin)}</small></span>
                <strong>{fmtMoney(operation.montant ?? operation.montantTotal)}</strong>
                <em className={paid ? "is-paid" : "is-pending"}>{paid ? "Payé" : "À traiter"}</em>
              </button>
            );
          })}
          {!operations.length && <p className="billing-empty">Aucun document pour ce filtre.</p>}
        </div>
      </section>

      {selectedOperation && (
        <div className="billing-detail-backdrop" onClick={() => setSelectedOperation(null)}>
          <section className="billing-detail" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header>
              <div><p className="eyebrow">{selectedOperation.vendeurId ? "FACTURE COMMERÇANT" : "BON LIVREUR"}</p><h2>{selectedOperation._id}</h2><span>{actorName(selectedOperation)}</span></div>
              <button className="small" onClick={() => setSelectedOperation(null)}>Fermer</button>
            </header>
            <dl>
              <div><dt>Période</dt><dd>{fmtDate(selectedOperation.periodeDebut)} — {fmtDate(selectedOperation.periodeFin)}</dd></div>
              <div><dt>Émission</dt><dd>{fmtDate(selectedOperation.dateEmission)}</dd></div>
              <div><dt>Statut</dt><dd>{selectedOperation.vendeurId ? statutFacture(selectedOperation.statut) : selectedOperation.statut === "paye" ? "Payé" : "Émis"}</dd></div>
            </dl>
            <FinancialLines record={selectedOperation} />
            <div className="finance-total"><span>Total</span><strong>{fmtMoney(selectedOperation.montant ?? selectedOperation.montantTotal)}</strong></div>
            {["emise", "emis", "en_litige"].includes(selectedOperation.statut) && (
              <button className="button billing-payment" onClick={() => recordPayment(selectedOperation)}>
                {selectedOperation.vendeurId ? "Enregistrer le règlement reçu" : "Enregistrer le versement effectué"}
              </button>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function SuperManagerFinance() {
  const { viewModel } = useRelayFlow();
  const { factures, bons, impayes, soldesLivreurs } = viewModel.finance;
  const [selectedMetric, setSelectedMetric] = useState("revenus");
  const [selectedOperation, setSelectedOperation] = useState(null);
  const revenusFactures = factures.reduce((sum, invoice) => sum + invoice.montant, 0);
  const revenusEncaisses = factures
    .filter((invoice) => invoice.statut === "payee")
    .reduce((sum, invoice) => sum + invoice.montant, 0);
  const totalImpayes = impayes.reduce((sum, invoice) => sum + invoice.montant, 0);
  const chargesEmises = bons.reduce((sum, voucher) => sum + voucher.montantTotal, 0);
  const chargesPayees = bons
    .filter((voucher) => voucher.statut === "paye")
    .reduce((sum, voucher) => sum + voucher.montantTotal, 0);
  const chargesAVerser = soldesLivreurs.reduce((sum, voucher) => sum + voucher.montantTotal, 0);
  const soldeNetEncaisse = revenusEncaisses - chargesPayees;

  const metrics = [
    ["revenus", "Revenus facturés", revenusFactures, `${factures.length} facture(s)`],
    ["encaisses", "Revenus encaissés", revenusEncaisses, "Factures payées"],
    ["charges", "Charges livreurs payées", chargesPayees, `${fmtMoney(chargesEmises)} émises`],
    ["impayes", "Impayés vendeurs", totalImpayes, `${impayes.length} facture(s)`],
    ["averser", "À verser aux livreurs", chargesAVerser, `${soldesLivreurs.length} bon(s)`],
    ["net", "Solde net encaissé", soldeNetEncaisse, "Encaissé - charges payées"],
  ];

  const metricItems =
    selectedMetric === "revenus"
      ? factures
      : selectedMetric === "encaisses"
        ? factures.filter((item) => item.statut === "payee")
        : selectedMetric === "impayes"
          ? impayes
          : selectedMetric === "charges"
            ? bons.filter((item) => item.statut === "paye")
            : selectedMetric === "averser"
              ? soldesLivreurs
              : [...factures.filter((item) => item.statut === "payee"), ...bons.filter((item) => item.statut === "paye")];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {metrics.map(([key, label, amount, detail]) => (
          <button
            type="button"
            key={key}
            onClick={() => setSelectedMetric(key)}
            className={`panel p-4 text-left transition ${
              selectedMetric === key ? "border-indigo-400/50 bg-indigo-500/10" : "hover:border-white/25"
            }`}
          >
            <h2 className="text-sm font-bold uppercase text-slate-500">{label}</h2>
            <div className={`text-3xl font-black ${amount < 0 ? "text-red-400" : "text-white"}`}>{fmtMoney(amount)}</div>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </button>
        ))}
      </div>
      <div className="panel table-panel">
        <div className="section-title">
          <div>
            <h2>Détail du calcul</h2>
            <p>Cliquez sur une opération pour consulter sa période et son mode de calcul.</p>
          </div>
        </div>
        <div className="table">
          <div className="row table-head"><span>ID</span><span>Type</span><span>Montant</span><span>Statut</span></div>
          {metricItems.map((item) => (
            <button type="button" className="row w-full text-left hover:bg-white/5" key={item._id} onClick={() => setSelectedOperation(item)}>
              <span className="font-mono text-slate-400">{item._id}</span>
              <span>{item.vendeurId ? "Facture" : "Bon paiement"}</span>
              <span className="font-bold">{fmtMoney(item.montant ?? item.montantTotal)}</span>
              <span>{item.statut}</span>
            </button>
          ))}
          {metricItems.length === 0 && <p className="p-4 text-sm text-slate-500">Aucune opération pour cet indicateur.</p>}
        </div>
      </div>
      {selectedOperation && (
        <div className="panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">DÉTAIL FINANCIER</p>
              <h2 className="m-0 text-xl font-black text-white">{selectedOperation._id}</h2>
            </div>
            <button className="small" onClick={() => setSelectedOperation(null)}>Fermer</button>
          </div>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div><dt className="text-slate-500">Période</dt><dd>{fmtDate(selectedOperation.periodeDebut)} — {fmtDate(selectedOperation.periodeFin)}</dd></div>
            <div><dt className="text-slate-500">Statut</dt><dd>{selectedOperation.statut}</dd></div>
            {selectedOperation.vendeurId ? (
              <>
                <div><dt className="text-slate-500">Abonnement</dt><dd>{fmtMoney(selectedOperation.montantAbonnement ?? selectedOperation.montant)}</dd></div>
                <div><dt className="text-slate-500">Frais de livraison</dt><dd>{fmtMoney(selectedOperation.montantLivraisons || 0)}</dd></div>
                <div><dt className="text-slate-500">Montant facturé</dt><dd>{fmtMoney(selectedOperation.montant)}</dd></div>
              </>
            ) : (
              <>
                <div><dt className="text-slate-500">Calcul</dt><dd>{selectedOperation.nombreLivraisonsTraitees} livraison(s) × {fmtMoney(selectedOperation.tarifUnitaire)}</dd></div>
                <div><dt className="text-slate-500">Montant du bon</dt><dd>{fmtMoney(selectedOperation.montantTotal)}</dd></div>
              </>
            )}
          </dl>
          <FinancialLines record={selectedOperation} />
        </div>
      )}
    </div>
  );
}

export default function Finance({ role }) {
  if (role === "merchant") return <MerchantFinance />;
  if (role === "courier") return <CourierFinance />;
  if (role === "manager") return <ManagerFinance />;
  if (role === "super_manager") return <SuperManagerFinance />;
  return null;
}
