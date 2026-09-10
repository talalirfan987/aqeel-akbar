"use client";

import { useEffect, useState } from "react";
import type { Draw } from "@/lib/types";

export default function DrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", drawDate: "", ticketPrice: "" });
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/draws")
      .then((r) => r.json())
      .then((d) => setDraws(d.draws || []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function createDraw(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/draws", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ticketPrice: Number(form.ticketPrice), active: true }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Failed to create draw. Check the fields and try again.");
      return;
    }
    setForm({ name: "", drawDate: "", ticketPrice: "" });
    setShowForm(false);
    load();
  }

  async function updateDraw(id: string, patch: Partial<Draw>) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/draws", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (res.ok) {
        if (patch.timerEndMs !== undefined) {
          if (patch.timerEndMs) {
            localStorage.setItem("akeel_portal_draw_target_time", String(patch.timerEndMs));
          } else {
            localStorage.removeItem("akeel_portal_draw_target_time");
          }
        }
        load();
      }
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Draws & Live Timers</h1>
          <p className="text-sm text-slate-500">
            Control draw status, ticket pricing, and exact countdown timer (Days, Hours, Minutes, Seconds).
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-extrabold text-slate-950 shadow-md hover:scale-105 transition cursor-pointer"
        >
          {showForm ? "Close Form" : "+ Create New Draw"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createDraw} className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-4">
          <h2 className="sm:col-span-4 text-base font-bold text-slate-900">Add New Draw</h2>
          <input
            required
            placeholder="Draw name (e.g. Bumper Lucky Draw)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm sm:col-span-2 outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            required
            type="date"
            value={form.drawDate}
            onChange={(e) => setForm((f) => ({ ...f, drawDate: e.target.value }))}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            required
            type="number"
            placeholder="Ticket price (PKR)"
            value={form.ticketPrice}
            onChange={(e) => setForm((f) => ({ ...f, ticketPrice: e.target.value }))}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white sm:col-span-4 hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving…" : "Create & Open Draw"}
          </button>
          {error && <p className="sm:col-span-4 text-xs font-semibold text-red-600">{error}</p>}
        </form>
      )}

      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
        {loading && <p className="text-sm text-slate-400">Loading draws list…</p>}
        {!loading && draws.length === 0 && <p className="text-sm text-slate-400">No draws configured yet.</p>}
        {!loading &&
          draws.map((d) => (
            <DrawCard
              key={d.id}
              draw={d}
              isBusy={updatingId === d.id}
              onUpdate={(patch) => updateDraw(d.id, patch)}
            />
          ))}
      </div>
    </div>
  );
}

function DrawCard({
  draw,
  isBusy,
  onUpdate,
}: {
  draw: Draw;
  isBusy: boolean;
  onUpdate: (patch: Partial<Draw>) => void;
}) {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5); // Default 5 minutes
  const [seconds, setSeconds] = useState(0);

  const hasTimer = typeof draw.timerEndMs === "number" && draw.timerEndMs > Date.now();
  const remainingSecs = hasTimer ? Math.max(0, Math.floor((draw.timerEndMs! - Date.now()) / 1000)) : 0;
  const remDays = Math.floor(remainingSecs / (3600 * 24));
  const remHours = Math.floor((remainingSecs % (3600 * 24)) / 3600);
  const remMins = Math.floor((remainingSecs % 3600) / 60);
  const remSecs = remainingSecs % 60;

  function handleSetCustomTimer() {
    const totalSecs = days * 86400 + hours * 3600 + minutes * 60 + seconds;
    if (totalSecs <= 0) return;
    const targetMs = Date.now() + totalSecs * 1000;
    onUpdate({ timerEndMs: targetMs, active: true });
  }

  function handlePresetTimer(mins: number) {
    const targetMs = Date.now() + mins * 60 * 1000;
    onUpdate({ timerEndMs: targetMs, active: true });
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              draw.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${draw.active ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            {draw.active ? "SUBMISSIONS OPEN" : "SUBMISSIONS CLOSED"}
          </span>
          <h3 className="mt-2 text-xl font-black text-slate-900">{draw.name}</h3>
          <p className="text-xs text-slate-500">Scheduled Date: {draw.drawDate}</p>
        </div>
        <span className="text-lg font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
          PKR {draw.ticketPrice.toLocaleString()}
        </span>
      </div>

      {/* Draw Status Control */}
      <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">Quick Status Control:</span>
        <button
          disabled={isBusy}
          onClick={() => onUpdate({ active: !draw.active })}
          className={`rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-wide cursor-pointer transition ${
            draw.active
              ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          }`}
        >
          {isBusy ? "Updating…" : draw.active ? "Close Submissions" : "Open Submissions"}
        </button>
      </div>

      {/* Live Countdown Inputs: Days, Hours, Minutes, Seconds */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wide text-amber-900 flex items-center gap-1">
            Configure Live Countdown Timer
          </span>
          {hasTimer ? (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
              Active: {remDays}d {remHours}h {remMins}m {remSecs}s
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-400">No active timer set</span>
          )}
        </div>

        {/* 4 Input Boxes for Days, Hours, Minutes, Seconds */}
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Days
            </label>
            <input
              type="number"
              min={0}
              value={days}
              onChange={(e) => setDays(Math.max(0, Number(e.target.value) || 0))}
              className="w-full text-center rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Hours
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={hours}
              onChange={(e) => setHours(Math.max(0, Number(e.target.value) || 0))}
              className="w-full text-center rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Minutes
            </label>
            <input
              type="number"
              min={0}
              max={59}
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))}
              className="w-full text-center rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm font-bold text-amber-600 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mb-1">
              Seconds
            </label>
            <input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(e) => setSeconds(Math.max(0, Number(e.target.value) || 0))}
              className="w-full text-center rounded-xl border border-slate-300 bg-white px-2 py-2 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>
        </div>

        <button
          disabled={isBusy}
          onClick={handleSetCustomTimer}
          className="w-full rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md hover:scale-[1.01] transition active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isBusy ? "Saving Timer…" : "Save & Set Live Timer"}
        </button>

        {/* Quick Presets */}
        <div className="flex items-center justify-between border-t border-amber-200/60 pt-3">
          <span className="text-[11px] font-bold text-amber-900">Quick Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "5 Mins", mins: 5 },
              { label: "15 Mins", mins: 15 },
              { label: "1 Hour", mins: 60 },
              { label: "1 Day", mins: 1440 },
            ].map((p) => (
              <button
                key={p.mins}
                disabled={isBusy}
                onClick={() => handlePresetTimer(p.mins)}
                className="rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-400 hover:text-slate-950 transition cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
