"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  sender: "admin" | "customer";
  senderName: string;
  text: string;
  timestamp: string;
}

export default function MessageThread({
  ticketId,
  viewerRole,
  theme = "light",
  bare = false,
}: {
  ticketId: string;
  viewerRole: "admin" | "customer";
  theme?: "light" | "dark";
  /** Fill the parent's height with no card border/heading — for embedding in a chat-app-style layout. */
  bare?: boolean;
}) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/tickets/${ticketId}/messages`);
    const data = await res.json();
    if (res.ok) setMessages(data.messages);
  }

  useEffect(() => {
    load();
    // Poll for new messages so a live conversation feels like a real chat app.
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError("");
    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), senderRole: viewerRole }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setError(data.error || "Failed to send message");
      return;
    }
    setText("");
    load();
  }

  const dark = theme === "dark";

  return (
    <div
      className={
        bare
          ? "flex h-full flex-col"
          : `rounded-2xl border p-4 ${dark ? "border-amber-400/20 bg-white/5" : "border-slate-200 bg-white"}`
      }
    >
      {!bare && <h2 className={`mb-3 text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>Messages</h2>}

      <div
        className={`space-y-2 overflow-y-auto rounded-xl p-3 ${bare ? "flex-1" : "max-h-80"} ${
          dark ? "bg-black/20" : "bg-slate-50"
        }`}
      >
        {messages === null && <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-400"}`}>Loading…</p>}
        {messages && messages.length === 0 && (
          <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-400"}`}>
            No messages yet. {viewerRole === "customer" ? "Send a message if you have a question." : "Waiting on the customer."}
          </p>
        )}
        {messages?.map((m) => {
          const mine = m.sender === viewerRole;
          const isAdmin = m.sender === "admin";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                  isAdmin
                    ? "bg-orange-500 text-white font-medium"
                    : "bg-black text-white border border-zinc-800 font-medium"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className="mt-1 text-[10px] text-white/70 font-normal">
                  {isAdmin ? "Admin / Operator" : m.senderName} ·{" "}
                  {new Date(m.timestamp).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none ${
            dark
              ? "border-amber-400/30 bg-white/5 text-white placeholder:text-slate-400 focus:border-amber-400/60"
              : "border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          }`}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white cursor-pointer disabled:opacity-60"
        >
          Send
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
