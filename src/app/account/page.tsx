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

  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Tickets</h1>
            <p className="mt-1 text-sm text-slate-500">{name ? `Welcome back, ${name}.` : "Your submitted tickets."}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/submit"
              className="rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:from-amber-400 hover:to-amber-600"
            >
              + Submit New Ticket
            </Link>
            <button
              onClick={logout}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-red-300 hover:text-red-600 cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {loading && <p className="text-sm text-slate-400">Loading your tickets…</p>}

          {!loading && tickets.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
              You haven&apos;t submitted any tickets yet.
              <Link href="/submit" className="mt-2 block font-medium text-amber-700 hover:underline">
                Submit your first ticket →
              </Link>
            </div>
          )}

          {!loading &&
            tickets.map((t) => (
              <Link
                key={t.id}
                href={`/status?ref=${encodeURIComponent(t.referenceId)}`}
                className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-amber-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t.referenceId}</p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{t.drawName}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500">
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
