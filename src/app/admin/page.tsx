"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import type { AuditLog, Ticket } from "@/lib/types";

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

function activityIcon(action: string) {
  const a = action.toLowerCase();
  if (a.includes("verified") || a.includes("winner")) return "✅";
  if (a.includes("rejected")) return "❌";
  if (a.includes("cancelled")) return "🚫";
  if (a.includes("duplicate")) return "⚠️";
  if (a.includes("edited") || a.includes("cleared")) return "✏️";
  return "📝";
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Ticket[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const now = useClock();

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then((d) => setStats(d.stats));
    fetch("/api/tickets").then((r) => r.json()).then((d) => setRecent((d.tickets || []).slice(0, 6)));
    fetch("/api/audit-logs").then((r) => r.json()).then((d) => setActivity((d.logs || []).slice(0, 8)));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-slate-900 to-slate-950 px-5 py-4 text-white shadow-sm">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-amber-200/60">Everything happening across Akeel Akbar Lottery, at a glance.</p>
        </div>
        {now && (
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums text-amber-300">
              {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-xs text-amber-200/50">
              {now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Tickets" value={stats?.total ?? "—"} icon="🎟️" accent="gold" />
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
          <Link href="/admin/tickets" className="text-xs font-medium text-amber-600 hover:underline">
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
                <th className="pb-2 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-2.5">
                    <Link href={`/admin/tickets/${t.id}`} className="font-medium text-amber-600 hover:underline">
                      {t.referenceId}
                    </Link>
                  </td>
                  <td className="py-2.5 text-slate-700">{t.customerName}</td>
                  <td className="py-2.5 text-slate-700">PKR {t.amount.toLocaleString()}</td>
                  <td className="py-2.5">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-2.5 whitespace-nowrap text-xs text-slate-500">
                    {new Date(t.submittedAt).toLocaleString(undefined, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No submissions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
          <Link href="/admin/audit-logs" className="text-xs font-medium text-amber-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {activity.map((log) => (
            <div key={log.id} className="flex items-start gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm">
                {activityIcon(log.action)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-800">{log.action}</p>
                {log.details && <p className="truncate text-xs text-slate-400">{log.details}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="whitespace-nowrap text-xs font-medium text-slate-500">
                  {new Date(log.timestamp).toLocaleString(undefined, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-[11px] text-slate-400">{log.adminUsername}</p>
              </div>
            </div>
          ))}
          {activity.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No activity recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
