"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import type { TicketStatus } from "@/lib/types";

interface PublicTicket {
  referenceId: string;
  customerName: string;
  ticketNumber: string;
  drawName: string;
  drawDate: string;
  amount: number;
  status: TicketStatus;
  submittedAt: string;
  verifiedAt?: string;
  adminNotes?: string;
}

function StatusContent() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("ref") || "");
  const [ticket, setTicket] = useState<PublicTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function search(q: string) {
    if (!q.trim()) {
      setError("Please enter a Reference ID or Ticket Number.");
      return;
    }
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const res = await fetch(`/api/tickets/status?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setTicket(null);
        setError(data.error || "Ticket not found.");
      } else {
        setTicket(data.ticket);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (params.get("ref")) search(params.get("ref")!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Check Ticket Status</h1>
        <p className="mt-1 text-sm text-slate-500">Enter your Reference ID or Ticket Number to view its verification status.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            search(query);
          }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. BLM-2026-000123 or BL-45001"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!error && !ticket && searched && !loading && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
            No matching ticket found.
          </div>
        )}

        {ticket && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reference ID</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xl font-black text-slate-900 font-mono">{ticket.referenceId}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(ticket.referenceId);
                      alert("Reference ID copied to clipboard!");
                    }}
                    title="Copy Reference ID"
                    className="rounded-lg bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-700 hover:bg-amber-500/20 transition-all cursor-pointer"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              <StatusBadge status={ticket.status} />
            </div>

            <dl className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
              <Row label="Customer Name" value={ticket.customerName} />
              <Row label="Ticket Number" value={ticket.ticketNumber} />
              <Row label="Lottery / Draw" value={ticket.drawName} />
              <Row label="Ticket Amount" value={`PKR ${ticket.amount.toLocaleString()}`} />
              <Row label="Submission Date" value={new Date(ticket.submittedAt).toLocaleString()} />
              {ticket.verifiedAt && <Row label="Verification Date" value={new Date(ticket.verifiedAt).toLocaleString()} />}
            </dl>

            {ticket.status === "rejected" && ticket.adminNotes && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                <strong className="block mb-1 text-sm font-bold text-red-800">⚠️ Note from operator:</strong>
                {ticket.adminNotes}
              </div>
            )}

            <Timeline status={ticket.status} />

            <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">Need help with this ticket?</span>
              <a
                href={`https://wa.me/923000000000?text=Hello,%20I%20have%20a%20question%20about%20my%20ticket%20${ticket.referenceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition-all flex items-center gap-1.5"
              >
                💬 Ask Operator on WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Timeline({ status }: { status: TicketStatus }) {
  const stages =
    status === "rejected"
      ? ["Submitted", "Under Verification", "Rejected"]
      : status === "cancelled"
      ? ["Submitted", "Cancelled"]
      : ["Submitted", "Under Verification", "Verified"];

  const activeIndex = stages.length - (status === "pending" ? 1 : 0) - 1;

  return (
    <div className="mt-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Progress</p>
      <ol className="flex items-center">
        {stages.map((s, i) => {
          const done = i <= activeIndex;
          return (
            <li key={s} className="flex flex-1 flex-col items-center text-center last:flex-none">
              <div className="flex w-full items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    done ? statusColor(status) : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                {i < stages.length - 1 && (
                  <div className={`h-0.5 flex-1 ${i < activeIndex ? statusLine(status) : "bg-slate-200"}`} />
                )}
              </div>
              <span className={`mt-2 text-[11px] font-medium ${done ? "text-slate-700" : "text-slate-400"}`}>{s}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function statusColor(status: TicketStatus) {
  if (status === "rejected") return "bg-red-500 text-white";
  if (status === "cancelled") return "bg-slate-400 text-white";
  return "bg-emerald-500 text-white";
}
function statusLine(status: TicketStatus) {
  if (status === "rejected") return "bg-red-400";
  if (status === "cancelled") return "bg-slate-400";
  return "bg-emerald-400";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense>
      <StatusContent />
    </Suspense>
  );
}
