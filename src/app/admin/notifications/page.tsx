"use client";

import { useEffect, useState } from "react";
import type { Notification } from "@/lib/types";

const typeStyles: Record<string, string> = {
  submitted: "bg-amber-50 text-amber-600",
  verified: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-600",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => setItems(d.notifications || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500">
          System-generated notifications sent to customers. WhatsApp/SMS delivery can be connected here later.
        </p>
      </div>

      <div className="space-y-2">
        {loading && <p className="text-sm text-slate-400">Loading notifications…</p>}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
            No notifications yet.
          </div>
        )}
        {!loading &&
          items.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <span className={`mt-0.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${typeStyles[n.type]}`}>
                {n.type}
              </span>
              <div className="flex-1">
                <p className="text-sm text-slate-800">{n.message}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {n.referenceId} · {new Date(n.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
