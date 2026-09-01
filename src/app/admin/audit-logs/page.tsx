"use client";

import { useEffect, useState } from "react";
import type { AuditLog } from "@/lib/types";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/audit-logs").then((r) => r.json()).then((d) => setLogs(d.logs || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500">A complete, immutable history of every admin action.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Status Change</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Loading logs…</td></tr>}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No audit activity yet.</td></tr>
              )}
              {!loading &&
                logs.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{l.adminUsername}</td>
                    <td className="px-4 py-3 text-slate-700">{l.action}{l.details ? ` — ${l.details}` : ""}</td>
                    <td className="px-4 py-3 text-blue-600">{l.referenceId || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {l.previousStatus && l.newStatus && l.previousStatus !== l.newStatus
                        ? `${l.previousStatus} → ${l.newStatus}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(l.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
