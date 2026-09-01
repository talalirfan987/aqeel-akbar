import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const map = new Map<
    string,
    { name: string; phone: string; ticketCount: number; verifiedCount: number; totalAmount: number; lastSubmission: string }
  >();

  for (const t of db.data!.tickets) {
    const key = t.phone;
    const existing = map.get(key);
    if (existing) {
      existing.ticketCount += 1;
      existing.verifiedCount += t.status === "verified" ? 1 : 0;
      existing.totalAmount += t.amount;
      if (new Date(t.submittedAt) > new Date(existing.lastSubmission)) existing.lastSubmission = t.submittedAt;
    } else {
      map.set(key, {
        name: t.customerName,
        phone: t.phone,
        ticketCount: 1,
        verifiedCount: t.status === "verified" ? 1 : 0,
        totalAmount: t.amount,
        lastSubmission: t.submittedAt,
      });
    }
  }

  const customers = Array.from(map.values()).sort(
    (a, b) => +new Date(b.lastSubmission) - +new Date(a.lastSubmission)
  );

  return NextResponse.json({ customers });
}
