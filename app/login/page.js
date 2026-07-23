import Link from "next/link";

const roles = [
  {
    id: "merchant",
    title: "Espace Commerçant",
    desc: "Gérez vos expéditions et suivez vos livraisons.",
    icon: "🏪",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/25",
    accentText: "text-emerald-300",
    badge: "Commerçant & Partenaire",
  },
  {
    id: "courier",
    title: "Espace Livreur",
    desc: "Acceptez des courses et réalisez vos livraisons.",
    icon: "🚴",
    accentBg: "bg-purple-500/10",
    accentBorder: "border-purple-500/25",
    accentText: "text-purple-300",
    badge: "Livreur Indépendant",
  },
];

export default function LoginChoice() {
  return (
    <main className="auth-page flex items-center justify-center min-h-screen relative overflow-hidden bg-[#020617] font-sans selection:bg-indigo-500/30">
      {/* Enhanced Ambient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-[32rem] h-[32rem] rounded-full blur-[140px] mix-blend-screen opacity-30 animate-pulse-slow bg-emerald-500/30" />
        <div className="absolute -bottom-32 -right-32 w-[40rem] h-[40rem] rounded-full blur-[140px] mix-blend-screen opacity-20 bg-purple-500/30" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <section className="relative z-10 w-full max-w-4xl px-6 mx-auto flex flex-col items-center">
        {/* Brand Header */}
        <Link href="/" className="mb-12 group flex items-center gap-2 hover:scale-105 transition-transform duration-300">
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tighter drop-shadow-md">
            Relay<span className="text-indigo-400">Flow</span>
          </span>
        </Link>

        {/* The Glass Container */}
        <div className="w-full bg-[#0b1120]/70 backdrop-blur-3xl border border-white/[0.08] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] rounded-[2rem] p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 opacity-80" />

          <div className="text-center mb-10">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Connexion</h2>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight m-0">
              Accédez à votre espace
            </h1>
            <p className="text-slate-400 text-sm mt-3 max-w-md mx-auto leading-relaxed">
              Sélectionnez votre profil professionnel pour accéder à vos outils et services dédiés.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {roles.map((role) => (
              <Link
                href={`/${role.id}/login`}
                key={role.id}
                className={`relative flex flex-col items-start text-left bg-black/40 border border-white/5 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group overflow-hidden`}
              >
                <div className={`absolute inset-0 ${role.accentBg.replace('/10', '/20')} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl`} />
                
                <span className="text-4xl mb-5 relative z-10 drop-shadow-sm">{role.icon}</span>
                <h2 className="text-lg font-black text-white m-0 mb-2 relative z-10">
                  {role.title}
                </h2>
                <p className="text-sm text-slate-400 m-0 leading-relaxed mb-6 flex-grow relative z-10">{role.desc}</p>
                
                <div className={`inline-flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 ${role.accentText} relative z-10 transition-colors group-hover:bg-white/10`}>
                  {role.badge}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-slate-400">
              Pas encore de compte ?{" "}
              <Link href="/signup" className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-4 transition-all ml-1">
                Déposer une demande d'adhésion
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
