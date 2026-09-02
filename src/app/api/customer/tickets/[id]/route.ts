import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCustomerSession } from "@/lib/customerAuth";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const db = await getDb();
  const ticket = db.data!.tickets.find((t) => t.id === id && t.customerId === session.customerId);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  return NextResponse.json({ ticket });
}
