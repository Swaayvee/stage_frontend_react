"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ─── Types de notifications par rôle ─── */
const notifTemplates = {
  courier: [
    { id: "n1", icon: "📦", title: "Nouvelle livraison disponible", body: "LIV-2026-057 · Maison Olive · 1.4 km de vous", type: "delivery", href: "/courier/available" },
    { id: "n2", icon: "📦", title: "Livraison à proximité", body: "LIV-2026-058 · Atelier Nami · 2.8 km · Automatique", type: "delivery", href: "/courier/available" },
    { id: "n3", icon: "⏱️", title: "Rappel : livraison en cours", body: "LIV-2026-042 · Confirmez la remise au client", type: "reminder", href: "/courier/deliveries" },
  ],
  merchant: [
    { id: "n4", icon: "🚴", title: "Livreur assigné", body: "Maya Richard prend en charge LIV-2026-041", type: "info", href: "/merchant/deliveries" },
    { id: "n5", icon: "✅", title: "Livraison confirmée", body: "LIV-2026-040 livrée avec succès au client", type: "success", href: "/merchant/deliveries" },
    { id: "n6", icon: "⚠️", title: "Livraison sans livreur", body: "LIV-2026-038 attend une attribution depuis 45 min", type: "warning", href: "/merchant/assign-courier" },
  ],
  "mgr-9a8f2k4x": [
    { id: "n7", icon: "📋", title: "Nouvelle demande d'adhésion", body: "Boulangerie Félix — dossier complet à étudier", type: "info", href: "/mgr-9a8f2k4x/applications" },
    { id: "n8", icon: "🔴", title: "Incident signalé", body: "INC-043 · Colis non remis · Maison Olive", type: "urgent", href: "/mgr-9a8f2k4x/issues" },
    { id: "n9", icon: "📋", title: "Demande livreur reçue", body: "Antoine Graux — vélo cargo · Lyon 6e", type: "info", href: "/mgr-9a8f2k4x/applications" },
  ],
  "sm-3v8n1w9z": [
    { id: "n10", icon: "🔴", title: "Incident critique réseau", body: "INC-044 · Livreur injoignable · 2 livraisons bloquées", type: "urgent", href: "/sm-3v8n1w9z/issues" },
    { id: "n11", icon: "📊", title: "Rapport hebdomadaire prêt", body: "214 livraisons cette semaine · +8% vs semaine passée", type: "info", href: "/sm-3v8n1w9z/deliveries" },
    { id: "n12", icon: "⚠️", title: "Compte signalé", body: "LIV-144 · Inès Laurent · 3 incidents ce mois", type: "warning", href: "/sm-3v8n1w9z/couriers" },
  ],
};

const DELAYS = [8000, 18000, 35000]; // délais de simulation en ms

/* ─── Toast ─── */
function Toast({ notif, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    delivery: "border-indigo-500/40 bg-indigo-500/10",
    urgent: "border-red-500/40 bg-red-500/10",
    warning: "border-amber-500/40 bg-amber-500/10",
    success: "border-emerald-500/40 bg-emerald-500/10",
    info: "border-white/15 bg-white/5",
    reminder: "border-purple-500/40 bg-purple-500/10",
  };

  return (
    <div
      className={`toast-notif flex items-start gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-xl cursor-pointer ${colors[notif.type] || colors.info}`}
      onClick={onClose}
      role="alert"
    >
      <span className="text-xl shrink-0 mt-0.5">{notif.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-xs font-bold text-white leading-tight">{notif.title}</p>
        <p className="m-0 mt-0.5 text-[0.7rem] text-slate-400 leading-snug">{notif.body}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="text-slate-500 hover:text-white text-xs shrink-0 mt-0.5 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

/* ─── Panneau notifications ─── */
function NotifPanel({ notifs, onRead, onClearAll, onClose }) {
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div
      className="notif-panel absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/15 bg-[#0a1225] shadow-2xl overflow-hidden z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="m-0 text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">Notifications</p>
          {unread > 0 && (
            <p className="m-0 text-xs font-bold text-white">{unread} non lue{unread > 1 ? "s" : ""}</p>
          )}
        </div>
        <button
          onClick={onClearAll}
          className="text-[0.65rem] font-bold text-indigo-400 hover:text-indigo-200 transition-colors uppercase tracking-wider"
        >
          Tout lire
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
        {notifs.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <span className="text-3xl mb-2 block">🔔</span>
            <p className="text-xs text-slate-500 font-medium">Aucune notification</p>
          </div>
        ) : (
          notifs.map((n) => (
            <button
              key={n.id}
              onClick={() => onRead(n.id)}
              className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-start gap-3 ${!n.read ? "bg-indigo-500/5" : ""}`}
            >
              <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`m-0 text-xs font-bold leading-tight ${!n.read ? "text-white" : "text-slate-400"}`}>
                  {n.title}
                </p>
                <p className="m-0 mt-0.5 text-[0.68rem] text-slate-500 leading-snug truncate">{n.body}</p>
                <p className="m-0 mt-1 text-[0.62rem] text-slate-600">Il y a quelques instants</p>
              </div>
              {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Export principal ─── */
export default function NotificationCenter({ role }) {
  const templates = notifTemplates[role] || [];
  const [notifs, setNotifs] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  /* Demande la permission pour les notifications navigateur au montage */
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  /* Déclenche une notification navigateur native si la permission est accordée */
  function triggerWebPush(notif) {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(notif.title, { body: notif.body, icon: '/favicon.ico', tag: notif.id });
    } catch (_) {}
  }

  /* Simulation des notifications à des intervalles définis */
  useEffect(() => {
    if (!templates.length) return;
    const timers = DELAYS.map((delay, i) => {
      return setTimeout(() => {
        const tmpl = templates[i % templates.length];
        const newNotif = { ...tmpl, id: `${tmpl.id}-${Date.now()}`, read: false };
        setNotifs((prev) => [newNotif, ...prev].slice(0, 20));
        setToasts((prev) => [...prev, newNotif]);
        triggerWebPush(newNotif);
      }, delay);
    });
    return () => timers.forEach(clearTimeout);
  }, [role]); // eslint-disable-line

  /* Fermer le panneau en cliquant dehors */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = notifs.filter((n) => !n.read).length;

  const markRead = (id) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const clearAll = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <>
      {/* Cloche */}
      <div className="notif-bell-wrap relative" ref={panelRef}>
        <button
          className="notif-bell"
          aria-label="Notifications"
          onClick={() => setOpen((v) => !v)}
        >
          🔔
          {unread > 0 && (
            <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>
          )}
        </button>

        {open && (
          <NotifPanel
            notifs={notifs}
            onRead={markRead}
            onClearAll={clearAll}
            onClose={() => setOpen(false)}
          />
        )}
      </div>

      {/* Toasts flottants — portail vers <body> pour échapper au backdrop-filter de la sidebar */}
      {mounted && createPortal(
        <div className="toast-stack" aria-live="polite">
          {toasts.map((t) => (
            <Toast key={t.id} notif={t} onClose={() => removeToast(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
