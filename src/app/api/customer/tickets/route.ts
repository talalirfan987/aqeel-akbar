import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCustomerSession } from "@/lib/customerAuth";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const tickets = db
    .data!.tickets.filter((t) => t.customerId === session.customerId)
    .sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));

  return NextResponse.json({ tickets });
}
