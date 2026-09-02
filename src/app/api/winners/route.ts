import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { WinnerEntry } from "@/lib/types";

// Public — bulk-announced Winners Lists (independent of ticket submissions), plus any
// individual tickets the operator has flagged as winners.
export async function GET() {
  const db = await getDb();

  const groups = new Map<string, { listTitle: string; listDate: string; entries: WinnerEntry[] }>();
  for (const w of db.data!.winnerEntries) {
    const key = `${w.listTitle}__${w.listDate}`;
    if (!groups.has(key)) groups.set(key, { listTitle: w.listTitle, listDate: w.listDate, entries: [] });
    groups.get(key)!.entries.push(w);
  }
  const lists = [...groups.values()]
    .map((g) => ({ ...g, entries: g.entries.sort((a, b) => a.srNo - b.srNo) }))
    .sort((a, b) => new Date(b.listDate).getTime() - new Date(a.listDate).getTime());

  const ticketWinners = db.data!.tickets
    .filter((t) => t.isWinner)
    .sort((a, b) => new Date(b.verifiedAt || b.submittedAt).getTime() - new Date(a.verifiedAt || a.submittedAt).getTime())
    .map((t) => ({
      referenceId: t.referenceId,
      customerName: maskName(t.customerName),
      city: t.city,
      ticketNumber: t.ticketNumber,
      drawName: t.drawName,
      drawDate: t.drawDate,
      prize: t.prize || null,
    }));

  return NextResponse.json({ lists, ticketWinners });
}

function maskName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length <= 2 ? p : p[0] + "*".repeat(p.length - 2) + p[p.length - 1]))
    .join(" ");
}
