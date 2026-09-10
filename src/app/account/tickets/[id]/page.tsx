"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import MessageThread from "@/components/MessageThread";
import type { Ticket } from "@/lib/types";

export default function CustomerTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customer/tickets/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ticket) setTicket(d.ticket);
        else setError(d.error || "Ticket not found");
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="flex-1 bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/account" className="text-sm text-amber-400 hover:underline">
          ← Back to My Tickets
        </Link>

        {loading && <p className="mt-6 text-sm text-slate-400">Loading…</p>}
        {error && !loading && <p className="mt-6 text-sm text-red-400">{error}</p>}

        {ticket && (
          <div className="mt-4 space-y-5">
            <div className="rounded-2xl border border-amber-400/20 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-400/70">{ticket.referenceId}</p>
                  <h1 className="mt-1 text-lg font-bold text-white">{ticket.drawName}</h1>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                <Row label="Ticket No." value={ticket.ticketNumber} />
                <Row label="Amount" value={`PKR ${ticket.amount.toLocaleString()}`} />
                <Row label="Draw Date" value={ticket.drawDate} />
                <Row label="Submitted" value={new Date(ticket.submittedAt).toLocaleString()} />
                {ticket.verifiedAt && <Row label="Verified" value={new Date(ticket.verifiedAt).toLocaleString()} />}
                {ticket.isWinner && <Row label="Prize" value={ticket.prize || "Winner"} />}
              </dl>
              {ticket.adminNotes && (ticket.status === "rejected" || ticket.status === "cancelled") && (
                <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                  {ticket.adminNotes}
                </div>
              )}
              {ticket.holders && ticket.holders.length > 0 && (
                <div className="mt-4 border-t border-amber-400/20 pt-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-400/70">Ticket Holders</p>
                  <ul className="space-y-1 text-sm text-slate-200">
                    {ticket.holders.map((h, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span>{h.name}</span>
                        <span className="text-slate-400">{h.quantity} ticket{h.quantity === 1 ? "" : "s"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <MessageThread ticketId={ticket.id} viewerRole="customer" theme="dark" />
          </div>
        )}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-100">{value}</dd>
    </div>
  );
}
