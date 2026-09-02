"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

const links = [
  { href: "/", key: "home" as const },
  { href: "/about", key: "about" as const },
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

  return (
    <header className="sticky top-0 z-40 border-b border-amber-500/20 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-600 text-sm font-bold text-slate-900 shadow-[0_0_16px_rgba(217,161,58,0.35)]">
            BL
          </span>
          <span className="hidden sm:block leading-tight">
            <span className="block text-sm font-bold tracking-wide">Balochistan Lottery</span>
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
            href="/status"
            className="rounded-full border border-amber-400/30 px-4 py-2 text-sm font-medium text-amber-100 hover:border-amber-400/60 hover:text-amber-300"
          >
            {t("checkStatus")}
          </Link>
          <Link
            href="/submit"
            className="rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:from-amber-400 hover:to-amber-600"
          >
            {t("submitTicket")}
          </Link>
          <Link
            href={customerName ? "/account" : "/account/login"}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-amber-400/60 hover:text-amber-300"
          >
            {customerName ? `👤 ${customerName.split(" ")[0]}` : "Login / Sign Up"}
          </Link>
          <Link href="/admin/login" className="text-sm font-medium text-slate-500 hover:text-slate-300">
            {t("adminLogin")}
          </Link>
        </div>

        <button
          className="md:hidden rounded-lg p-2 text-slate-300"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
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
              href="/status"
              className="rounded-xl border border-amber-400/30 px-4 py-3 text-center text-sm font-medium text-amber-100"
              onClick={() => setOpen(false)}
            >
              {t("checkStatus")}
            </Link>
            <Link
              href="/submit"
              className="rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-3 text-center text-sm font-semibold text-slate-900"
              onClick={() => setOpen(false)}
            >
              {t("submitTicket")}
            </Link>
            <Link
              href={customerName ? "/account" : "/account/login"}
              className="rounded-xl border border-slate-700 px-4 py-3 text-center text-sm font-medium text-slate-200"
              onClick={() => setOpen(false)}
            >
              {customerName ? `👤 ${customerName.split(" ")[0]}` : "Login / Sign Up"}
            </Link>
            <Link href="/admin/login" className="text-center text-sm font-medium text-slate-500" onClick={() => setOpen(false)}>
              {t("adminLogin")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
