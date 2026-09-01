"use client";

import Link from "next/link";
import { useState } from "react";
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
  const pathname = usePathname();
  const { t } = useI18n();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            BL
          </span>
          <span className="hidden sm:block leading-tight">
            <span className="block text-sm font-bold">Balochistan Lottery</span>
            <span className="block text-xs font-normal text-slate-500">Management System</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-600 hover:text-blue-600">
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <Link
            href="/status"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600"
          >
            {t("checkStatus")}
          </Link>
          <Link
            href="/submit"
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            {t("submitTicket")}
          </Link>
          <Link href="/admin/login" className="text-sm font-medium text-slate-400 hover:text-slate-700">
            {t("adminLogin")}
          </Link>
        </div>

        <button
          className="md:hidden rounded-lg p-2 text-slate-700"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="mb-3">
            <LanguageSwitcher />
          </div>
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-700" onClick={() => setOpen(false)}>
                {t(l.key)}
              </Link>
            ))}
            <Link
              href="/status"
              className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700"
              onClick={() => setOpen(false)}
            >
              {t("checkStatus")}
            </Link>
            <Link
              href="/submit"
              className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              {t("submitTicket")}
            </Link>
            <Link href="/admin/login" className="text-center text-sm font-medium text-slate-400" onClick={() => setOpen(false)}>
              {t("adminLogin")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
