import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Lightweight endpoint with no auth and no heavy payload — its only job is to
// touch the database. Neon's free tier suspends its compute after a few
// minutes of inactivity, and the first query after that wakes it back up,
// which can take several seconds (see AGENTS.md / db.ts for the pooler note).
// Pinging this route every few minutes from an external cron (e.g.
// cron-job.org) keeps the compute warm so real users never eat that cold-start
// delay. Vercel Cron isn't used here because the Hobby plan's minimum cron
// interval (once/day) is too infrequent to prevent Neon's ~5 minute autosuspend.
export async function GET() {
  const start = Date.now();
  await getDb();
  return NextResponse.json({ ok: true, ms: Date.now() - start });
}
