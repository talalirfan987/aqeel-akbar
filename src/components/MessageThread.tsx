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
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef<number>(-1);

  async function load() {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/messages`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        if (data.messages.length !== lastCountRef.current) {
          lastCountRef.current = data.messages.length;
          setMessages(data.messages);
          // Only scroll the inner messages div, never the page window
          if (bare && containerRef.current) {
            setTimeout(() => {
              if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
              }
            }, 50);
          }
        }
      }
    } catch {
      // Ignore polling errors
    }
  }

  useEffect(() => {
    lastCountRef.current = -1;
    load();
    // Poll for new messages
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

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
    await load();
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }

  const dark = theme === "dark";

  return (
    <div
      className={
        bare
          ? "flex h-full flex-col"
          : `rounded-2xl border p-4 ${dark ? "border-amber-400/20 bg-white/5" : "border-slate-200 bg-white shadow-xs"}`
      }
    >
      {!bare && <h2 className={`mb-3 text-sm font-bold ${dark ? "text-white" : "text-slate-900"}`}>Customer Messages</h2>}

      <div
        ref={containerRef}
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
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-xs ${
                  mine
                    ? "bg-amber-600 text-white rounded-br-xs"
                    : dark
                    ? "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-xs"
                    : "bg-white text-slate-800 border border-slate-200 shadow-xs rounded-bl-xs"
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                <div
                  className={`mt-1 flex items-center gap-1.5 text-[10px] ${
                    mine ? "text-amber-200/80 justify-end" : "text-slate-400"
                  }`}
                >
                  <span className="font-medium">
                    {mine ? "You" : isAdmin ? "Admin / Operator" : m.senderName}
                  </span>
                  <span>·</span>
                  <span>
                    {new Date(m.timestamp).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className={`flex-1 rounded-xl border px-3 py-2 text-xs sm:text-sm outline-none ${
            dark
              ? "border-amber-400/30 bg-white/5 text-white placeholder:text-slate-400 focus:border-amber-400/60"
              : "border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
          }`}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="shrink-0 rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white cursor-pointer disabled:opacity-60 hover:bg-amber-700 transition"
        >
          Send
        </button>
      </form>
      {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
