import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getFormatSettings } from "@/lib/format";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CardPulse — Feel your spending rhythm",
  description:
    "Local-first credit card expense tracker with natural language input",
};

/** Read theme + mode from DB settings (server-side). Falls back to sage/dark. */
function getThemeSettings(): { theme: string; mode: string } {
  try {
    // Dynamic require to access DB on server only
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { db } = require("@/lib/db");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { settings } = require("@/lib/db/schema");
    const rows = db.select().from(settings).all() as Array<{
      key: string;
      value: string;
    }>;
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      theme: map.theme || "sage",
      mode: map.color_mode || "dark",
    };
  } catch {
    return { theme: "sage", mode: "dark" };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read format settings from DB (server-side) and inject for client hydration.
  const fmt = getFormatSettings();
  const fmtScript = `window.__CP_FMT__=${JSON.stringify(fmt)}`;

  // Read theme settings from DB for SSR. The flash-prevention script below
  // overrides with localStorage values (instant) before first paint.
  const themeCfg = getThemeSettings();

  // Inline script that runs before React hydrates — reads localStorage to
  // prevent flash of wrong theme. Falls back to server-rendered values.
  const themeScript = `(function(){try{var t=localStorage.getItem('cp-theme');var m=localStorage.getItem('cp-mode');var d=document.documentElement;if(t)d.setAttribute('data-theme',t);if(m)d.setAttribute('data-mode',m);}catch(e){}})()`;

  return (
    <html
      lang="en"
      data-theme={themeCfg.theme}
      data-mode={themeCfg.mode}
    >
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-base text-text-primary antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: fmtScript }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
