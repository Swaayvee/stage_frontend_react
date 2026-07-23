"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

const roleConfig = {
  merchant: {
    label: "Commerçant",
    eyebrow: "ESPACE COMMERÇANT",
    icon: "🏪",
    color: "emerald",
    gradient: "from-emerald-600/20 to-teal-900/10",
    accent: "border-emerald-500/30",
    accentText: "text-emerald-300",
    accentBg: "bg-emerald-500/15",
    accentShadow: "shadow-emerald-900/20",
    redirect: "/merchant",
    desc: "Gérez vos expéditions, commandes et livraisons.",
    canRegister: true,
    registerHref: "/signup/merchant",
    demoUser: "commerce@maisonolive.fr",
    demoPass: "••••••••••",
  },
  courier: {
    label: "Livreur",
    eyebrow: "ESPACE LIVREUR",
    icon: "🚴",
    color: "purple",
    gradient: "from-purple-600/20 to-indigo-900/10",
    accent: "border-purple-500/30",
    accentText: "text-purple-300",
    accentBg: "bg-purple-500/15",
    accentShadow: "shadow-purple-900/20",
    redirect: "/courier",
    desc: "Consultez les livraisons disponibles et gérez vos courses.",
    canRegister: true,
    registerHref: "/signup/courier",
    demoUser: "nora.petit@email.fr",
    demoPass: "••••••••••",
  },
  "mgr-9a8f2k4x": {
    roleId: "manager",
    label: "Manager",
    eyebrow: "ESPACE MANAGER",
    icon: "🛡️",
    color: "blue",
    gradient: "from-blue-600/20 to-slate-900/10",
    accent: "border-blue-500/30",
    accentText: "text-blue-300",
    accentBg: "bg-blue-500/15",
    accentShadow: "shadow-blue-900/20",
    redirect: "/mgr-9a8f2k4x",
    desc: "Espace de connexion réservé aux personnes habilitées.",
    canRegister: false,
    demoUser: "sarah.bernard@relayflow.fr",
    demoPass: "••••••••••",
  },
  "sm-3v8n1w9z": {
    roleId: "super-manager",
    label: "Super-Manager",
    eyebrow: "ESPACE INTERNE",
    icon: "⚙️",
    color: "indigo",
    gradient: "from-indigo-600/20 to-slate-900/10",
    accent: "border-indigo-500/30",
    accentText: "text-indigo-300",
    accentBg: "bg-indigo-500/15",
    accentShadow: "shadow-indigo-900/20",
    redirect: "/sm-3v8n1w9z",
    desc: "Connexion sécurisée à l'espace interne RelayFlow.",
    canRegister: false,
    demoUser: "admin@relayflow.fr",
    demoPass: "••••••••••",
  },
};

