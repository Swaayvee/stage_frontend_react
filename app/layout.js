import "./globals.css";

export const metadata = {
  title: "RelayFlow — Plateforme logistique",
  description: "Pilotage des livraisons, adhésions et incidents",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
