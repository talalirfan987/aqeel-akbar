"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Draw } from "@/lib/types";

export default function LiveCountdown({ onOpenPopup }: { onOpenPopup?: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 5, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const [activeDraw, setActiveDraw] = useState<Draw | null>(null);

  useEffect(() => {
    setMounted(true);

    const loadDraw = () => {
      fetch("/api/draws")
        .then((r) => r.json())
        .then((d) => {
          const first = (d.draws || []).find((x: Draw) => x.active) || d.draws?.[0] || null;
          setActiveDraw(first);
        })
        .catch(() => {});
    };

    loadDraw();
    const fetchInterval = setInterval(loadDraw, 5000); // sync with admin settings every 5s

    return () => clearInterval(fetchInterval);
  }, []);

  useEffect(() => {
    const STORAGE_KEY = "akeel_portal_draw_target_time";

    const updateTimer = () => {
      let targetMs: number | null = activeDraw?.timerEndMs || null;

      if (!targetMs) {
        let stored = Number(localStorage.getItem(STORAGE_KEY));
        if (!stored || isNaN(stored) || Date.now() - stored > 10 * 60 * 1000) {
          stored = Date.now() + 5 * 60 * 1000;
          localStorage.setItem(STORAGE_KEY, String(stored));
        }
        targetMs = stored;
      }

      if (activeDraw && !activeDraw.active) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const now = Date.now();
      const diff = Math.max(0, Math.floor((targetMs - now) / 1000));

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (3600 * 24));
      const hours = Math.floor((diff % (3600 * 24)) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeDraw]);

  const isEnded =
    (activeDraw && !activeDraw.active) ||
    (timeLeft.days === 0 &&
      timeLeft.hours === 0 &&
      timeLeft.minutes === 0 &&
      timeLeft.seconds === 0);

  return (
    <div className="w-full rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-slate-950 to-black p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            {isEnded ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/30">
                🔒 Submissions Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                🔥 {timeLeft.minutes > 0 ? `${timeLeft.minutes} Mins Live Timer` : "Live Draw Countdown"}
              </span>
            )}
            <span className="text-xs text-slate-400">Monthly Bumper Draw</span>
          </div>
          <h3 className="mt-2 text-xl font-black text-white sm:text-2xl tracking-tight">
            {activeDraw?.name || "Balochistan Super Lucky Draw 2026"}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {isEnded
              ? "Draw timer has ended or submissions are closed by admin."
              : "Submit your verified receipt before the timer ends to enter the upcoming draw."}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {[
            { label: "DAYS", val: timeLeft.days },
            { label: "HOURS", val: timeLeft.hours },
            { label: "MINS", val: timeLeft.minutes },
            { label: "SECS", val: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div
                className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border font-mono text-xl sm:text-2xl font-black shadow-inner ${
                  isEnded
                    ? "border-red-500/30 bg-red-950/20 text-red-400"
                    : "border-amber-400/25 bg-white/5 text-amber-400"
                }`}
              >
                {mounted ? String(item.val).padStart(2, "0") : "00"}
              </div>
              <span className="mt-1.5 text-[10px] font-bold tracking-widest text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="shrink-0 w-full md:w-auto">
          {isEnded ? (
            <button
              disabled
              className="block w-full text-center rounded-2xl bg-zinc-800 border border-zinc-700 px-6 py-3.5 text-sm font-bold text-zinc-400 cursor-not-allowed opacity-80"
            >
              🔒 Submissions Closed
            </button>
          ) : onOpenPopup ? (
            <button
              onClick={onOpenPopup}
              className="block w-full text-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Submit Ticket Now →
            </button>
          ) : (
            <Link
              href="/submit"
              className="block text-center rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              Submit Ticket Now →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
