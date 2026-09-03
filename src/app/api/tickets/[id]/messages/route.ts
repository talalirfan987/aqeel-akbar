import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCustomerSession } from "@/lib/customerAuth";

const sendSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  senderRole: z.enum(["admin", "customer"]).optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await getDb();
  const ticket = db.data!.tickets.find((t) => t.id === id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const admin = await getSession();
  const customer = await getCustomerSession();
  if (!admin && !customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const admin = await getSession();
  const customer = await getCustomerSession();

  if (!admin && !customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
  }

  const { text, senderRole } = parsed.data;

  let sender: "admin" | "customer" = "customer";
  let senderName = ticket.customerName;

  if (senderRole === "admin" && admin) {
    sender = "admin";
    senderName = admin.name || admin.username || "Operator";
  } else if (senderRole === "customer") {
    sender = "customer";
    senderName = customer?.name || ticket.customerName;
  } else if (admin && !customer) {
    sender = "admin";
    senderName = admin.name || admin.username || "Operator";
  } else if (customer) {
    sender = "customer";
    senderName = customer.name || ticket.customerName;
  }

  const message = {
    id: nanoid(),
    ticketId: ticket.id,
    referenceId: ticket.referenceId,
    sender,
    senderName,
    text,
    timestamp: new Date().toISOString(),
  };
  db.data!.messages.push(message);

  if (sender === "customer") {
    db.data!.notifications.unshift({
      id: nanoid(),
      referenceId: ticket.referenceId,
      type: "message",
      message: `New reply from ${senderName} on ticket ${ticket.referenceId}.`,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  await db.write();
  return NextResponse.json({ message }, { status: 201 });
}
