import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfilyShop",
  description: "Plataforma para crear tiendas públicas con enlaces afiliados, productos y analítica",
  icons: {
    icon: "/afilyshop-icon.png",
    apple: "/afilyshop-icon.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
