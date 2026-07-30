import Link from "next/link";

const profiles = [
  {
    title: "Commerçant",
    href: "/signup/merchant",
    desc: "Commerce physique, boutique en ligne ou activité itinérante. Vous préciserez votre type à l’étape suivante.",
    icon: "🏪",
    accentBg: "bg-emerald-500/10",
    accentBorder: "border-emerald-500/25",
    accentText: "text-emerald-300",
    docs: ["Extrait KBIS", "Justificatifs liés à l’activité", "RIB professionnel"],
  },
  {
    title: "Livreur",
    href: "/signup/courier",
    desc: "Vous souhaitez rejoindre le réseau de livraison RelayFlow comme livreur indépendant.",
    icon: "🚴",
    accentBg: "bg-purple-500/10",
    accentBorder: "border-purple-500/25",
    accentText: "text-purple-300",
    docs: ["Pièce d'identité", "Justificatif d'activité", "Documents du véhicule"],
  },
];

export default function SignupChoice() {
  return (
    <main className="auth-page">
      <div className="ambient-background">
        <span className="ambient-orb ambient-orb-one" />
        <span className="ambient-orb ambient-orb-two" />
        <span className="ambient-grid" />
      </div>

      <section className="login-choice-card" style={{ maxWidth: "680px" }}>
        <div className="text-center mb-8">
          <Link href="/" className="brand inline-block mb-4 p-0">
            Relay<span>Flow</span>
          </Link>
          <p className="eyebrow mb-2">DEMANDE D'ADHÉSION</p>
          <h1 className="text-2xl font-black text-white tracking-tight m-0">
            Quel est votre profil ?
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Votre dossier sera examiné par un manager RelayFlow. Munissez-vous de vos justificatifs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <Link
              href={profile.href}
              key={profile.href}
              className={`login-role-card ${profile.accentBg} ${profile.accentBorder} group flex flex-col`}
            >
              <div className="mb-4">
                <span className="text-3xl block mb-3">{profile.icon}</span>
                <h2 className={`text-lg font-black text-white m-0 mb-1.5 group-hover:${profile.accentText} transition-colors`}>
                  {profile.title}
                </h2>
                <p className="text-xs text-slate-400 m-0 leading-relaxed">{profile.desc}</p>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5">
                <p className="text-[0.62rem] font-bold uppercase tracking-wider text-slate-500 mb-2">Documents requis</p>
                <ul className="space-y-1">
                  {profile.docs.map((doc) => (
                    <li key={doc} className={`flex items-center gap-1.5 text-xs ${profile.accentText} opacity-70`}>
                      <span>✓</span> {doc}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`text-[0.62rem] font-bold uppercase tracking-wider ${profile.accentText} opacity-60 group-hover:opacity-100 transition-opacity`}>
                  Commencer le dossier
                </span>
              </div>
            </Link>
          ))}
        </div>



        <p className="text-center text-sm text-slate-500 mt-4">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="font-bold text-indigo-300 hover:text-indigo-200 transition-colors">
            Se connecter
          </Link>
        </p>
      </section>
    </main>
  );
}
