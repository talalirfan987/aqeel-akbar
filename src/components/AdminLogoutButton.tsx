"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
      className="w-full rounded-xl border border-slate-700 px-3 py-2 text-left text-sm font-medium text-slate-300 hover:border-red-500 hover:text-red-400 cursor-pointer"
    >
      Log Out
    </button>
  );
}