export default function LoginPage({ params }) {
  const role = use(params).role;
  const config = roleConfig[role];
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!config) {
    return (
      <main className="auth-page">
        <div className="ambient-background" />
        <section className="auth-card">
          <Link href="/" className="brand">Relay<span>Flow</span></Link>
          <p className="text-slate-400">Espace inconnu. <Link href="/login" className="text-indigo-300">Retour</Link></p>
        </section>
      </main>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
      return;
    }
    setLoading(true);

    // Simulation de connexion (remplacer par une vraie API)
    setTimeout(() => {
      // Stocker le rôle et l'utilisateur en session
      if (typeof window !== "undefined") {
        const actualRole = config.roleId || role;
        localStorage.setItem("auth_role", actualRole);
        localStorage.setItem("auth_user", JSON.stringify({ email, role: actualRole, name: getNameFromEmail(email, config.label) }));
      }
      router.push(config.redirect);
    }, 900);
  };

  const handleDemo = () => {
    setLoading(true);
    if (typeof window !== "undefined") {
      const actualRole = config.roleId || role;
      localStorage.setItem("auth_role", actualRole);
      localStorage.setItem("auth_user", JSON.stringify({ email: config.demoUser, role: actualRole, name: `Demo ${config.label}` }));
    }
    setTimeout(() => router.push(config.redirect), 600);
  };

  return (
    <main className="auth-page flex items-center justify-center min-h-screen relative overflow-hidden bg-[#020617] font-sans selection:bg-indigo-500/30">
      {/* Enhanced Ambient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-32 w-[32rem] h-[32rem] rounded-full blur-[140px] mix-blend-screen opacity-50 animate-pulse-slow ${config.accentBg.replace('/15', '/30')}`} />
        <div className={`absolute -bottom-32 -right-32 w-[40rem] h-[40rem] rounded-full blur-[140px] mix-blend-screen opacity-40 ${config.accentBg.replace('/15', '/20')}`} />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <section className="relative z-10 w-full max-w-xl px-6 mx-auto flex flex-col items-center">
        {/* Brand Header */}
        <Link href="/" className="mb-10 group flex items-center gap-2 hover:scale-105 transition-transform duration-300">
          <span className="text-3xl font-black text-white tracking-tighter drop-shadow-md">
            Relay<span className={config.accentText.replace('300', '400')}>Flow</span>
          </span>
        </Link>

        {/* The Glass Card */}
        <div className="w-full bg-[#0b1120]/70 backdrop-blur-3xl border border-white/[0.08] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] rounded-[2rem] p-8 sm:p-12 relative overflow-hidden">
          {/* Subtle Top Border Glow */}
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${config.gradient} opacity-80`} />

          {/* Actor Profile / Icon */}
          <div className="flex flex-col items-center justify-center mb-10">
            <div className={`w-20 h-20 rounded-2xl ${config.accentBg} border ${config.accent} flex items-center justify-center shadow-lg ${config.accentShadow} mb-6 relative group overflow-hidden`}>
               <div className={`absolute inset-0 ${config.accentBg.replace('/15', '/40')} blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
               <span className="text-4xl relative z-10 drop-shadow-md">{config.icon}</span>
            </div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">{config.eyebrow}</h2>
            <h1 className="text-3xl sm:text-4xl font-black text-white m-0 tracking-tight text-center">
              {config.label}
            </h1>
            <p className="text-slate-400 text-sm mt-3 text-center leading-relaxed">
              {config.desc}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest ml-1">Adresse e-mail</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="votre@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all text-base shadow-inner"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-slate-600 focus:outline-none focus:border-white/20 focus:bg-white/5 transition-all text-base shadow-inner"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-400 flex items-center gap-3">
                <span className="text-lg">⚠️</span> <span className="leading-tight">{error}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 ${config.accentBg} border ${config.accent} ${config.accentText} shadow-lg hover:brightness-125 relative overflow-hidden group focus:outline-none focus:ring-4 focus:ring-white/10`}
              >
                <div className="absolute inset-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Connexion…
                  </span>
                ) : (
                  `Se connecter`
                )}
              </button>
              
              <button
                type="button"
                onClick={handleDemo}
                disabled={loading}
                className={`w-full py-4 rounded-2xl border border-white/5 bg-white/[0.02] text-sm font-bold text-slate-300 hover:bg-white/[0.06] hover:text-white transition-all text-center focus:outline-none focus:ring-4 focus:ring-white/10`}
              >
                Accéder à la démo
              </button>
            </div>

            {config.canRegister && (
              <div className="pt-6 border-t border-white/10 mt-6 text-center">
                <p className="text-sm text-slate-400">
                  Pas encore de compte ?{" "}
                  <Link href={config.registerHref} className={`font-bold ${config.accentText} hover:brightness-125 transition-all ml-1`}>
                    Rejoindre RelayFlow
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Footer Link */}
        <div className="mt-10">
          <Link href="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border border-white/5 backdrop-blur-md">
            <span>←</span> Retour au choix d'espace
          </Link>
        </div>
      </section>
    </main>
  );
}

function getNameFromEmail(email, fallback) {
  const localPart = email.split("@")[0];
  return localPart
    .split(/[._-]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || fallback;
}
