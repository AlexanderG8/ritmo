import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ritmo",
  description: "Rendición de cuentas semanal.",
};

/**
 * Aplica el tema guardado antes del primer pintado. Sin esto hay un
 * parpadeo blanco al cargar en oscuro. Si no hay preferencia guardada no
 * se toca nada y manda el sistema (los tokens usan light-dark()).
 */
const themeScript = `try{var t=localStorage.getItem("ritmo-theme");if(t==="light"||t==="dark")document.documentElement.classList.add(t)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
