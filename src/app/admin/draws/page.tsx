"use client";

import { useEffect, useState } from "react";
import type { Draw } from "@/lib/types";

export default function DrawsPage() {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", drawDate: "", ticketPrice: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/draws").then((r) => r.json()).then((d) => setDraws(d.draws || [])).finally(() => setLoading(false));
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Draws</h1>
          <p className="text-sm text-slate-500">Manage the lottery draws customers can select when submitting tickets.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
          {showForm ? "Close" : "+ New Draw"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createDraw} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
          <input required placeholder="Draw name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm sm:col-span-2" />
          <input required type="date" value={form.drawDate} onChange={(e) => setForm((f) => ({ ...f, drawDate: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <input required type="number" placeholder="Ticket price" value={form.ticketPrice} onChange={(e) => setForm((f) => ({ ...f, ticketPrice: e.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <button disabled={saving} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white sm:col-span-4 cursor-pointer">
            {saving ? "Saving…" : "Create Draw"}
          </button>
          {error && <p className="sm:col-span-4 text-xs text-red-600">{error}</p>}
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && <p className="text-sm text-slate-400">Loading draws…</p>}
        {!loading && draws.length === 0 && <p className="text-sm text-slate-400">No draws configured yet.</p>}
        {!loading &&
          draws.map((d) => (
            <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-slate-900">{d.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${d.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {d.active ? "Active" : "Closed"}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500">Draw Date: {d.drawDate}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">PKR {d.ticketPrice.toLocaleString()}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
