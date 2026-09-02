"use client";

import { useEffect, useState } from "react";
import type { WinnerEntry } from "@/lib/types";

const emptyForm = { listTitle: "", listDate: "", srNo: "", name: "", address: "", prize: "" };

export default function AdminWinnersPage() {
  const [entries, setEntries] = useState<WinnerEntry[] | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/winners");
    const data = await res.json();
    if (res.ok) setEntries(data.entries);
  }

  useEffect(() => {
    load();
  }, []);

  // Pre-fill list title/date from the most recent entry so adding to the same list is quick.
  useEffect(() => {
    if (entries && entries.length > 0 && !form.listTitle) {
      setForm((f) => ({
        ...f,
        listTitle: entries[0].listTitle,
        listDate: entries[0].listDate,
        srNo: String((entries[0].srNo || 0) + 1),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries]);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/admin/winners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Failed to add winner");
      return;
    }
    setForm((f) => ({ ...f, srNo: String(Number(f.srNo) + 1), name: "", address: "", prize: "" }));
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remove this winner entry?")) return;
    await fetch(`/api/admin/winners/${id}`, { method: "DELETE" });
    load();
  }

  const grouped = new Map<string, WinnerEntry[]>();
  (entries || []).forEach((w) => {
    const key = `${w.listTitle}__${w.listDate}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(w);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Winners List</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manually announce bulk draw results (e.g. bikes/cars) — shown publicly on the Winners page, independent of
          individual ticket verification.
        </p>
      </div>

      <form onSubmit={addEntry} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-bold text-slate-900">Add Winner</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="List Title">
            <input required className={fieldCls} value={form.listTitle} onChange={(e) => setForm((f) => ({ ...f, listTitle: e.target.value }))} placeholder="e.g. Winners List 2" />
          </Field>
          <Field label="List Date">
            <input required type="date" className={fieldCls} value={form.listDate} onChange={(e) => setForm((f) => ({ ...f, listDate: e.target.value }))} />
          </Field>
          <Field label="Sr. No.">
            <input required type="number" min={1} className={fieldCls} value={form.srNo} onChange={(e) => setForm((f) => ({ ...f, srNo: e.target.value }))} />
          </Field>
          <Field label="Winner Name">
            <input required className={fieldCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Ahmed Raza" />
          </Field>
          <Field label="Address">
            <input required className={fieldCls} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="e.g. Turbat" />
          </Field>
          <Field label="Car's / Bikes">
            <input required className={fieldCls} value={form.prize} onChange={(e) => setForm((f) => ({ ...f, prize: e.target.value }))} placeholder="e.g. United 125cc" />
          </Field>
        </div>
        {error && <p className="mt-3 text-xs font-medium text-red-600">{error}</p>}
        <button disabled={busy} className="mt-4 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-60">
          {busy ? "Adding…" : "Add Winner"}
        </button>
      </form>

      {entries === null && <p className="text-sm text-slate-400">Loading…</p>}

      {entries && entries.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No winner entries yet.</div>
      )}

      {[...grouped.entries()].map(([key, rows]) => (
        <div key={key} className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-bold text-slate-900">
            {rows[0].listTitle} <span className="font-normal text-slate-400">— {rows[0].listDate}</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Address</th>
                  <th className="py-2 pr-3">Car&apos;s / Bikes</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .sort((a, b) => a.srNo - b.srNo)
                  .map((w) => (
                    <tr key={w.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-3 text-slate-500">{w.srNo}</td>
                      <td className="py-2 pr-3 font-medium text-slate-900">{w.name}</td>
                      <td className="py-2 pr-3 text-slate-600">{w.address}</td>
                      <td className="py-2 pr-3 font-semibold text-amber-700">{w.prize}</td>
                      <td className="py-2 pr-3 text-right">
                        <button onClick={() => remove(w.id)} className="text-xs font-medium text-red-600 hover:underline cursor-pointer">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

const fieldCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}
