"use client";

import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <main className="flex-1 bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Contact Us</h1>
        <p className="mt-1 text-sm text-slate-500">Have a question about your submission? Reach out to the operator.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase text-slate-400">Support Phone</p>
            <p className="mt-1 text-sm font-medium text-slate-900">+92 300 0000000</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase text-slate-400">Support Email</p>
            <p className="mt-1 text-sm font-medium text-slate-900">support@blm-system.example</p>
          </div>
        </div>

        {sent ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
            Thank you — your message has been noted. Our team will get back to you soon.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
              <input required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Reference ID (optional)</label>
              <input className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Message</label>
              <textarea required rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none" />
            </div>
            <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
              Send Message
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
