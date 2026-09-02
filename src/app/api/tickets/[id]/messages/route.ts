import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCustomerSession } from "@/lib/customerAuth";

const sendSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

async function resolveSender(ticketCustomerId: string | undefined) {
  const admin = await getSession();
  if (admin) return { sender: "admin" as const, senderName: admin.name || admin.username };

  const customer = await getCustomerSession();
  if (customer && ticketCustomerId && customer.customerId === ticketCustomerId) {
    return { sender: "customer" as const, senderName: customer.name };
  }
  return null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await getDb();
  const ticket = db.data!.tickets.find((t) => t.id === id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const who = await resolveSender(ticket.customerId);
  if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = db.data!.messages
    .filter((m) => m.ticketId === ticket.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await getDb();
  const ticket = db.data!.tickets.find((t) => t.id === id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const who = await resolveSender(ticket.customerId);
  if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
  }

  const message = {
    id: nanoid(),
    ticketId: ticket.id,
    referenceId: ticket.referenceId,
    sender: who.sender,
    senderName: who.senderName,
    text: parsed.data.text,
    timestamp: new Date().toISOString(),
  };
  db.data!.messages.push(message);

  // Let the other side know a new message has arrived.
  if (who.sender === "customer") {
    db.data!.notifications.unshift({
      id: nanoid(),
      referenceId: ticket.referenceId,
      type: "message",
      message: `New reply from ${who.senderName} on ticket ${ticket.referenceId}.`,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  await db.write();
  return NextResponse.json({ message }, { status: 201 });
}
