"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function FloatingSupport() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Hide on admin routes
  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      {open && (
        <div className="mb-3 w-72 rounded-2xl border border-amber-500/30 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Helpline & Support</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-white/5"
            >
              ✕
            </button>
          </div>

          <p className="mt-2.5 text-xs text-slate-300">
            Need help with your ticket verification or draws? Contact operator directly:
          </p>

          <div className="mt-3 space-y-2">
            <a
              href="https://wa.me/923000000000?text=Hello,%20I%20need%20help%20with%20my%20lottery%20ticket"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl bg-emerald-600/90 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-500 shadow-md"
            >
              <span className="text-base">💬</span> WhatsApp Support
            </a>

            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl border border-amber-400/30 bg-white/5 px-3.5 py-2 text-xs font-medium text-amber-200 transition-all hover:bg-white/10"
            >
              <span className="text-base">📧</span> Contact Form
            </Link>

            <Link
              href="/status"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-200 transition-all hover:border-amber-400/40"
            >
              <span className="text-base">🔎</span> Quick Track Ticket
            </Link>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="group relative flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-slate-950 font-bold shadow-xl shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Support chat"
      >
        <span className="text-lg">💬</span>
        <span className="hidden text-xs font-extrabold uppercase tracking-wide md:inline">Support</span>
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
        </span>
      </button>
    </div>
  );
}
