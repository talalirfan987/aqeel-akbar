"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import MessageThread from "@/components/MessageThread";
import type { Ticket } from "@/lib/types";

function isImageReceipt(ticketImage: string, ticketImageName?: string) {
  if (ticketImage.startsWith("data:image")) return true;
  if (ticketImage.startsWith("data:")) return false;
  if (ticketImage.startsWith("/api/tickets/")) return true;
  if (ticketImage.endsWith(".pdf") || (ticketImageName && ticketImageName.endsWith(".pdf"))) return false;
  return /\.(jpe?g|png|gif|webp)$/i.test(ticketImageName || ticketImage) || ticketImage.startsWith("/uploads/");
}

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "verify" | "reject" | "cancel" | "pending">(null);
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

  async function saveNotes() {
    setBusy(true);
    const res = await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_notes", adminNotes: notes }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setTicket(data.ticket);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } else {
      setError(data.error || "Failed to save notes");
    }
  }

  function copyReferenceId() {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.referenceId);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center py-20 text-slate-400">
        <div className="flex items-center gap-3 text-sm">
          <svg className="h-5 w-5 animate-spin text-amber-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading ticket details…
        </div>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">{error}</p>
          <Link href="/admin/tickets" className="mt-4 inline-block text-xs font-semibold text-red-800 underline">
            ← Back to Tickets
          </Link>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link href="/admin/tickets" className="text-amber-600 hover:text-amber-700 hover:underline">
              Tickets
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-700">{ticket.referenceId}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              {ticket.referenceId}
            </h1>
            <button
              onClick={copyReferenceId}
              title="Copy Reference ID"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-xs hover:bg-slate-50 cursor-pointer"
            >
              {copiedRef ? (
                <span className="text-emerald-600 font-semibold">✓ Copied</span>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
            <StatusBadge status={ticket.status} />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-xs font-bold text-amber-900 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {ticket.quantity || 1} Ticket{(ticket.quantity || 1) > 1 ? "s" : ""}
            </span>
            {ticket.isWinner && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 shadow-xs">
                🏆 Winner
              </span>
            )}
            {ticket.isDuplicate && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                ⚠️ Duplicate Flag
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-500">
            Submitted on {new Date(ticket.submittedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} at{" "}
            {new Date(ticket.submittedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            {ticket.verifiedBy && (
              <> · Verified by <span className="font-medium text-slate-700">{ticket.verifiedBy}</span></>
            )}
          </p>
        </div>

        {/* Top Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
            >
              <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Details
            </button>
          )}
          {ticket.status !== "verified" && (
            <button
              onClick={() => setConfirmAction("verify")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Verify Ticket
            </button>
          )}
          {ticket.status !== "rejected" && (
            <button
              onClick={() => setConfirmAction("reject")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-red-700 cursor-pointer disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          )}
        </div>
      </div>

      {/* Duplicate Warning Alert */}
      {ticket.isDuplicate && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 shadow-xs">
          <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 text-sm">
            <h4 className="font-bold text-amber-950">Possible Duplicate Ticket Number</h4>
            <p className="mt-0.5 text-amber-800">
              Ticket number <strong className="font-mono font-semibold">{ticket.ticketNumber}</strong> already exists on another record
              {duplicateOf ? ` (Ref: ${duplicateOf.referenceId}, status: ${duplicateOf.status})` : ""}. Please cross-check the receipt carefully before verifying.
            </p>
            <button
              onClick={() => act("unmark_duplicate")}
              disabled={busy}
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
            >
              Clear duplicate flag
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main 2-Column Responsive Dashboard Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Ticket Data, Proof Image, Digital Receipt (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Card: Customer & Ticket Information */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-slate-900">Ticket & Customer Details</h2>
              </div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
                >
                  Edit Info
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => act("edit", edit)}
                    disabled={busy}
                    className="rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Customer Name</label>
                      <input
                        className={fieldCls}
                        value={edit.customerName}
                        onChange={(e) => setEdit((s) => ({ ...s, customerName: e.target.value }))}
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Phone Number</label>
                      <input
                        className={fieldCls}
                        value={edit.phone}
                        onChange={(e) => setEdit((s) => ({ ...s, phone: e.target.value }))}
                        placeholder="03001234567"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Ticket Number</label>
                      <input
                        className={fieldCls}
                        value={edit.ticketNumber}
                        onChange={(e) => setEdit((s) => ({ ...s, ticketNumber: e.target.value }))}
                        placeholder="Ticket Number"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600">Amount (PKR)</label>
                      <input
                        type="number"
                        className={fieldCls}
                        value={edit.amount}
                        onChange={(e) => setEdit((s) => ({ ...s, amount: e.target.value }))}
                        placeholder="Amount"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Customer Info Section */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Information</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-700">
                          {ticket.customerName ? ticket.customerName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400">Primary Contact</p>
                          <p className="truncate font-semibold text-slate-900">{ticket.customerName || "—"}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400">Mobile / WhatsApp</p>
                          <p className="font-mono font-semibold text-slate-900">{ticket.phone || "—"}</p>
                        </div>
                        {ticket.phone && (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${ticket.phone}`}
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-amber-600 shadow-xs"
                              title="Call"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </a>
                            <a
                              href={`https://wa.me/92${ticket.phone.replace(/^0/, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-emerald-600 hover:bg-emerald-50 shadow-xs"
                              title="WhatsApp"
                            >
                              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                              </svg>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <p className="text-xs text-slate-400">City</p>
                        <p className="mt-0.5 font-semibold text-slate-800">{ticket.city || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <p className="text-xs text-slate-400">CNIC / ID</p>
                        <p className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{ticket.cnic || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <p className="text-xs text-slate-400">Payment Method</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 capitalize">
                            {ticket.paymentMethod === "jazzcash" ? "JazzCash" : ticket.paymentMethod === "easypaisa" ? "EasyPaisa" : ticket.paymentMethod || "—"}
                          </span>
                          {ticket.paymentConfirmed && (
                            <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                              ✓ Paid
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  {/* Ticket Details Section */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Lottery & Ticket Details</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5">
                        <p className="text-xs font-medium text-amber-800">Assigned Ticket Number</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="font-mono text-xl font-extrabold tracking-wider text-amber-950">
                            {ticket.ticketNumber}
                          </span>
                          <span className="rounded-lg bg-amber-200/60 px-2 py-0.5 text-xs font-semibold text-amber-900">
                            {ticket.quantity || 1} Ticket{(ticket.quantity || 1) > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                        <p className="text-xs text-slate-400">Total Amount</p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          PKR {ticket.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <p className="text-xs text-slate-400">Draw Name</p>
                        <p className="mt-0.5 font-medium text-slate-800">{ticket.drawName}</p>
                      </div>
                      <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                        <p className="text-xs text-slate-400">Draw Date</p>
                        <p className="mt-0.5 font-semibold text-slate-800">{ticket.drawDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Split Ticket Holders (if any) */}
                  {ticket.holders && ticket.holders.length > 0 && (
                    <>
                      <hr className="border-slate-100" />
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Split Ticket Holders ({ticket.holders.length})
                          </h3>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {ticket.holders.map((h, i) => (
                            <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-2.5 shadow-2xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                                  {i + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-bold text-slate-900">{h.name}</p>
                                  <p className="font-mono text-[11px] text-slate-500">{h.phone}</p>
                                </div>
                              </div>
                              <span className="shrink-0 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200/50">
                                {h.quantity} ticket{h.quantity === 1 ? "" : "s"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card: Uploaded Receipt / Image Proof */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 p-1.5 text-blue-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Uploaded Receipt / Payment Proof</h2>
                  {ticket.ticketImageName && (
                    <p className="text-[11px] text-slate-400 truncate max-w-xs">{ticket.ticketImageName}</p>
                  )}
                </div>
              </div>

              {ticket.ticketImage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
                  >
                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    Full Preview
                  </button>
                  <a
                    href={ticket.ticketImage}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 cursor-pointer"
                  >
                    <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Open
                  </a>
                </div>
              )}
            </div>

            <div className="p-6">
              {ticket.ticketImage ? (
                isImageReceipt(ticket.ticketImage, ticket.ticketImageName) ? (
                  <div
                    onClick={() => setLightboxOpen(true)}
                    className="group relative flex max-h-96 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5 cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ticket.ticketImage}
                      alt="Ticket receipt"
                      className="max-h-96 w-auto max-w-full rounded-xl object-contain transition group-hover:scale-101"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                      <span className="rounded-lg bg-black/70 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-sm transition group-hover:opacity-100 flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Click to Zoom
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-8 text-center bg-slate-50/50">
                    <div className="rounded-xl bg-red-100 p-3 text-red-600">
                      <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-800">{ticket.ticketImageName || "PDF Document Attached"}</p>
                    <p className="text-xs text-slate-400">PDF receipt uploaded by customer.</p>
                    <a
                      href={ticket.ticketImage}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700"
                    >
                      Open PDF in New Window →
                    </a>
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
                  No proof image attached to this ticket.
                </div>
              )}
            </div>
          </div>

          {/* Card: Digital Receipt (Only when verified) */}
          {ticket.status === "verified" && (
            <DigitalReceipt ticket={ticket} />
          )}
        </div>

        {/* RIGHT COLUMN: Status & Quick Actions, Winner, Notes, Chat (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Card 1: Ticket Status & Actions */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">Manage Status & Actions</h2>
            </div>

            <div className="p-5 space-y-4">
              {/* Current Status Banner */}
              <div
                className={`rounded-xl border p-3.5 ${
                  ticket.status === "verified"
                    ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                    : ticket.status === "rejected"
                    ? "border-red-200 bg-red-50/80 text-red-900"
                    : ticket.status === "cancelled"
                    ? "border-slate-200 bg-slate-100 text-slate-800"
                    : "border-amber-200 bg-amber-50/80 text-amber-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider">Current State</span>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-1 text-xs leading-relaxed">
                  {ticket.status === "verified"
                    ? "This ticket has been officially verified and entered into the draw."
                    : ticket.status === "rejected"
                    ? "This ticket has been rejected. Customer has been asked to contact operator."
                    : ticket.status === "cancelled"
                    ? "This ticket is cancelled and will not participate in the draw."
                    : "This ticket is pending verification. Please review proof and details."}
                </p>
              </div>

              {/* Primary Action Buttons */}
              <div className="space-y-2">
                {ticket.status !== "verified" && (
                  <button
                    onClick={() => setConfirmAction("verify")}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 cursor-pointer disabled:opacity-50 transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    {ticket.status === "rejected" || ticket.status === "cancelled" ? "Verify / Re-Verify Ticket" : "Verify Ticket"}
                  </button>
                )}

                {ticket.status !== "rejected" && (
                  <button
                    onClick={() => setConfirmAction("reject")}
                    disabled={busy}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-red-700 cursor-pointer disabled:opacity-50 transition"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject Ticket
                  </button>
                )}
              </div>

              {/* Secondary Actions Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {ticket.status !== "cancelled" && (
                  <button
                    onClick={() => setConfirmAction("cancel")}
                    disabled={busy}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    Cancel Ticket
                  </button>
                )}

                {ticket.status !== "pending" && (
                  <button
                    onClick={() => setConfirmAction("pending")}
                    disabled={busy}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    Reset to Pending
                  </button>
                )}

                {!ticket.isDuplicate ? (
                  <button
                    onClick={() => act("mark_duplicate")}
                    disabled={busy}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    Flag Duplicate
                  </button>
                ) : (
                  <button
                    onClick={() => act("unmark_duplicate")}
                    disabled={busy}
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    Clear Duplicate
                  </button>
                )}

                <button
                  onClick={() => setEditing(true)}
                  disabled={busy}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  Edit Info
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Winner & Prize Management (when verified) */}
          {ticket.status === "verified" && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏆</span>
                  <h2 className="text-sm font-bold text-slate-900">Winner Declaration</h2>
                </div>
              </div>

              <div className="p-5">
                {ticket.isWinner ? (
                  <div className="rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-extrabold text-amber-900">
                          PRIZE WINNER
                        </span>
                        <p className="mt-1.5 font-bold text-amber-950 text-sm">
                          {ticket.prize || "Official Draw Winner"}
                        </p>
                      </div>
                      <button
                        onClick={() => act("unmark_winner")}
                        disabled={busy}
                        className="rounded-lg border border-amber-300/80 bg-white/80 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer shadow-2xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500">
                      Mark this ticket as a winner and specify the prize title.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={prize}
                        onChange={(e) => setPrize(e.target.value)}
                        placeholder="e.g. 1st Prize — PKR 100,000"
                        className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200"
                      />
                      <button
                        onClick={() => act("mark_winner", { prize })}
                        disabled={busy}
                        className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        Mark as Winner
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Card 3: Internal Admin Notes */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3.5">
              <h2 className="text-sm font-bold text-slate-900">Internal Admin Notes</h2>
              {notesSaved && (
                <span className="text-xs font-semibold text-emerald-600 animate-fade-in">
                  ✓ Notes Saved
                </span>
              )}
            </div>

            <div className="p-5 space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Internal notes (visible to admins only, except on rejection)…"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Notes are also saved when changing status.
                </span>
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={busy}
                  className="rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save Note"}
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Customer Live Messages */}
          <MessageThread ticketId={ticket.id} viewerRole="admin" />
        </div>
      </div>

      {/* Full Size Image Lightbox Modal */}
      {lightboxOpen && ticket.ticketImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticket.ticketImage}
              alt="Full size ticket receipt"
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            />
            <div className="mt-2 text-center text-xs text-slate-300">
              {ticket.ticketImageName || ticket.referenceId} ·{" "}
              <a
                href={ticket.ticketImage}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 underline hover:text-amber-300"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmAction && (
        <ConfirmDialog
          title={
            confirmAction === "verify"
              ? "Verify this ticket?"
              : confirmAction === "reject"
              ? "Reject this ticket?"
              : confirmAction === "pending"
              ? "Reset ticket to Pending?"
              : "Cancel this ticket?"
          }
          body={
            confirmAction === "verify"
              ? "This will mark the ticket as Verified and issue the official digital record. You can change this status later if needed."
              : confirmAction === "reject"
              ? "This will mark the ticket as Rejected. The customer will be informed. You can re-verify it later if needed."
              : confirmAction === "pending"
              ? "This will reset the ticket back to Pending review status."
              : "This will cancel the ticket. It remains in the system for audit purposes. You can re-verify or reject it later if needed."
          }
          confirmLabel={
            confirmAction === "verify"
              ? "Verify Ticket"
              : confirmAction === "reject"
              ? "Reject Ticket"
              : confirmAction === "pending"
              ? "Reset to Pending"
              : "Cancel Ticket"
          }
          danger={confirmAction === "reject" || confirmAction === "cancel"}
          busy={busy}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => act(confirmAction, { adminNotes: notes })}
        />
      )}
    </div>
  );
}

const fieldCls = "w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer disabled:opacity-60 ${
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
    <div className="overflow-hidden rounded-2xl border border-amber-300/70 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/20 p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-amber-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-xs">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-wide text-amber-950 uppercase">
              Official Digital Lottery Certificate
            </h3>
            <p className="text-[11px] font-medium text-amber-700">Verified & Authenticated Record</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-50 cursor-pointer"
        >
          <svg className="h-3.5 w-3.5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Receipt
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 text-xs">
        <div className="flex justify-between border-b border-amber-100 py-1.5">
          <span className="text-slate-500">Reference ID</span>
          <span className="font-mono font-bold text-slate-900">{ticket.referenceId}</span>
        </div>
        <div className="flex justify-between border-b border-amber-100 py-1.5">
          <span className="text-slate-500">Customer Name</span>
          <span className="font-semibold text-slate-900">{ticket.customerName}</span>
        </div>
        <div className="flex justify-between border-b border-amber-100 py-1.5">
          <span className="text-slate-500">Ticket Number</span>
          <span className="font-mono font-bold text-amber-900 bg-amber-100/70 px-1.5 py-0.5 rounded">
            {ticket.ticketNumber}
          </span>
        </div>
        <div className="flex justify-between border-b border-amber-100 py-1.5">
          <span className="text-slate-500">Number of Tickets</span>
          <span className="font-bold text-amber-950 bg-amber-100/80 px-2 py-0.5 rounded-md">
            {ticket.quantity || 1} Ticket{(ticket.quantity || 1) > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex justify-between border-b border-amber-100 py-1.5">
          <span className="text-slate-500">Total Amount</span>
          <span className="font-bold text-slate-900">PKR {ticket.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-b border-amber-100 py-1.5">
          <span className="text-slate-500">Draw Name</span>
          <span className="font-medium text-slate-900">{ticket.drawName}</span>
        </div>
        <div className="flex justify-between border-b border-amber-100 py-1.5">
          <span className="text-slate-500">Draw Date</span>
          <span className="font-semibold text-slate-900">{ticket.drawDate}</span>
        </div>
        <div className="flex justify-between border-b border-amber-100 py-1.5">
          <span className="text-slate-500">Verified Date</span>
          <span className="font-semibold text-slate-900">
            {ticket.verifiedAt ? new Date(ticket.verifiedAt).toLocaleString() : "—"}
          </span>
        </div>
        <div className="flex justify-between border-b border-amber-100 py-1.5">
          <span className="text-slate-500">Authorized Operator</span>
          <span className="font-bold text-emerald-700">{ticket.verifiedBy || "Administrator"}</span>
        </div>
      </div>

      {ticket.holders && ticket.holders.length > 0 && (
        <div className="mt-4 border-t border-amber-200/60 pt-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
            Registered Ticket Holders ({ticket.holders.length})
          </p>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {ticket.holders.map((h, i) => (
              <div key={i} className="flex justify-between rounded-lg bg-amber-50/70 px-2.5 py-1 text-xs">
                <span className="font-medium text-slate-800">{h.name}</span>
                <span className="text-slate-500">{h.phone} ({h.quantity} ticket)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-amber-200/50 bg-amber-100/30 p-3 text-center text-[10px] text-amber-800 leading-relaxed">
        Digital record issued by Lucky Lottery Management System. This verification is authentic and recorded in the audit ledger.
      </div>
    </div>
  );
}
