"use client";

import { useEffect, useState } from "react";

interface Customer {
  name: string;
  phone: string;
  ticketCount: number;
  verifiedCount: number;
  totalAmount: number;
  lastSubmission: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500">Customer records derived from ticket submissions.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Tickets</th>
                <th className="px-4 py-3 font-medium">Verified</th>
                <th className="px-4 py-3 font-medium">Total Amount</th>
                <th className="px-4 py-3 font-medium">Last Submission</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Loading customers…</td></tr>
              )}
              {!loading && customers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No customers yet.</td></tr>
              )}
              {!loading &&
                customers.map((c) => (
                  <tr key={c.phone} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                    <td className="px-4 py-3 text-slate-600">{c.ticketCount}</td>
                    <td className="px-4 py-3 text-slate-600">{c.verifiedCount}</td>
                    <td className="px-4 py-3 text-slate-600">PKR {c.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500">{new Date(c.lastSubmission).toLocaleDateString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
