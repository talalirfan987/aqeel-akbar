"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MessageThread from "@/components/MessageThread";
import StatusBadge from "@/components/StatusBadge";
import type { TicketStatus } from "@/lib/types";

interface Conversation {
  ticketId: string;
  referenceId: string;
  customerName: string;
  status: TicketStatus;
  lastMessage: { text: string; sender: "admin" | "customer"; timestamp: string };
  unread: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    const res = await fetch("/api/admin/conversations");
    const data = await res.json();
    if (res.ok) {
      setConversations(data.conversations);
      // Keep the selected conversation's preview in sync after sending/receiving.
      if (selected) {
        const updated = data.conversations.find((c: Conversation) => c.ticketId === selected.ticketId);
        if (updated) setSelected(updated);
      }
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = (conversations || []).filter((c) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return c.customerName.toLowerCase().includes(s) || c.referenceId.toLowerCase().includes(s);
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversation list */}
      <div className={`flex w-full max-w-sm flex-col rounded-2xl border border-slate-200 bg-white ${selected ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-slate-100 p-4">
          <h1 className="text-lg font-bold text-slate-900">Conversations</h1>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or reference…"
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations === null && <p className="p-4 text-sm text-slate-400">Loading…</p>}
          {conversations && filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-400">No conversations yet. They start once a customer or admin sends a message on a ticket.</p>
          )}
          {filtered.map((c) => (
            <button
              key={c.ticketId}
              onClick={() => setSelected(c)}
              className={`flex w-full items-start gap-3 border-b border-slate-50 p-3 text-left hover:bg-slate-50 cursor-pointer ${
                selected?.ticketId === c.ticketId ? "bg-amber-50" : ""
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-xs font-bold text-slate-900">
                {initials(c.customerName) || "?"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={`truncate text-sm ${c.unread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                    {c.customerName}
                  </p>
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {new Date(c.lastMessage.timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="truncate text-xs text-slate-400">{c.referenceId}</p>
                <p className={`mt-0.5 truncate text-xs ${c.unread ? "font-semibold text-slate-800" : "text-slate-500"}`}>
                  {c.lastMessage.sender === "admin" ? "You: " : ""}
                  {c.lastMessage.text}
                </p>
              </div>
              {c.unread && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* Active conversation */}
      <div className={`flex-1 flex-col rounded-2xl border border-slate-200 bg-white ${selected ? "flex" : "hidden md:flex"}`}>
        {!selected && (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            Select a conversation to start chatting.
          </div>
        )}
        {selected && (
          <div className="flex h-full flex-col p-4">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelected(null)} className="mr-1 text-slate-400 hover:text-slate-600 md:hidden cursor-pointer">
                  ←
                </button>
                <div>
                  <p className="text-sm font-bold text-slate-900">{selected.customerName}</p>
                  <Link href={`/admin/tickets/${selected.ticketId}`} className="text-xs text-amber-600 hover:underline">
                    {selected.referenceId} — view ticket
                  </Link>
                </div>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <div className="flex-1 overflow-hidden">
              <MessageThread ticketId={selected.ticketId} viewerRole="admin" bare />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
