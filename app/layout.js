import "./globals.css";
import { RelayFlowProvider } from "../context/RelayFlowProvider";

export const metadata = {
  title: "RelayFlow — Livraison vendeur",
  description: "Plateforme de livraison pour vendeurs, livreurs et managers",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <RelayFlowProvider>{children}</RelayFlowProvider>
      </body>
    </html>
  );
}
