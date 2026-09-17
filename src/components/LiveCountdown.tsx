"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Draw } from "@/lib/types";

const DRAW_CACHE_KEY = "akeel_portal_active_draw_cache";

export default function LiveCountdown({ onOpenPopup }: { onOpenPopup?: () => void }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);
  const [activeDraw, setActiveDraw] = useState<Draw | null>(null);

  // Performance refs to prevent interval churn, stutter, and unnecessary re-renders
  const targetMsRef = useRef<number | null>(null);
  const lastDiffRef = useRef<number>(-1);
  const activeDrawRef = useRef<Draw | null>(null);

  activeDrawRef.current = activeDraw;

  useEffect(() => {
    setMounted(true);

    // 1. Immediately hydrate from cache to eliminate any 5-minute flash or delay
    try {
      const cached = localStorage.getItem(DRAW_CACHE_KEY);
      if (cached) {
        const parsed: Draw = JSON.parse(cached);
        if (parsed && (parsed.timerEndMs ? parsed.timerEndMs > Date.now() : parsed.active)) {
          setActiveDraw(parsed);
          targetMsRef.current = parsed.timerEndMs || null;
          if (parsed.timerEndMs) {
            const diff = Math.max(0, Math.floor((parsed.timerEndMs - Date.now()) / 1000));
            lastDiffRef.current = diff;
            setTimeLeft({
              days: Math.floor(diff / 86400),
              hours: Math.floor((diff % 86400) / 3600),
              minutes: Math.floor((diff % 3600) / 60),
              seconds: diff % 60,
            });
          }
        }
      }
    } catch {}

    // 2. Fetch fresh draw status from API
    const loadDraw = () => {
      fetch("/api/draws")
        .then((r) => r.json())
        .then((d) => {
          const now = Date.now();
          const first: Draw | null =
            (d.draws || []).find((x: Draw) => x.active && (!x.timerEndMs || x.timerEndMs > now)) ||
            (d.draws || []).find((x: Draw) => x.active) ||
            d.draws?.[0] ||
            null;

          if (first) {
            targetMsRef.current = first.timerEndMs || null;
            try {
              localStorage.setItem(DRAW_CACHE_KEY, JSON.stringify(first));
            } catch {}
          } else {
            targetMsRef.current = null;
          }

          // Deep compare prevents re-triggering React renders if data is unchanged
          setActiveDraw((prev) => {
            if (!prev && !first) return null;
            if (
              prev &&
              first &&
              prev.id === first.id &&
              prev.timerEndMs === first.timerEndMs &&
              prev.active === first.active &&
              prev.name === first.name
            ) {
              return prev; // Same reference -> NO re-render
            }
            return first;
          });
        })
        .catch(() => {});
    };

    loadDraw();
    const fetchInterval = setInterval(loadDraw, 15000);

    // 3. Ultra-smooth, drift-free tick loop running every 200ms
    // Evaluates frequently but ONLY updates React state when the exact second flips
    const tickInterval = setInterval(() => {
      const currentDraw = activeDrawRef.current;
      const target = targetMsRef.current;

      if (!currentDraw || !currentDraw.active || !target) {
        if (lastDiffRef.current !== 0) {
          lastDiffRef.current = 0;
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
        return;
      }

      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((target - now) / 1000));

      // Skip re-render if the second has not ticked yet
      if (diffSecs === lastDiffRef.current) return;

      lastDiffRef.current = diffSecs;

      const days = Math.floor(diffSecs / 86400);
      const hours = Math.floor((diffSecs % 86400) / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    }, 200);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(tickInterval);
    };
  }, []);

  const isEnded =
    mounted &&
    ((activeDraw && !activeDraw.active) ||
      (targetMsRef.current !== null && targetMsRef.current <= Date.now()) ||
      (timeLeft.days === 0 &&
        timeLeft.hours === 0 &&
        timeLeft.minutes === 0 &&
        timeLeft.seconds === 0 &&
        activeDraw !== null));

  return (
    <div className="w-full rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-900/90 via-slate-950 to-black p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            {isEnded ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                Submissions Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-3.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span>
                  {timeLeft.days > 0
                    ? `${timeLeft.days} ${timeLeft.days === 1 ? "Day" : "Days"} Remaining`
                    : timeLeft.hours > 0
                    ? `${timeLeft.hours}h ${timeLeft.minutes}m Remaining`
                    : timeLeft.minutes > 0
                    ? `${timeLeft.minutes}m ${timeLeft.seconds}s Remaining`
                    : mounted
                    ? `${timeLeft.seconds}s Remaining`
                    : "Live Draw Countdown"}
                </span>
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
                className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border font-mono tabular-nums text-xl sm:text-2xl font-black tracking-wider shadow-inner transition-colors duration-200 select-none ${
                  isEnded
                    ? "border-red-500/30 bg-red-950/20 text-red-400"
                    : "border-amber-400/25 bg-white/5 text-amber-400"
                }`}
              >
                {mounted ? String(item.val).padStart(2, "0") : "--"}
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
              Submissions Closed
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
