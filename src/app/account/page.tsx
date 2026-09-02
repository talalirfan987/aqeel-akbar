"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { Ticket } from "@/lib/types";

export default function AccountPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/customer/me")
      .then((r) => r.json())
      .then((d) => setName(d.customer?.name || ""));
    fetch("/api/customer/tickets")
      .then((r) => r.json())
      .then((d) => setTickets(d.tickets || []))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch("/api/auth/customer/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("")
    : "BL";

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === "pending").length,
    verified: tickets.filter((t) => t.status === "verified").length,
  };

  return (
    <main className="flex-1 bg-slate-950">
      {/* Profile header banner */}
      <div className="relative overflow-hidden border-b border-amber-400/10 bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 text-lg font-bold text-slate-900 shadow-[0_0_20px_rgba(217,161,58,0.35)]">
                {initials}
              </span>
              <div>
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  {name ? `Welcome back, ${name}` : "My Tickets"}
                </h1>
                <p className="mt-1 text-sm text-amber-200/50">Track and manage your submitted tickets.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/submit"
                className="rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-600"
              >
                + Submit New Ticket
              </Link>
              <button
                onClick={logout}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:border-red-400/50 hover:text-red-400 cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: "Total Tickets", value: stats.total },
              { label: "Pending", value: stats.pending },
              { label: "Verified", value: stats.verified },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-amber-400/10 bg-white/5 px-4 py-3 text-center backdrop-blur"
              >
                <p className="text-xl font-bold text-amber-300 sm:text-2xl">{s.value}</p>
                <p className="mt-0.5 text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket list */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="space-y-3">
          {loading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
              ))}
            </div>
          )}

          {!loading && tickets.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-14 text-center">
              <p className="text-sm text-slate-400">You haven&apos;t submitted any tickets yet.</p>
              <Link
                href="/submit"
                className="mt-3 inline-block rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:from-amber-400 hover:to-amber-600"
              >
                Submit your first ticket →
              </Link>
            </div>
          )}

          {!loading &&
            tickets.map((t) => (
              <Link
                key={t.id}
                href={`/account/tickets/${t.id}`}
                className="block rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm transition-colors hover:border-amber-400/40 hover:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-400/70">{t.referenceId}</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{t.drawName}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-400">
                  <span>Amount: PKR {t.amount.toLocaleString()}</span>
                  <span>Tickets: {t.quantity}</span>
                  <span>Submitted: {new Date(t.submittedAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </main>
  );
}
