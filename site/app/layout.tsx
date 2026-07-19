import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "../components/site-header";

export const metadata: Metadata = {
  title: {
    default: "AI coding planning frameworks — same-case examples",
    template: "%s · Spec planning frameworks",
  },
  description:
    "Inspect the same reliable webhook project across Superpowers, GSD, GitHub Spec Kit, Kiro Specs, Matt Pocock's skills, and BMad Method.",
  keywords: [
    "AI coding planning frameworks",
    "specification frameworks",
    "spec-driven development",
    "planning examples",
  ],
  openGraph: {
    type: "website",
    siteName: "Spec planning frameworks",
    title: "AI coding planning frameworks — same-case examples",
    description:
      "Raw artifacts and reproducible evidence from six specification and planning frameworks applied to one brief.",
  },
  twitter: { card: "summary" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-preference"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem("spf-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch{}`,
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <p>Source-backed examples. No framework paid for placement.</p>
          <a href="https://github.com/plannotator/spec-planning-frameworks">
            View the repository
          </a>
        </footer>
      </body>
    </html>
  );
}
