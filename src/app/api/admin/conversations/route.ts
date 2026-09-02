import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { TicketMessage } from "@/lib/types";

// WhatsApp-style conversation list for the admin — one row per ticket that has at least one
// message, newest activity first, with the last message preview and a simple unread flag
// (last message came from the customer and the admin hasn't replied yet).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const byTicket = new Map<string, TicketMessage[]>();
  for (const m of db.data!.messages) {
    if (!byTicket.has(m.ticketId)) byTicket.set(m.ticketId, []);
    byTicket.get(m.ticketId)!.push(m);
  }

  const conversations = [...byTicket.entries()]
    .map(([ticketId, msgs]) => {
      const ticket = db.data!.tickets.find((t) => t.id === ticketId);
      if (!ticket) return null;
      const sorted = [...msgs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const last = sorted[sorted.length - 1];
      return {
        ticketId,
        referenceId: ticket.referenceId,
        customerName: ticket.customerName,
        status: ticket.status,
        lastMessage: { text: last.text, sender: last.sender, timestamp: last.timestamp },
        unread: last.sender === "customer",
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());

  return NextResponse.json({ conversations });
}
