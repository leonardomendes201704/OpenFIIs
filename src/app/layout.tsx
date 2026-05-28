import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenFIIs | Simulador de Carteira FIIs",
  description: "Monte sua carteira, acompanhe rendimentos e projete renda futura."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
