"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const params = useSearchParams();
  const ref = params.get("ref") || "";
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(ref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Your ticket has been submitted successfully.</h1>
        <p className="mt-2 text-sm text-slate-500">Keep this reference ID safe — you&apos;ll need it to track your ticket status.</p>

        <div className="mt-6 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-500">Reference ID</p>
          <p className="mt-1 text-2xl font-bold tracking-wide text-amber-700">{ref || "—"}</p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={copy}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-amber-300 cursor-pointer"
          >
            {copied ? "Copied!" : "Copy Reference ID"}
          </button>
          <Link
            href={`/status?ref=${encodeURIComponent(ref)}`}
            className="flex-1 rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Check Status
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Your submission is now Pending Verification. An authorized operator will review it shortly.
        </p>
        <Link href="/" className="mt-4 inline-block text-xs font-medium text-amber-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}

export default function SubmitSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
