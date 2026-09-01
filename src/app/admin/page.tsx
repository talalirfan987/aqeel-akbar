"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import type { Ticket } from "@/lib/types";

interface Stats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  cancelled: number;
  today: number;
  duplicates: number;
  totalAmount: number;
  verifiedAmount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Ticket[]>([]);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then((d) => setStats(d.stats));
    fetch("/api/tickets").then((r) => r.json()).then((d) => setRecent((d.tickets || []).slice(0, 6)));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of all ticket submissions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Tickets" value={stats?.total ?? "—"} icon="🎟️" accent="blue" />
        <StatCard label="Pending Verification" value={stats?.pending ?? "—"} icon="⏳" accent="amber" />
        <StatCard label="Verified Tickets" value={stats?.verified ?? "—"} icon="✅" accent="emerald" />
        <StatCard label="Rejected Tickets" value={stats?.rejected ?? "—"} icon="❌" accent="red" />
        <StatCard label="Today's Submissions" value={stats?.today ?? "—"} icon="📅" accent="purple" />
        <StatCard label="Duplicate Tickets" value={stats?.duplicates ?? "—"} icon="⚠️" accent="slate" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Total Amount Recorded</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">PKR {(stats?.totalAmount ?? 0).toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-medium text-slate-500">Verified Amount</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">PKR {(stats?.verifiedAmount ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Submissions</h2>
          <Link href="/admin/tickets" className="text-xs font-medium text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                <th className="pb-2 font-medium">Reference ID</th>
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5">
                    <Link href={`/admin/tickets/${t.id}`} className="font-medium text-blue-600 hover:underline">
                      {t.referenceId}
                    </Link>
                  </td>
                  <td className="py-2.5 text-slate-700">{t.customerName}</td>
                  <td className="py-2.5 text-slate-700">PKR {t.amount.toLocaleString()}</td>
                  <td className="py-2.5">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
