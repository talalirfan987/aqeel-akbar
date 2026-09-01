import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const tickets = db.data!.tickets;
  const todayStr = new Date().toDateString();

  const stats = {
    total: tickets.length,
    pending: tickets.filter((t) => t.status === "pending").length,
    verified: tickets.filter((t) => t.status === "verified").length,
    rejected: tickets.filter((t) => t.status === "rejected").length,
    cancelled: tickets.filter((t) => t.status === "cancelled").length,
    today: tickets.filter((t) => new Date(t.submittedAt).toDateString() === todayStr).length,
    duplicates: tickets.filter((t) => t.isDuplicate).length,
    totalAmount: tickets.reduce((s, t) => s + t.amount, 0),
    verifiedAmount: tickets.filter((t) => t.status === "verified").reduce((s, t) => s + t.amount, 0),
  };

  return NextResponse.json({ stats });
}
