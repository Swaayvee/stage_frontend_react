import "./globals.css";

export const metadata = {
  title: "RelayFlow — Plateforme logistique",
  description: "Pilotage des livraisons, adhésions et incidents",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
