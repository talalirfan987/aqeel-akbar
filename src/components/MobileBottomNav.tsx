"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/submit", label: "Submit", icon: "🎟️" },
  { href: "/status", label: "Track", icon: "🔎" },
  { href: "/winners", label: "Winners", icon: "🏆" },
  { href: "/account", label: "Account", icon: "👤" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on admin routes or auth pages
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/account/login") || pathname?.startsWith("/account/signup")) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-500/20 bg-slate-950/95 p-1.5 backdrop-blur-lg md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-all ${
                active
                  ? "bg-amber-500/15 text-amber-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="mt-1 text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
