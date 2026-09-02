"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="mt-auto border-t border-amber-500/10 bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="mb-2 flex items-center gap-2 font-semibold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 text-xs text-slate-900">
                BL
              </span>
              Balochistan Lottery Management System
            </div>
            <p className="text-sm text-slate-400">
              A digital record-management platform for submitting and tracking lottery ticket records.
              This system does not guarantee any winning outcome.
            </p>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-white">Quick Links</h4>
            <ul className="space-y-1 text-sm text-slate-400">
              <li><Link href="/submit" className="hover:text-amber-400">Submit Ticket</Link></li>
              <li><Link href="/status" className="hover:text-amber-400">Check Status</Link></li>
              <li><Link href="/about" className="hover:text-amber-400">About</Link></li>
              <li><Link href="/contact" className="hover:text-amber-400">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-1 text-sm text-slate-400">
              <li><Link href="/privacy" className="hover:text-amber-400">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-amber-400">Terms &amp; Conditions</Link></li>
              <li><Link href="/admin/login" className="hover:text-amber-400">Admin Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-amber-500/10 pt-6 text-xs text-slate-500">
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
