"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRelayFlow } from "../context/RelayFlowProvider";

const ROUTE_TO_STORE = {
  merchant: "vendeur",
  courier: "livreur",
  manager: "manager",
  super_manager: "super_manager",
};

export default function AuthGuard({ role, children }) {
  const { ready, session } = useRelayFlow();
  const router = useRouter();
  const [serverVerified, setServerVerified] = useState(false);
  const expected = ROUTE_TO_STORE[role];
  const loginHref = role === "super_manager" ? "/super-manager/login" : `/${role}/login`;

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      setServerVerified(false);
      router.replace(loginHref);
    } else if (session.role !== expected) {
      setServerVerified(false);
      router.replace(`/${session.routeRole}`);
    } else {
      let active = true;
      setServerVerified(false);
      fetch(`/api/auth/session?role=${expected}`, { cache: "no-store" })
        .then(async (response) => {
          const result = await response.json().catch(() => ({}));
          if (!active) return;
          if (!response.ok || result.role !== expected || result.accountId !== session.compteId) {
            router.replace(loginHref);
            return;
          }
          setServerVerified(true);
        })
        .catch(() => {
          if (active) router.replace(loginHref);
        });
      return () => {
        active = false;
      };
    }
  }, [ready, session, role, expected, loginHref, router]);

  if (!ready || (session && (!serverVerified || session.role !== expected))) {
    return (
      <div className="auth-loading-screen" aria-label="Chargement">
        <div className="auth-loading-screen__brand">Relay<span>Flow</span></div>
        <div className="auth-loading-screen__bar"><i /></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="empty">
        <h1>Session requise</h1>
        <p>Connectez-vous pour accéder à cet espace.</p>
        <Link className="button" href={loginHref}>
          Se connecter
        </Link>
      </div>
    );
  }

  return children;
}
