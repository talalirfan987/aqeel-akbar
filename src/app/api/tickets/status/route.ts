import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isRateLimited } from "@/lib/rateLimit";

// Public lookup — returns only the minimal, non-sensitive fields needed to track a ticket.
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (isRateLimited(`status:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  if (!query) return NextResponse.json({ error: "Please provide a Reference ID or Ticket Number" }, { status: 400 });

  const db = await getDb();
  const ticket = db.data!.tickets.find(
    (t) => t.referenceId.toLowerCase() === query || t.ticketNumber.toLowerCase() === query
  );

  if (!ticket) {
    return NextResponse.json({ error: "No ticket found with that Reference ID or Ticket Number." }, { status: 404 });
  }

  return NextResponse.json({
    ticket: {
      referenceId: ticket.referenceId,
      customerName: maskName(ticket.customerName),
      ticketNumber: ticket.ticketNumber,
      drawName: ticket.drawName,
      drawDate: ticket.drawDate,
      amount: ticket.amount,
      status: ticket.status,
      submittedAt: ticket.submittedAt,
      verifiedAt: ticket.verifiedAt,
      adminNotes: ticket.status === "rejected" ? ticket.adminNotes : undefined,
      holders: ticket.holders?.map((h) => ({ name: maskName(h.name), quantity: h.quantity })),
    },
  });
}

function maskName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length <= 2 ? p : p[0] + "*".repeat(p.length - 2) + p[p.length - 1]))
    .join(" ");
}
