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

export function RelayFlowProvider({ children }) {
  const [state, setState] = useState(null);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    store.loadState();
    setState(store.getState());
    setSession(store.getSession());
    setReady(true);
    const unsubscribe = store.subscribe((s) => setState({ ...s }));
    const synchronizeFromStorage = (event) => {
      if (event.key && !event.key.startsWith("relayflow_")) return;
      store.loadState();
      setState({ ...store.getState() });
      setSession(store.getSession());
    };
    window.addEventListener("storage", synchronizeFromStorage);
    return () => {
      unsubscribe();
      window.removeEventListener("storage", synchronizeFromStorage);
    };
  }, []);

  const refreshSession = useCallback(() => {
    setSession(store.getSession());
  }, []);

  const api = useMemo(
    () => ({
      ...store.actions,
      submitApplication: async (payload) => {
        const result = store.submitApplication(payload);
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
        const result = store.submitApplication({
          ...payload,
          createdByManagerCompteId: managerCompteId,
        });
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
        return store.decideApplication(
          managerCompteId,
          result.application._id,
          "acceptee",
          "Compte créé et validé directement par le manager."
        );
      },
      decideApplication: async (managerCompteId, applicationId, decision, commentaire = "") => {
        const sendDecision = () => fetch("/api/registration-applications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId, decision }),
        }).catch(() => null);
        let response = await sendDecision();
        if (response?.status === 409) {
          const currentState = store.getState();
          const application = currentState.applications.find((item) => item._id === applicationId);
          const account = currentState.comptes.find((item) => item._id === application?.compteId);
          if (application && account?.motDePasseHash) {
            const assignedManagerAccountIds = application.managerIds
              .map((managerId) => currentState.gestionnaires.find((item) => item._id === managerId)?.compteId)
              .filter(Boolean);
            const registrationResponse = await fetch("/api/registration-applications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                applicationId,
                accountId: application.compteId,
                routeRole: application.role === "vendeur" ? "merchant" : "courier",
                email: application.email,
                password: account.motDePasseHash,
                assignedManagerAccountIds,
              }),
            }).catch(() => null);
            if (registrationResponse?.ok) response = await sendDecision();
          }
        }
        if (!response?.ok) {
          const error = await response?.json().catch(() => ({}));
          return { ok: false, error: error?.error || "Décision impossible côté serveur." };
        }
        return store.decideApplication(managerCompteId, applicationId, decision, commentaire);
      },
      login: (email, password, routeRole) => {
        const r = store.login(email, password, routeRole);
        if (r.ok) setSession(r.session);
        return r;
      },
      establishSession: (accountId, routeRole) => {
        const result = store.establishSession(accountId, routeRole);
        if (result.ok) setSession(result.session);
        return result;
      },
      loginDemo: (routeRole) => {
        const r = store.loginDemo(routeRole);
        if (r.ok) setSession(r.session);
        return r;
      },
      logout: () => {
        const role = store.getSession()?.role;
        fetch(`/api/auth/logout${role ? `?role=${role}` : ""}`, { method: "POST" }).catch(() => {});
        store.logout();
        setSession(null);
      },
    }),
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
