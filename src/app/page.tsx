"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import LiveCountdown from "@/components/LiveCountdown";
import type { Draw } from "@/lib/types";

const steps = [{ key: "step1" as const }, { key: "step2" as const }, { key: "step3" as const }, { key: "step4" as const }];

const features = [
  { title: "Secure by design", body: "Server-side validation, secure file uploads, and role-based admin access protect every record." },
  { title: "Transparent tracking", body: "Every ticket gets a unique reference ID so you can track its verification status at any time." },
  { title: "Full audit trail", body: "Every admin action — verify, reject, edit, cancel — is logged for accountability." },
];

interface WinnerPreview {
  srNo: number;
  name: string;
  address: string;
  prize: string;
}

export default function Home() {
  const { t } = useI18n();
  const router = useRouter();
  const [winners, setWinners] = useState<WinnerPreview[]>([]);
  const [quickRef, setQuickRef] = useState("");
  const [activeDraw, setActiveDraw] = useState<Draw | null>(null);
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);

  useEffect(() => {
    fetch("/api/winners")
      .then((r) => r.json())
      .then((d) => setWinners((d.lists?.[0]?.entries || []).slice(0, 3)))
      .catch(() => {});

    fetch("/api/draws")
      .then((r) => r.json())
      .then((d) => {
        const found = (d.draws || []).find((x: Draw) => x.active);
        setActiveDraw(found || d.draws?.[0] || null);
      })
      .catch(() => {});
  }, []);

  const isClosed = !activeDraw || !activeDraw.active || (typeof activeDraw.timerEndMs === "number" && activeDraw.timerEndMs <= Date.now());

  function handleQuickSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!quickRef.trim()) return;
    router.push(`/status?ref=${encodeURIComponent(quickRef.trim())}`);
  }

  return (
    <main className="flex-1 bg-slate-950 text-slate-100 relative">
      {/* Hero Section with Luxury Backdrop */}
      <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-slate-950 py-20 sm:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-90 transition-transform duration-1000"
          style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950" />
        
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 w-full">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-6xl leading-tight">
              {t("heroTitle").split(" ").map((w, i) =>
                i === 0 ? (
                  <span key={i} className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
                    {w}{" "}
                  </span>
                ) : (
                  w + " "
                )
              )}
            </h1>
            <p className="mt-4 text-base text-slate-300 sm:text-xl font-medium max-w-2xl mx-auto">{t("heroSubtitle")}</p>

            {/* Quick Track Input Bar */}
            <form onSubmit={handleQuickSearch} className="mt-8 mx-auto max-w-xl">
              <div className="relative flex items-center rounded-2xl border border-amber-400/30 bg-white/10 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/30">
                <input
                  type="text"
                  value={quickRef}
                  onChange={(e) => setQuickRef(e.target.value)}
                  placeholder="Enter Reference ID (e.g. BLM-2026-000012) or Phone"
                  className="w-full bg-transparent px-3.5 py-2.5 text-sm text-white placeholder-slate-400 outline-none font-mono"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wide text-slate-950 shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  Track Now
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setShowSubmitPopup(true)}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-8 py-4 text-center text-sm font-extrabold uppercase tracking-wider text-slate-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-105 sm:w-auto cursor-pointer"
              >
                {t("submitTicket")}
              </button>

              <Link
                href="/status"
                className="w-full rounded-2xl border border-amber-400/30 bg-white/5 px-8 py-4 text-center text-sm font-bold text-amber-100 backdrop-blur-md transition-all hover:border-amber-400/60 hover:bg-white/10 sm:w-auto"
              >
                {t("checkStatus")}
              </Link>
            </div>

            <p className="mx-auto mt-6 max-w-xl text-xs text-slate-400">{t("disclaimer")}</p>
          </div>
        </div>
      </section>

      {/* Live Draw Countdown Section */}
      <section className="mx-auto max-w-6xl px-4 -mt-12 relative z-20 sm:px-6">
        <LiveCountdown onOpenPopup={() => setShowSubmitPopup(true)} />
      </section>

      {/* How It Works Section - Dark Luxury Theme */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 bg-slate-950">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">Simple & Fast Process</span>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-4xl">How It Works</h2>
          <p className="mt-2 text-sm text-slate-400">
            Four simple steps from submitting your ticket to tracking its live verification result.
          </p>
        </div>
        <div className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute top-7 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent lg:block" />
          {steps.map((s, i) => (
            <div
              key={s.key}
              className="group relative flex h-full flex-col items-center rounded-3xl border border-amber-400/20 bg-white/5 p-6 text-center shadow-xl backdrop-blur-md transition-all hover:-translate-y-1.5 hover:border-amber-400/60 hover:bg-white/10"
            >
              <span className="mx-auto mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-xl font-black text-slate-950 ring-4 ring-slate-950 shadow-lg transition-transform group-hover:scale-110">
                {i + 1}
              </span>
              <span className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-400">Step {i + 1}</span>
              <p className="text-sm font-semibold text-slate-200">{t(s.key)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section - Dark Luxury Theme */}
      <section className="border-t border-amber-500/10 bg-slate-950/80">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:px-6 sm:grid-cols-3">
          {features.map((c) => (
            <div
              key={c.title}
              className="group rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-amber-400/40 hover:bg-slate-900/90 shadow-xl"
            >
              <h3 className="mb-2 text-base font-bold text-white">{c.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Winners Showcase Section */}
      {winners.length > 0 && (
        <section className="border-t border-amber-500/10 bg-slate-950 py-20 relative overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-64 w-full max-w-4xl bg-amber-500/5 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">Verifiable Results</span>
                <h2 className="mt-1 text-2xl font-black text-white sm:text-4xl">Recent Lucky Draw Winners</h2>
                <p className="mt-1 text-sm text-slate-400">Real verified participants announced out in the open.</p>
              </div>
              <Link href="/winners" className="text-xs font-extrabold uppercase tracking-wide text-amber-400 hover:text-amber-300 flex items-center gap-1">
                View All Winners List →
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {winners.map((w) => (
                <div
                  key={w.srNo}
                  className="rounded-3xl border border-amber-400/20 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-amber-400/50 hover:bg-white/10 shadow-xl"
                >
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-400 border border-amber-400/30">
                    Winner #{w.srNo}
                  </span>
                  <p className="mt-3 text-lg font-black text-white">{w.name}</p>
                  <p className="text-xs text-slate-400">{w.address}</p>
                  <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between">
                    <span className="text-[10px] uppercase text-slate-400">Prize Awarded</span>
                    <span className="text-sm font-extrabold text-amber-400">{w.prize}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Notice Section */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-6 backdrop-blur-md text-sm text-amber-200">
          <strong className="block mb-1 text-base font-bold text-amber-300">Important Portal Notice</strong>
          This portal digitizes ticket record-keeping, status tracking, and customer support verification only. It does not conduct draws, guarantee any winning outcome, or make claims. Participation may be subject to provincial regulations.
        </div>
      </section>

      {/* Luxury Ticket Submission Popup Modal */}
      {showSubmitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-amber-400/30 bg-slate-900 p-6 sm:p-8 shadow-2xl relative text-white space-y-5">
            <button
              onClick={() => setShowSubmitPopup(false)}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white transition cursor-pointer"
            >
              ✕
            </button>

            <div>
              <h3 className="text-xl font-black text-white">
                {isClosed ? "Submissions Closed Notice" : "Ticket Submission Verification"}
              </h3>
              <p className={`text-xs font-bold uppercase tracking-wider ${isClosed ? "text-red-400" : "text-amber-400"}`}>
                {isClosed ? "Draw Submissions Ended" : "Official Guidelines & Rules"}
              </p>
            </div>

            {isClosed ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-5 space-y-2 text-sm text-red-200">
                <strong className="block text-base font-extrabold text-red-400">
                  Submissions Currently Closed
                </strong>
                <p className="text-xs text-red-300 leading-relaxed">
                  Ticket submissions for this draw have officially ended. You cannot submit or purchase a ticket at this time. Please wait for the next draw announcement.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-300">
                <div className="rounded-2xl border border-amber-400/20 bg-white/5 p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Active Draw:</span>
                    <span className="font-bold text-amber-300">{activeDraw?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Ticket Price:</span>
                    <span className="font-bold text-amber-300">PKR {activeDraw?.ticketPrice?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="font-bold text-white text-xs uppercase tracking-wider">Before Proceeding Make Sure:</p>
                  <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                    <li>Payment is made via JazzCash or EasyPaisa.</li>
                    <li>You have a clear screenshot or photo of your payment receipt.</li>
                    <li>Keep your mobile number active for status updates.</li>
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitPopup(false)}
                className="rounded-xl border border-slate-700 bg-white/5 px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition cursor-pointer"
              >
                {isClosed ? "Got It / Close" : "Cancel"}
              </button>

              {!isClosed && (
                <button
                  onClick={() => {
                    setShowSubmitPopup(false);
                    router.push("/submit");
                  }}
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-2.5 text-xs font-extrabold uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/25 hover:scale-105 transition cursor-pointer"
                >
                  Proceed to Form →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
