"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs text-white">BL</span>
              Balochistan Lottery Management System
            </div>
            <p className="text-sm text-slate-500">
              A digital record-management platform for submitting and tracking lottery ticket records.
              This system does not guarantee any winning outcome.
            </p>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-900">Quick Links</h4>
            <ul className="space-y-1 text-sm text-slate-500">
              <li><Link href="/submit" className="hover:text-blue-600">Submit Ticket</Link></li>
              <li><Link href="/status" className="hover:text-blue-600">Check Status</Link></li>
              <li><Link href="/about" className="hover:text-blue-600">About</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-900">Legal</h4>
            <ul className="space-y-1 text-sm text-slate-500">
              <li><Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-600">Terms &amp; Conditions</Link></li>
              <li><Link href="/admin/login" className="hover:text-blue-600">Admin Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-400">
          <p className="mb-1">
            Participation may be subject to applicable provincial regulations and age restrictions (18+ where applicable).
            This platform is a record-management tool only and does not itself conduct or officiate draws.
          </p>
          <p>© {new Date().getFullYear()} Balochistan Lottery Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
