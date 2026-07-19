"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { content } from "../lib/data";

function ThemeToggle() {
  useEffect(() => {
    const stored = window.localStorage.getItem("spf-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.dataset.theme = stored;
    }
  }, []);

  const toggle = () => {
    const theme = document.documentElement.dataset.theme;
    const darkNow =
      theme === "dark" ||
      (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const next = darkNow ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("spf-theme", next);
  };

  return (
    <button className="icon-button" type="button" onClick={toggle} aria-label="Toggle light and dark theme">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18">
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M18.36 5.64l-1.42 1.42M7.06 16.94l-1.42 1.42" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    </button>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const activeFramework = pathname.startsWith("/frameworks/") ? pathname.split("/")[2] : "";

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" href="/" aria-label="Spec planning frameworks home">
          <span className="wordmark-mark" aria-hidden="true">P</span>
          <span>Spec frameworks</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          <Link href="/frameworks">Frameworks</Link>
          <Link href="/compare">Compare</Link>
          <Link href="/cases/reliable-webhook-delivery">Case</Link>
        </nav>
        <div className="header-actions">
          <label className="picker-label" htmlFor="framework-picker">Framework</label>
          <select
            id="framework-picker"
            className="framework-picker"
            value={activeFramework}
            onChange={(event) => event.target.value && router.push(`/frameworks/${event.target.value}`)}
          >
            <option value="">Choose…</option>
            {content.frameworks.map((framework) => (
              <option key={framework.slug} value={framework.slug}>{framework.name}</option>
            ))}
          </select>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
