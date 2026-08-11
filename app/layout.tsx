import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "./lib/AuthProvider";
import { DecisionsProvider } from "./lib/DecisionsProvider";
import ThemeToggle from "./components/ThemeToggle";
import AccountBadge from "./components/AccountBadge";
import AuthGate from "./components/AuthGate";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Tunnels — Survey Log",
  description: "Track the advance of active bores by hand.",
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning>
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            {/* Rough, rounded rock-face silhouette for the shaft/fill ends —
                each jag is a smoothed bump (quadratic curves through
                midpoints) rather than a sharp polygon vertex. */}
            <clipPath id="rock-edge" clipPathUnits="objectBoundingBox">
              <path
                d="M 0.0200 0.0200 Q 0.0400 0.0200, 0.1100 0.0100 Q 0.1800 0.0000, 0.2500 0.0150 Q 0.3200 0.0300, 0.3900 0.0200 Q 0.4600 0.0100, 0.5300 0.0150 Q 0.6000 0.0200, 0.6700 0.0100 Q 0.7400 0.0000, 0.8100 0.0150 Q 0.8800 0.0300, 0.9200 0.0200 Q 0.9600 0.0100, 0.9800 0.0650 Q 1.0000 0.1200, 0.9800 0.1950 Q 0.9600 0.2700, 0.9800 0.3450 Q 1.0000 0.4200, 0.9850 0.5000 Q 0.9700 0.5800, 0.9850 0.6600 Q 1.0000 0.7400, 0.9800 0.8100 Q 0.9600 0.8800, 0.9800 0.9300 Q 1.0000 0.9800, 0.9400 0.9800 Q 0.8800 0.9800, 0.8100 0.9900 Q 0.7400 1.0000, 0.6700 0.9850 Q 0.6000 0.9700, 0.5300 0.9800 Q 0.4600 0.9900, 0.3900 0.9850 Q 0.3200 0.9800, 0.2500 0.9900 Q 0.1800 1.0000, 0.1100 0.9950 Q 0.0400 0.9900, 0.0200 0.9350 Q 0.0000 0.8800, 0.0200 0.8100 Q 0.0400 0.7400, 0.0200 0.6600 Q 0.0000 0.5800, 0.0150 0.5000 Q 0.0300 0.4200, 0.0150 0.3450 Q 0.0000 0.2700, 0.0200 0.1950 Q 0.0400 0.1200, 0.0200 0.0700 Q 0.0000 0.0200, 0.0200 0.0200 Z"
              />
            </clipPath>
          </defs>
        </svg>
        <AuthProvider>
          <div className="corner-controls">
            <AccountBadge />
            <ThemeToggle />
          </div>
          <DecisionsProvider>
            <AuthGate>{children}</AuthGate>
          </DecisionsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
