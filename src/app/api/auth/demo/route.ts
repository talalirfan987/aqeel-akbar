import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";

// One-click demo login for reviewers — signs in as the seeded admin account with no
// username/password required. Enabled in production at the owner's explicit request;
// this is a real authentication bypass on this deployment, not gated by anything.
export async function POST() {
  const db = await getDb();
  const admin = db.data!.admins.find((a) => a.username === "admin") || db.data!.admins[0];
  if (!admin) return NextResponse.json({ error: "No admin account found to demo" }, { status: 404 });

  await createSession({ username: admin.username, name: admin.name, role: admin.role });
  return NextResponse.json({ ok: true, name: admin.name });
}
