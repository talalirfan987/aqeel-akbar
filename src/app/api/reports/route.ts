import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Ticket } from "@/lib/types";

function summarize(list: Ticket[]) {
  return {
    total: list.length,
    totalAmount: list.reduce((s, t) => s + t.amount, 0),
    verified: list.filter((t) => t.status === "verified").length,
    pending: list.filter((t) => t.status === "pending").length,
    rejected: list.filter((t) => t.status === "rejected").length,
    cancelled: list.filter((t) => t.status === "cancelled").length,
    duplicates: list.filter((t) => t.isDuplicate).length,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "daily"; // daily | weekly | monthly | draw | verified_rejected | duplicate

  const db = await getDb();
  const tickets = db.data!.tickets;
  const now = Date.now();
  const day = 86400000;

  let rows: { label: string; summary: ReturnType<typeof summarize> }[] = [];

  if (type === "daily") {
    const today = tickets.filter((t) => new Date(t.submittedAt).toDateString() === new Date().toDateString());
    rows = [{ label: new Date().toLocaleDateString(), summary: summarize(today) }];
  } else if (type === "weekly") {
    const weekAgo = now - 7 * day;
    rows = [{ label: "Last 7 days", summary: summarize(tickets.filter((t) => +new Date(t.submittedAt) >= weekAgo)) }];
  } else if (type === "monthly") {
    const monthAgo = now - 30 * day;
    rows = [{ label: "Last 30 days", summary: summarize(tickets.filter((t) => +new Date(t.submittedAt) >= monthAgo)) }];
  } else if (type === "draw") {
    const byDraw = new Map<string, Ticket[]>();
    for (const t of tickets) byDraw.set(t.drawName, [...(byDraw.get(t.drawName) || []), t]);
    rows = Array.from(byDraw.entries()).map(([label, list]) => ({ label, summary: summarize(list) }));
  } else if (type === "verified_rejected") {
    rows = [
      { label: "Verified", summary: summarize(tickets.filter((t) => t.status === "verified")) },
      { label: "Rejected", summary: summarize(tickets.filter((t) => t.status === "rejected")) },
    ];
  } else if (type === "duplicate") {
    rows = [{ label: "Duplicate Tickets", summary: summarize(tickets.filter((t) => t.isDuplicate)) }];
  }

  return NextResponse.json({ type, rows });
}
