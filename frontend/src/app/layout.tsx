import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "./utils/ThemeContext";
import { LoadingProvider } from "./utils/LoadingContext";
import LoadingSpinner from "./components/LoadingSpinner";

export const metadata: Metadata = {
  title: "Dulce Vida",
  description: "Sistema de gestión de inventario",
  icons: {
    icon: [
      { url: "/icon.ico" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/icon.ico",
    apple: "/icon.ico",
  },
  // Deshabilitar el modo oscuro del sistema operativo
  colorScheme: 'light',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="light">
      <head>
        <link rel="icon" href="/icon.ico" />
        <link rel="shortcut icon" href="/icon.ico" />
        <meta name="color-scheme" content="light" />
      </head>
      <body className="min-h-screen bg-white">
        <ThemeProvider>
          <LoadingProvider>
            <LoadingSpinner />
            {children}
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
