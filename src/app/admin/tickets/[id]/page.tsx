"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import MessageThread from "@/components/MessageThread";
import type { Ticket } from "@/lib/types";

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "verify" | "reject" | "cancel">(null);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ customerName: "", phone: "", ticketNumber: "", amount: "" });
  const [duplicateOf, setDuplicateOf] = useState<Ticket | null>(null);
  const [prize, setPrize] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/tickets/${id}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load ticket");
      setLoading(false);
      return;
    }
    setTicket(data.ticket);
    setNotes(data.ticket.adminNotes || "");
    setPrize(data.ticket.prize || "");
    setEdit({
      customerName: data.ticket.customerName,
      phone: data.ticket.phone,
      ticketNumber: data.ticket.ticketNumber,
      amount: String(data.ticket.amount),
    });
    setLoading(false);

    if (data.ticket.isDuplicate) {
      const all = await fetch(`/api/tickets?q=${encodeURIComponent(data.ticket.ticketNumber)}`).then((r) => r.json());
      const other = (all.tickets || []).find((t: Ticket) => t.id !== data.ticket.id && t.ticketNumber === data.ticket.ticketNumber);
      setDuplicateOf(other || null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(action: string, body: Record<string, unknown> = {}) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Action failed");
      return;
    }
    setTicket(data.ticket);
    setConfirmAction(null);
    setEditing(false);
  }

  if (loading) return <p className="text-sm text-slate-400">Loading ticket…</p>;
  if (error && !ticket) return <p className="text-sm text-red-600">{error}</p>;
  if (!ticket) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/tickets" className="text-amber-600 hover:underline">
          ← Back to Tickets
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase text-slate-400">Reference ID</p>
            <h1 className="text-xl font-bold text-slate-900">{ticket.referenceId}</h1>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        {ticket.isDuplicate && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <strong className="block">Possible Duplicate Ticket</strong>
            Ticket number {ticket.ticketNumber} already exists in the system
            {duplicateOf ? ` (Reference ${duplicateOf.referenceId}, status: ${duplicateOf.status})` : ""}. Please
            review carefully before verification. This is a flag for manual review only — it is not an accusation
            of fraud.
            <button
              onClick={() => act("unmark_duplicate")}
              disabled={busy}
              className="mt-2 block text-xs font-semibold text-amber-700 underline cursor-pointer"
            >
              Clear duplicate flag
            </button>
          </div>
        )}

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 text-sm font-bold text-slate-900">Customer Information</h2>
            {editing ? (
              <div className="space-y-2">
                <input className={fieldCls} value={edit.customerName} onChange={(e) => setEdit((s) => ({ ...s, customerName: e.target.value }))} placeholder="Full Name" />
                <input className={fieldCls} value={edit.phone} onChange={(e) => setEdit((s) => ({ ...s, phone: e.target.value }))} placeholder="Phone" />
              </div>
            ) : (
              <dl className="space-y-2 text-sm">
                <Row label="Name" value={ticket.customerName} />
                <Row label="Phone" value={ticket.phone} />
                {ticket.city && <Row label="City" value={ticket.city} />}
                {ticket.cnic && <Row label="CNIC" value={ticket.cnic} />}
                {ticket.paymentMethod && (
                  <Row
                    label="Payment"
                    value={`${ticket.paymentMethod === "jazzcash" ? "JazzCash" : "EasyPaisa"} — ${
                      ticket.paymentConfirmed ? "Confirmed" : "Not confirmed"
                    }`}
                  />
                )}
              </dl>
            )}
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold text-slate-900">Ticket Information</h2>
            {editing ? (
              <div className="space-y-2">
                <input className={fieldCls} value={edit.ticketNumber} onChange={(e) => setEdit((s) => ({ ...s, ticketNumber: e.target.value }))} placeholder="Ticket Number" />
                <input className={fieldCls} type="number" value={edit.amount} onChange={(e) => setEdit((s) => ({ ...s, amount: e.target.value }))} placeholder="Amount" />
              </div>
            ) : (
              <dl className="space-y-2 text-sm">
                <Row label="Ticket No." value={ticket.ticketNumber} />
                <Row label="Draw" value={ticket.drawName} />
                {ticket.quantity != null && <Row label="Number of Tickets" value={String(ticket.quantity)} />}
                <Row label="Amount" value={`PKR ${ticket.amount.toLocaleString()}`} />
                <Row label="Draw Date" value={ticket.drawDate} />
              </dl>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Uploaded Ticket / Receipt Image</h2>
          {ticket.ticketImage ? (
            ticket.ticketImage.startsWith("data:image") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ticket.ticketImage} alt="Ticket receipt" className="max-h-80 rounded-xl border border-slate-200 object-contain" />
            ) : (
              <a href={ticket.ticketImage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-amber-600">
                📄 View PDF ({ticket.ticketImageName})
              </a>
            )
          ) : (
            <p className="text-sm text-slate-400">No image uploaded.</p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-bold text-slate-900">Internal Admin Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Internal notes (visible to admins only, except on rejection)…"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {editing ? (
            <>
              <button disabled={busy} onClick={() => act("edit", edit)} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white cursor-pointer">
                Save Changes
              </button>
              <button onClick={() => setEditing(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 cursor-pointer">
                Cancel Edit
              </button>
            </>
          ) : (
            <>
              {ticket.status === "pending" && (
                <>
                  <button onClick={() => setConfirmAction("verify")} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 cursor-pointer">
                    ✓ Verify
                  </button>
                  <button onClick={() => setConfirmAction("reject")} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 cursor-pointer">
                    ✕ Reject
                  </button>
                  <button onClick={() => setEditing(true)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 cursor-pointer">
                    Edit Info
                  </button>
                </>
              )}
              {ticket.status !== "cancelled" && (
                <button onClick={() => setConfirmAction("cancel")} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-red-300 hover:text-red-600 cursor-pointer">
                  Cancel Ticket
                </button>
              )}
              {!ticket.isDuplicate && (
                <button onClick={() => act("mark_duplicate")} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 cursor-pointer">
                  Mark as Duplicate
                </button>
              )}
            </>
          )}
        </div>

        {notes !== (ticket.adminNotes || "") && !editing && (
          <p className="mt-2 text-xs text-slate-400">
            Note: notes are saved when you Verify, Reject, or Cancel this ticket.
          </p>
        )}
      </div>

      <MessageThread ticketId={ticket.id} viewerRole="admin" />

      {ticket.status === "verified" && (
        <DigitalReceipt ticket={ticket} />
      )}

      {ticket.status === "verified" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 text-sm font-bold text-slate-900">Winner</h2>
          {ticket.isWinner ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-emerald-700">
                🏆 Marked as a winner{ticket.prize ? ` — ${ticket.prize}` : ""}.
              </p>
              <button
                onClick={() => act("unmark_winner")}
                disabled={busy}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 cursor-pointer"
              >
                Remove from Winners
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                placeholder="Prize (optional, e.g. 1st Prize — PKR 100,000)"
                className={fieldCls + " sm:w-80"}
              />
              <button
                onClick={() => act("mark_winner", { prize })}
                disabled={busy}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white cursor-pointer"
              >
                Mark as Winner
              </button>
            </div>
          )}
        </div>
      )}

      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction === "verify" ? "Verify this ticket?" : confirmAction === "reject" ? "Reject this ticket?" : "Cancel this ticket?"
          }
          body={
            confirmAction === "verify"
              ? "This will mark the ticket as Verified and generate a digital record. This action cannot be easily undone."
              : confirmAction === "reject"
              ? "This will mark the ticket as Rejected. The customer will be notified to contact the operator."
              : "This will cancel the ticket. It remains in the system for audit purposes."
          }
          confirmLabel={confirmAction === "verify" ? "Verify Ticket" : confirmAction === "reject" ? "Reject Ticket" : "Cancel Ticket"}
          danger={confirmAction !== "verify"}
          busy={busy}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => act(confirmAction, { adminNotes: notes })}
        />
      )}
    </div>
  );
}

const fieldCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 cursor-pointer">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-60 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {busy ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DigitalReceipt({ ticket }: { ticket: Ticket }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-sm font-bold text-slate-900">Digital Receipt</h2>
      <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-5 text-sm">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-amber-700">
          Akeel Akbar Lottery Management System
        </p>
        <div className="mt-4 space-y-1.5">
          <Row label="Reference ID" value={ticket.referenceId} />
          <Row label="Customer Name" value={ticket.customerName} />
          <Row label="Ticket Number" value={ticket.ticketNumber} />
          <Row label="Draw" value={ticket.drawName} />
          <Row label="Draw Date" value={ticket.drawDate} />
          <Row label="Amount" value={`PKR ${ticket.amount.toLocaleString()}`} />
          <Row label="Verification Status" value="Verified" />
          <Row label="Submission Date" value={new Date(ticket.submittedAt).toLocaleString()} />
          <Row label="Verification Date" value={ticket.verifiedAt ? new Date(ticket.verifiedAt).toLocaleString() : "—"} />
          <Row label="Authorized Operator" value={ticket.verifiedBy || "—"} />
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Digital record — subject to verification. This receipt is issued by the platform operator only and is not
          an official government document.
        </p>
      </div>
    </div>
  );
}
