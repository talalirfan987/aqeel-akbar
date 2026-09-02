"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { Ticket } from "@/lib/types";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [confirmFor, setConfirmFor] = useState<{ ticket: Ticket; action: "verify" | "cancel" } | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);
    const res = await fetch(`/api/tickets?${params.toString()}`);
    const data = await res.json();
    setTickets(data.tickets || []);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, sort]);

  function openConfirm(ticket: Ticket, action: "verify" | "cancel") {
    setConfirmFor({ ticket, action });
    setNotes("");
    setActionError("");
  }

  async function confirmActionSubmit() {
    if (!confirmFor) return;
    setBusy(true);
    setActionError("");
    const res = await fetch(`/api/tickets/${confirmFor.ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: confirmFor.action, adminNotes: notes }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setActionError(data.error || "Action failed");
      return;
    }
    setConfirmFor(null);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tickets</h1>
          <p className="text-sm text-slate-500">Search, filter, and manage all submitted tickets.</p>
        </div>
        <a
          href="/api/tickets/export"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-amber-300 hover:text-amber-600"
        >
          ⬇ Export CSV
        </a>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by reference ID, ticket #, name, or phone…"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending Verification</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-400"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Amount</option>
          <option value="lowest">Lowest Amount</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Reference ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Ticket No.</th>
                <th className="px-4 py-3 font-medium">Draw</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    Loading tickets…
                  </td>
                </tr>
              )}
              {!loading && tickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    No tickets match your filters.
                  </td>
                </tr>
              )}
              {!loading &&
                tickets.map((t) => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-amber-600">
                      {t.referenceId}
                      {t.isDuplicate && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Possible Duplicate
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{t.customerName}</td>
                    <td className="px-4 py-3 text-slate-700">{t.ticketNumber}</td>
                    <td className="px-4 py-3 text-slate-500">{t.drawName}</td>
                    <td className="px-4 py-3 text-slate-700">PKR {t.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(t.submittedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/tickets/${t.id}`} className="font-medium text-amber-600 hover:underline">
                          View
                        </Link>
                        {t.status === "pending" && (
                          <>
                            <button
                              onClick={() => openConfirm(t, "verify")}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 cursor-pointer"
                            >
                              Verify
                            </button>
                            <button
                              onClick={() => openConfirm(t, "cancel")}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-red-300 hover:text-red-600 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {confirmFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              {confirmFor.action === "verify" ? "Verify this ticket?" : "Cancel this ticket?"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {confirmFor.ticket.referenceId} — {confirmFor.ticket.customerName}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {confirmFor.action === "verify"
                ? "This will mark the ticket as Verified and generate a digital record."
                : "This will cancel the ticket. It remains in the system for audit purposes."}
            </p>
            <label className="mt-4 block text-xs font-medium text-slate-500">Description (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add a note about this action…"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            {actionError && <p className="mt-2 text-xs font-medium text-red-600">{actionError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmFor(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmActionSubmit}
                disabled={busy}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-60 ${
                  confirmFor.action === "verify" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {busy ? "Processing…" : confirmFor.action === "verify" ? "Verify Ticket" : "Cancel Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
