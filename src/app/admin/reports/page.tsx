"use client";

import { useEffect, useState } from "react";

const reportTypes = [
  { value: "daily", label: "Daily Report" },
  { value: "weekly", label: "Weekly Report" },
  { value: "monthly", label: "Monthly Report" },
  { value: "draw", label: "Draw-wise Report" },
  { value: "verified_rejected", label: "Verified vs Rejected" },
  { value: "duplicate", label: "Duplicate Ticket Report" },
];

interface Row {
  label: string;
  summary: {
    total: number;
    totalAmount: number;
    verified: number;
    pending: number;
    rejected: number;
    cancelled: number;
    duplicates: number;
  };
}

export default function ReportsPage() {
  const [type, setType] = useState("daily");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports?type=${type}`)
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500">Generate summary reports across ticket submissions.</p>
        </div>
        <a href="/api/tickets/export" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600">
          ⬇ Export All Tickets (CSV)
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        {reportTypes.map((r) => (
          <button
            key={r.value}
            onClick={() => setType(r.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold cursor-pointer ${
              type === r.value ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading && <p className="text-sm text-slate-400">Generating report…</p>}
        {!loading && rows.length === 0 && <p className="text-sm text-slate-400">No data available for this report.</p>}
        {!loading &&
          rows.map((row) => (
            <div key={row.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="mb-4 text-sm font-bold text-slate-900">{row.label}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="Total Tickets" value={row.summary.total} />
                <Metric label="Total Amount" value={`PKR ${row.summary.totalAmount.toLocaleString()}`} />
                <Metric label="Verified" value={row.summary.verified} accent="text-emerald-600" />
                <Metric label="Pending" value={row.summary.pending} accent="text-amber-600" />
                <Metric label="Rejected" value={row.summary.rejected} accent="text-red-600" />
                <Metric label="Cancelled" value={row.summary.cancelled} accent="text-slate-500" />
                <Metric label="Duplicates" value={row.summary.duplicates} accent="text-purple-600" />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${accent || "text-slate-900"}`}>{value}</p>
    </div>
  );
}
