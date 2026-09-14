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

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-md">
        <table className="w-full min-w-[880px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Draw</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3">Hour</th>
              <th className="px-4 py-3">Minute</th>
              <th className="px-4 py-3">Countdown</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-sm text-slate-400">
                  Loading draws list…
                </td>
              </tr>
            )}
            {!loading && draws.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-sm text-slate-400">
                  No draws configured yet.
                </td>
              </tr>
            )}
            {!loading &&
              draws.map((d) => (
                <DrawRow
                  key={d.id}
                  draw={d}
                  isBusy={updatingId === d.id}
                  onUpdate={(patch) => updateDraw(d.id, patch)}
                />
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DrawRow({
  draw,
  isBusy,
  onUpdate,
}: {
  draw: Draw;
  isBusy: boolean;
  onUpdate: (patch: Partial<Draw>) => void;
}) {
  const [date, setDate] = useState(draw.drawDate);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5); // Default 5 minutes

  const hasTimer = typeof draw.timerEndMs === "number" && draw.timerEndMs > Date.now();
  const remainingSecs = hasTimer ? Math.max(0, Math.floor((draw.timerEndMs! - Date.now()) / 1000)) : 0;
  const remDays = Math.floor(remainingSecs / (3600 * 24));
  const remHours = Math.floor((remainingSecs % (3600 * 24)) / 3600);
  const remMins = Math.floor((remainingSecs % 3600) / 60);
  const remSecs = remainingSecs % 60;

  function handleSetTimer() {
    const totalSecs = days * 86400 + hours * 3600 + minutes * 60;
    if (totalSecs <= 0) return;
    const targetMs = Date.now() + totalSecs * 1000;
    onUpdate({ timerEndMs: targetMs, active: true });
  }

  function handleDateBlur() {
    if (date && date !== draw.drawDate) onUpdate({ drawDate: date });
  }

  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <p className="font-black text-slate-900">{draw.name}</p>
        <p className="text-xs font-bold text-amber-600">PKR {draw.ticketPrice.toLocaleString()}</p>
      </td>
      <td className="px-4 py-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onBlur={handleDateBlur}
          disabled={isBusy}
          className="w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-50"
        />
      </td>
      <td className="px-4 py-3">
        <button
          disabled={isBusy}
          onClick={() => onUpdate({ active: !draw.active })}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide cursor-pointer transition disabled:opacity-50 ${
            draw.active
              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
              : "bg-red-100 text-red-800 hover:bg-red-200"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${draw.active ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          {isBusy ? "…" : draw.active ? "Open" : "Closed"}
        </button>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          value={days}
          onChange={(e) => setDays(Math.max(0, Number(e.target.value) || 0))}
          className="w-16 text-center rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          max={23}
          value={hours}
          onChange={(e) => setHours(Math.max(0, Number(e.target.value) || 0))}
          className="w-16 text-center rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-bold text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          max={59}
          value={minutes}
          onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))}
          className="w-16 text-center rounded-lg border border-slate-300 px-2 py-1.5 text-sm font-bold text-amber-600 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </td>
      <td className="px-4 py-3">
        {hasTimer ? (
          <span className="inline-block whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-300">
            {remDays}d {remHours}h {remMins}m {remSecs}s
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-400">No timer</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          disabled={isBusy}
          onClick={handleSetTimer}
          className="whitespace-nowrap rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md hover:scale-[1.02] transition active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {isBusy ? "Saving…" : "Save Timer"}
        </button>
      </td>
    </tr>
  );
}
