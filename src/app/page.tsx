"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const steps = [
  { key: "step1" as const, icon: "📝" },
  { key: "step2" as const, icon: "🎟️" },
  { key: "step3" as const, icon: "🔑" },
  { key: "step4" as const, icon: "📊" },
];

const features = [
  { icon: "🔒", title: "Secure by design", body: "Server-side validation, secure file uploads, and role-based admin access protect every record." },
  { icon: "🔎", title: "Transparent tracking", body: "Every ticket gets a unique reference ID so you can track its verification status at any time." },
  { icon: "🛡️", title: "Full audit trail", body: "Every admin action — verify, reject, edit, cancel — is logged for accountability." },
];

interface WinnerPreview {
  srNo: number;
  name: string;
  address: string;
  prize: string;
}

export default function Home() {
  const { t } = useI18n();
  const [winners, setWinners] = useState<WinnerPreview[]>([]);

  useEffect(() => {
    fetch("/api/winners")
      .then((r) => r.json())
      .then((d) => setWinners((d.lists?.[0]?.entries || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <main className="flex-1">
      <section className="relative flex min-h-screen items-center overflow-hidden bg-slate-950">
        {/* Luxury showroom backdrop image (same as login page) */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-slate-950/50" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              {t("heroTitle").split(" ").map((w, i) =>
                i === 0 ? (
                  <span key={i} className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                    {w}{" "}
                  </span>
                ) : (
                  w + " "
                )
              )}
            </h1>
            <p className="mt-4 text-base text-slate-300 sm:text-lg">{t("heroSubtitle")}</p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/submit"
                className="w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3.5 text-center text-base font-semibold text-slate-900 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-600 sm:w-auto"
              >
                {t("submitTicket")}
              </Link>
              <Link
                href="/status"
                className="w-full rounded-xl border border-amber-400/30 bg-white/5 px-6 py-3.5 text-center text-base font-semibold text-amber-100 hover:border-amber-400/60 hover:bg-white/10 sm:w-auto"
              >
                {t("checkStatus")}
              </Link>
            </div>

            <p className="mx-auto mt-6 max-w-xl text-xs text-slate-500">{t("disclaimer")}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-xl font-bold text-slate-900 sm:text-2xl">How it works</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-slate-500">
          Four simple steps from submitting your ticket to tracking its result.
        </p>
        <div className="relative mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connector line for desktop */}
          <div className="pointer-events-none absolute top-6 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent lg:block" />
          {steps.map((s, i) => (
            <div
              key={s.key}
              className="group relative flex h-full flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
            >
              <div className="relative z-10 mx-auto mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-50 text-2xl ring-4 ring-white transition-transform group-hover:scale-105">
                {s.icon}
              </div>
              <div className="mb-1 flex items-center justify-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">Step {i + 1}</span>
              </div>
              <p className="text-sm font-medium text-slate-700">{t(s.key)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 sm:grid-cols-3">
          {features.map((c) => (
            <div
              key={c.title}
              className="group rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-xl transition-transform group-hover:scale-105">
                {c.icon}
              </div>
              <h3 className="mb-2 text-sm font-bold text-slate-900">{c.title}</h3>
              <p className="text-sm text-slate-600">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {winners.length > 0 && (
        <section className="border-t border-amber-500/10 bg-slate-950 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white sm:text-2xl">🏆 Latest Winners</h2>
                <p className="mt-1 text-sm text-amber-200/50">Real results, announced out in the open.</p>
              </div>
              <Link href="/winners" className="text-sm font-medium text-amber-400 hover:underline">
                View all winners →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {winners.map((w) => (
                <div
                  key={w.srNo}
                  className="rounded-2xl border border-amber-400/20 bg-white/5 p-5 transition-colors hover:border-amber-400/40"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-400/60">#{w.srNo}</p>
                  <p className="mt-1 text-base font-bold text-white">{w.name}</p>
                  <p className="text-sm text-slate-400">{w.address}</p>
                  <p className="mt-2 text-sm font-semibold text-amber-400">{w.prize}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          <strong className="block mb-1">Important notice</strong>
          This platform digitizes ticket record-keeping and verification only. It does not conduct draws, guarantee
          any winning outcome, or make any claim about draw results. Participation may be subject to applicable
          provincial regulations and age restrictions.
        </div>
      </section>
    </main>
  );
}
