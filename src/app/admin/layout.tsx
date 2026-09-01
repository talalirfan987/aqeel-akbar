import Link from "next/link";
import { getSession } from "@/lib/auth";
import AdminLogoutButton from "@/components/AdminLogoutButton";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/tickets", label: "Tickets", icon: "🎟️" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/draws", label: "Draws", icon: "🎯" },
  { href: "/admin/reports", label: "Reports", icon: "📈" },
  { href: "/admin/notifications", label: "Notifications", icon: "🔔" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "🛡️" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    return <div className="min-h-screen bg-slate-900">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 p-4 md:flex">
        <Link href="/admin" className="mb-6 flex items-center gap-2 px-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold">BL</span>
          <span className="text-sm font-semibold leading-tight">
            Balochistan Lottery
            <span className="block text-[11px] font-normal text-slate-400">Admin Dashboard</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <span>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t border-slate-800 pt-4">
          <p className="mb-2 truncate px-1 text-xs text-slate-400">
            Signed in as <span className="font-semibold text-slate-200">{session.name}</span>
          </p>
          <AdminLogoutButton />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <Link href="/admin" className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs text-white">BL</span>
            Admin
          </Link>
          <AdminLogoutButton />
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 md:hidden">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
              {n.icon} {n.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
