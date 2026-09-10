"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { PAKISTAN_DIAL_CODE } from "@/lib/validation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleDemo() {
    setDemoLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/customer/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Demo login failed");
        setDemoLoading(false);
        return;
      }
      router.push(params.get("next") || "/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setDemoLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push(params.get("next") || "/account");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Luxury showroom backdrop image */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-top"
        style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/45" />

      <div className="relative w-full max-w-sm rounded-2xl border border-amber-400/20 bg-slate-950/35 p-8 shadow-[0_0_60px_rgba(217,161,58,0.08)]">
        <div className="mb-6 text-center">
          <Logo className="mx-auto mb-3 h-12 w-12 drop-shadow-[0_0_20px_rgba(217,161,58,0.35)]" />
          <h1 className="text-lg font-bold text-white">Sign In</h1>
          <p className="mt-1 text-xs text-amber-200/50">Track your submitted tickets in one place.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Mobile Number</label>
            <div className="flex items-stretch">
              <span className="flex items-center gap-1 rounded-l-xl border border-r-0 border-amber-400/30 bg-white/5 px-3 text-sm text-slate-300">
                {PAKISTAN_DIAL_CODE}
              </span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="auth-input w-full rounded-l-none rounded-r-xl border border-amber-400/30 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none focus:border-amber-400/60 focus:bg-white/10"
                placeholder="03001234567"
                inputMode="numeric"
                autoFocus
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input w-full rounded-xl border border-amber-400/30 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 outline-none focus:border-amber-400/60 focus:bg-white/10"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-xs font-medium text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-3 text-sm font-semibold text-slate-900 hover:from-amber-400 hover:to-amber-600 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-amber-400/15" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">or</span>
          <div className="h-px flex-1 bg-amber-400/15" />
        </div>
        <button
          type="button"
          onClick={handleDemo}
          disabled={demoLoading}
          className="mt-4 w-full rounded-xl border border-dashed border-amber-400/40 px-4 py-2.5 text-sm font-medium text-amber-300 hover:bg-amber-400/10 disabled:opacity-60 cursor-pointer"
        >
          {demoLoading ? "Loading demo…" : "Skip Login — View Demo"}
        </button>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/account/signup" className="font-medium text-amber-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function AccountLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
