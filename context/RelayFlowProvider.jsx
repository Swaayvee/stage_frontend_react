"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as store from "../lib/store";
import { buildViewModel } from "../lib/viewModel";
import { displayNameForCompte } from "../lib/store";

const RelayFlowContext = createContext(null);

const CENTRAL_ACTIONS = new Set([
  "createLivraison", "assignCourier", "decideDeliveryCandidate", "createSignalement",
  "sendIssueMessage", "markIssueMessagesRead", "submitEvaluation", "submitSellerEvaluation",
  "proposerPartenariat", "revoquerPartenariat", "acceptOffer", "refuseOffer", "confirmRetrait",
  "confirmLivraison", "markEchec", "setStatutOperationnel", "accepterPartenariat",
  "rejeterPartenariat", "updateProfile", "updateLivreurCoords", "stopLivreurLocationSharing",
  "updateLivreurPreferences", "traiterSignalement", "suspendreCompte", "reactiverCompte",
  "inviterGestionnaire", "genererFacture", "genererBonPaiement", "marquerFacturePayee",
  "marquerBonPaye", "markNotificationRead", "markAllNotificationsRead",
]);

async function synchronizeBusinessState() {
  const role = store.getSession()?.role;
  if (!role) return { ok: false, error: "Session locale absente." };
  const response = await fetch("/api/data/state", {
    cache: "no-store",
    headers: { "X-RelayFlow-Role": role },
  }).catch(() => null);
  const payload = response ? await response.json().catch(() => null) : null;
  if (!response?.ok || !payload?.state)
    return { ok: false, error: payload?.error || "Données MongoDB indisponibles." };
  return store.replaceStateFromServer(payload.state);
}

