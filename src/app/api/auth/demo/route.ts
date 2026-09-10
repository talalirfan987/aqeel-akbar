import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";

// One-click demo login for reviewers — signs in as the seeded admin account with no
// username/password required. Disabled outside development so this can never become
// a real authentication bypass if the app is ever deployed.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Demo login is only available in development" }, { status: 403 });
  }

  const db = await getDb();
  const admin = db.data!.admins.find((a) => a.username === "admin") || db.data!.admins[0];
  if (!admin) return NextResponse.json({ error: "No admin account found to demo" }, { status: 404 });

  await createSession({ username: admin.username, name: admin.name, role: admin.role });
  return NextResponse.json({ ok: true, name: admin.name });
}
