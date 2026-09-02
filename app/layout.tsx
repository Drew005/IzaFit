import "./globals.css";

export const metadata = {
  title: "IzaFit — Moda Fitness",
  description:
    "Loja oficial IzaFit. Roupas, acessórios e suplementos para sua performance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