export function RelayFlowProvider({ children }) {
  const [state, setState] = useState(null);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    store.loadState();
    setState(store.getState());
    const initialSession = store.getSession();
    setSession(initialSession);
    const unsubscribe = store.subscribe((s) => setState({ ...s }));
    const synchronizeFromStorage = (event) => {
      if (event.key && !event.key.startsWith("relayflow_")) return;
      store.loadState();
      setState({ ...store.getState() });
      setSession(store.getSession());
    };
    window.addEventListener("storage", synchronizeFromStorage);
    let active = true;
    (async () => {
      if (initialSession) {
        const result = await synchronizeBusinessState();
        if (!result.ok && active) {
          store.logout();
          setSession(null);
        }
      }
      if (active) setReady(true);
    })();
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("storage", synchronizeFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!ready || !session) return;
    const refresh = () => {
      if (document.visibilityState === "visible") synchronizeBusinessState();
    };
    const interval = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [ready, session?.compteId]);

  const refreshSession = useCallback(() => {
    setSession(store.getSession());
  }, []);

  const api = useMemo(
    () => {
      const centralizedActions = Object.fromEntries(Object.entries(store.actions).map(([name, action]) => [
        name,
        (...args) => {
          const result = action(...args);
          if (CENTRAL_ACTIONS.has(name) && result?.ok !== false) {
            fetch("/api/data/command", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-RelayFlow-Role": store.getSession()?.role || "",
              },
              body: JSON.stringify({ action: name, args }),
            })
              .then(async (response) => {
                if (!response.ok) {
                  await synchronizeBusinessState();
                  return null;
                }
                return response.json();
              })
              .then((payload) => { if (payload?.state) store.replaceStateFromServer(payload.state); })
              .catch(() => { synchronizeBusinessState(); });
          }
          return result;
        },
      ]));
      return ({
      ...centralizedActions,
      submitApplication: async (payload) => {
        const localPayload = {
          ...payload,
          documents: (payload.documents || []).map(({ dataBase64, ...metadata }) => metadata),
        };
        const result = store.submitApplication(localPayload);
        if (!result.ok) return result;
        const currentState = store.getState();
        const assignedManagerAccountIds = result.application.managerIds
          .map((managerId) => currentState.gestionnaires.find((item) => item._id === managerId)?.compteId)
          .filter(Boolean);
        const response = await fetch("/api/registration-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: result.application._id,
            accountId: result.application.compteId,
            routeRole: payload.role === "vendeur" ? "merchant" : "courier",
            email: payload.email,
            password: payload.password,
            assignedManagerAccountIds,
            managerIds: result.application.managerIds,
            profile: payload,
          }),
        }).catch(() => null);
        if (!response?.ok) {
          const error = await response?.json().catch(() => ({}));
          store.rollbackApplication(result.application._id);
          return {
            ok: false,
            error: error?.error || "Le serveur d'inscription est indisponible.",
          };
        }
        return result;
      },
      createUserByManager: async (managerCompteId, payload) => {
        const localPayload = {
          ...payload,
          documents: (payload.documents || []).map(({ dataBase64, ...metadata }) => metadata),
          createdByManagerCompteId: managerCompteId,
        };
        const result = store.submitApplication(localPayload);
        if (!result.ok) return result;
        const currentState = store.getState();
        const assignedManagerAccountIds = result.application.managerIds
          .map((managerId) => currentState.gestionnaires.find((item) => item._id === managerId)?.compteId)
          .filter(Boolean);
        const registrationResponse = await fetch("/api/registration-applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: result.application._id,
            accountId: result.application.compteId,
            routeRole: payload.role === "vendeur" ? "merchant" : "courier",
            email: payload.email,
            password: payload.password,
            assignedManagerAccountIds,
            managerIds: result.application.managerIds,
            profile: payload,
          }),
        }).catch(() => null);
        if (!registrationResponse?.ok) {
          const error = await registrationResponse?.json().catch(() => ({}));
          store.rollbackApplication(result.application._id);
          return {
            ok: false,
            error: error?.error || "Le compte n’a pas pu être enregistré sur le serveur.",
          };
        }
        const decisionResponse = await fetch("/api/registration-applications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: result.application._id,
            decision: "acceptee",
          }),
        }).catch(() => null);
        if (!decisionResponse?.ok) {
          const error = await decisionResponse?.json().catch(() => ({}));
          return {
            ok: false,
            error: error?.error || "Le compte a été enregistré mais son activation a échoué.",
          };
        }
        const synchronized = await synchronizeBusinessState();
        return synchronized.ok ? { ok: true } : synchronized;
      },
      decideApplication: async (managerCompteId, applicationId, decision, commentaire = "") => {
        const sendDecision = () => fetch("/api/registration-applications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId, decision, commentaire }),
        }).catch(() => null);
        const response = await sendDecision();
        if (!response?.ok) {
          const error = await response?.json().catch(() => ({}));
          return { ok: false, error: error?.error || "Décision impossible côté serveur." };
        }
        const synchronized = await synchronizeBusinessState();
        return synchronized.ok ? { ok: true } : synchronized;
      },
      establishSession: (accountId, routeRole) => {
        const result = store.establishSession(accountId, routeRole);
        if (result.ok) setSession(result.session);
        return result;
      },
      refreshDataFromServer: async () => {
        return synchronizeBusinessState();
      },
      logout: () => {
        const role = store.getSession()?.role;
        fetch(`/api/auth/logout${role ? `?role=${role}` : ""}`, { method: "POST" }).catch(() => {});
        store.logout();
        setSession(null);
      },
    });},
    []
  );

  const viewModel = useMemo(
    () => buildViewModel(state, session),
    [state, session]
  );

  const displayName = session
    ? displayNameForCompte(session.compteId)
    : "Invité";

  const value = useMemo(
    () => ({
      ready,
      state,
      session,
      viewModel,
      displayName,
      api,
      refreshSession,
    }),
    [ready, state, session, viewModel, displayName, api, refreshSession]
  );

  return (
    <RelayFlowContext.Provider value={value}>{children}</RelayFlowContext.Provider>
  );
}

export function useRelayFlow() {
  const ctx = useContext(RelayFlowContext);
  if (!ctx) throw new Error("useRelayFlow doit être utilisé dans RelayFlowProvider");
  return ctx;
}

/** Hook optionnel pour composants hors provider (SSR) */
export function useRelayFlowOptional() {
  return useContext(RelayFlowContext);
}
