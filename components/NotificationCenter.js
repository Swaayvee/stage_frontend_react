"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRelayFlow } from "../context/RelayFlowProvider";
import { collectNewNotificationToasts } from "../lib/notificationToast";

const TYPE_ICON = {
  maj_etat_livraison: "📦",
  message_recu: "💬",
  urgence: "🔴",
  finance: "€",
  livraison_attribuee: "📦",
  succes: "✓",
  information: "i",
};

function Toast({ notif, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="toast-notif flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-3.5 shadow-2xl backdrop-blur-xl cursor-pointer"
      onClick={onClose}
      role="alert"
    >
      <span className="text-xl shrink-0 mt-0.5">{TYPE_ICON[notif.type] || "🔔"}</span>
      <div className="flex-1 min-w-0">
        <p className="m-0 text-xs font-bold text-white leading-tight">{notif.titre}</p>
        <p className="m-0 mt-0.5 text-[0.7rem] text-slate-400 leading-snug">{notif.contenu}</p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-slate-500 hover:text-white text-xs">✕</button>
    </div>
  );
}

function NotifPanel({ notifs, onRead, onClearAll }) {
  const unread = notifs.filter((n) => !n.lu).length;
  return (
    <div className="notif-panel absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/15 bg-[#0a1225] shadow-2xl overflow-hidden z-50">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="m-0 text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">Notifications</p>
          {unread > 0 && <p className="m-0 text-xs font-bold text-white">{unread} non lue{unread > 1 ? "s" : ""}</p>}
        </div>
        <button onClick={onClearAll} className="text-[0.65rem] font-bold text-indigo-400 uppercase">Tout lire</button>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
        {notifs.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <span className="text-3xl mb-2 block">🔔</span>
            <p className="text-xs text-slate-500">Aucune notification</p>
          </div>
        ) : (
          notifs.map((n) => (
            <Link
              key={n._id}
              href={n.lienRessource || "#"}
              onClick={() => onRead(n._id)}
              className={`block px-4 py-3 hover:bg-white/5 ${!n.lu ? "bg-indigo-500/5" : ""}`}
            >
              <p className={`m-0 text-xs font-bold ${!n.lu ? "text-white" : "text-slate-400"}`}>{n.titre}</p>
              <p className="m-0 mt-0.5 text-[0.68rem] text-slate-500 truncate">{n.contenu}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function NotificationCenter({ role }) {
  const { viewModel, session, api } = useRelayFlow();
  const notifs = viewModel.notificationsForUser || [];
  const [toasts, setToasts] = useState([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

  useEffect(() => {
    const fresh = collectNewNotificationToasts(session?.compteId, notifs);
    if (!fresh.length) return;
    fresh.forEach((n) => {
      setToasts((prev) => [...prev, n].slice(-3));
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(n.titre, { body: n.contenu, tag: n._id });
        } catch (_) {}
      }
    });
  }, [notifs, session?.compteId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = notifs.filter((n) => !n.lu).length;

  return (
    <>
      <div className="notif-bell-wrap relative" ref={panelRef}>
        <button className="notif-bell" aria-label="Notifications" onClick={() => setOpen((v) => !v)}>
          🔔
          {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
        </button>
        {open && (
          <NotifPanel
            notifs={notifs}
            onRead={(id) => api.markNotificationRead(id)}
            onClearAll={() => session && api.markAllNotificationsRead(session.compteId)}
          />
        )}
      </div>
      {mounted && createPortal(
        <div className="toast-stack" aria-live="polite">
          {toasts.map((t) => (
            <Toast key={t._id} notif={t} onClose={() => setToasts((prev) => prev.filter((x) => x._id !== t._id))} />
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
