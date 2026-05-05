"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, Home, Plus, Settings, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { versionHistory } from "@/lib/version-history";

const navItems = [
  { href: "/", label: "Library", icon: Home },
  { href: "/create", label: "Create", icon: Plus },
  { href: "/paste", label: "Paste", icon: ChefHat },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/settings", label: "Tags", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [logoClicks, setLogoClicks] = useState(0);
  const [showDachshund, setShowDachshund] = useState(false);

  const bottomLabel = useMemo(() => {
    if (pathname.startsWith("/recipes") && pathname.endsWith("/cook")) return "Cooking";
    if (pathname.startsWith("/recipes")) return "Recipe";
    return "Recipe Studio";
  }, [pathname]);

  function handleLogoClick() {
    const nextClicks = logoClicks + 1;
    setLogoClicks(nextClicks);

    if (nextClicks >= 5) {
      setShowDachshund(true);
      setLogoClicks(0);
      window.setTimeout(() => setShowDachshund(false), 4500);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-tan/40 bg-cream/88 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-11 items-center gap-3 text-cocoa">
            <button
              type="button"
              onClick={handleLogoClick}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-sage text-bark shadow-soft"
              aria-label="Recipe Studio logo"
            >
              <ChefHat size={22} aria-hidden />
            </button>
            <Link href="/" className="hidden sm:block" aria-label="Cozy Recipe Studio home">
              <p className="text-xs font-semibold uppercase text-forest">Cozy</p>
              <p className="text-lg font-semibold leading-none">Recipe Studio</p>
            </Link>
          </div>

          <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`tap-button ${active ? "bg-bark text-cream" : "text-cocoa hover:bg-sage/35"}`}
                >
                  <Icon size={18} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </nav>

        </div>
      </header>

      <main className="page-shell">{children}</main>

      <footer className="mx-auto w-full max-w-7xl px-4 pb-28 sm:px-6 lg:px-8 lg:pb-8">
        <section className="surface p-4 sm:p-5" aria-label="Version history">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-forest">Version history</p>
              <p className="mt-1 text-sm font-semibold text-cocoa/75">Latest app changes and deploy notes.</p>
            </div>
            <div className="grid gap-3 lg:w-[680px]">
              {versionHistory.map((item) => (
                <div key={item.version} className="grid gap-1 rounded-lg bg-cream p-3 sm:grid-cols-[110px_130px_1fr] sm:gap-3">
                  <span className="text-sm font-bold text-bark">v{item.version}</span>
                  <span className="text-sm font-semibold text-forest">{item.date}</span>
                  <span className="text-sm font-semibold text-cocoa/75">{item.note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-tan/50 bg-ivory/95 px-2 pb-2 pt-2 shadow-[0_-12px_30px_rgba(91,61,46,0.12)] backdrop-blur lg:hidden"
        aria-label={`${bottomLabel} navigation`}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-14 flex-col items-center justify-center rounded-lg px-1 text-[11px] font-semibold ${
                  active ? "bg-bark text-cream" : "text-cocoa"
                }`}
              >
                <Icon size={19} aria-hidden />
                <span className="mt-1 max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {showDachshund && (
        <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full border border-tan/60 bg-ivory px-4 py-3 text-sm font-semibold text-cocoa shadow-soft">
          <DachshundMark />
          <span>A tiny dachshund found the recipe box.</span>
        </div>
      )}
    </div>
  );
}

function DachshundMark() {
  return (
    <svg width="54" height="24" viewBox="0 0 54 24" fill="none" aria-hidden>
      <path
        d="M13 12.5C14.5 8.9 19.1 7.2 25.6 7.6L34.6 8.1C39.3 8.4 42.1 10 43.2 12.9L45.8 12.1C47.9 11.5 50 13.1 50 15.3C50 17 48.6 18.4 46.9 18.4H18.1C14.6 18.4 11.8 15.7 11.8 12.2L13 12.5Z"
        fill="#5b3d2e"
      />
      <path d="M42.6 9.9L46.7 6.1C47.5 5.4 48.7 6 48.6 7.1L48.1 12.6" fill="#5b3d2e" />
      <circle cx="45.8" cy="11.7" r="0.9" fill="#fff8ea" />
      <path d="M18 18.1V22M27 18.1V22M37 18.1V22" stroke="#5b3d2e" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12.6 12.9C9.5 12.7 7.1 11.3 5.4 8.8" stroke="#5b3d2e" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
