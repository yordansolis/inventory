import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sistema de Inventario",
  description: "Sistema de gestión de inventario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen bg-white">
        {children}
      </body>
    </html>
  );
}
