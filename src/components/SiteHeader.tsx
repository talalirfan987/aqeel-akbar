"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import Logo from "./Logo";
import { useI18n } from "@/lib/i18n";

const links = [
  { href: "/", key: "home" as const },
  { href: "/about", key: "about" as const },
  { href: "/winners", key: "winners" as const },
  { href: "/contact", key: "contact" as const },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const pathname = usePathname();
  const { t } = useI18n();

  useEffect(() => {
    fetch("/api/auth/customer/me")
      .then((r) => r.json())
      .then((d) => setCustomerName(d.customer?.name || null))
      .catch(() => setCustomerName(null));
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;
  if (pathname?.startsWith("/account/login") || pathname?.startsWith("/account/signup")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-amber-500/20 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 font-semibold text-white">
          <Logo className="h-9 w-9 shrink-0 drop-shadow-[0_0_10px_rgba(217,161,58,0.35)]" />
          <span className="hidden leading-tight md:block">
            <span className="block text-sm font-bold tracking-wide">Lucky Lottery</span>
            <span className="block text-xs font-normal text-amber-200/60">Management System</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-300 hover:text-amber-400">
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link
            href={customerName ? "/account" : "/account/login"}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-amber-400/60 hover:text-amber-300"
          >
            {customerName ? customerName.split(" ")[0] : "Login / Sign Up"}
          </Link>
        </div>

        {/* Always-visible compact CTAs on mobile, so key actions don't hide behind the menu */}
        <div className="flex min-w-0 shrink items-center justify-end gap-1.5 md:hidden">
          <button
            className="shrink-0 rounded-lg p-1.5 text-slate-300"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-amber-500/20 bg-slate-950 px-4 py-4 md:hidden">
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-300" onClick={() => setOpen(false)}>
                {t(l.key)}
              </Link>
            ))}
            <Link
              href={customerName ? "/account" : "/account/login"}
              className="rounded-xl border border-slate-700 px-4 py-3 text-center text-sm font-medium text-slate-200"
              onClick={() => setOpen(false)}
            >
              {customerName ? customerName.split(" ")[0] : "Login / Sign Up"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
