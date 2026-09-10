import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

const patchSchema = z.object({
  action: z.enum(["verify", "reject", "cancel", "edit", "mark_duplicate", "unmark_duplicate", "mark_winner", "unmark_winner"]),
  adminNotes: z.string().max(1000).optional(),
  customerName: z.string().min(3).max(100).optional(),
  phone: z.string().regex(/^03\d{9}$/).optional(),
  ticketNumber: z.string().min(2).max(30).optional(),
  amount: z.coerce.number().positive().optional(),
  prize: z.string().max(200).optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const db = await getDb();
  const ticket = db.data!.tickets.find((t) => t.id === id || t.referenceId === id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const input = parsed.data;

  const db = await getDb();
  const ticket = db.data!.tickets.find((t) => t.id === id);
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const prevStatus = ticket.status;

  if (ticket.status === "verified" && ["edit", "verify", "reject"].includes(input.action)) {
    return NextResponse.json({ error: "Verified tickets cannot be modified." }, { status: 409 });
  }

  const log = (action: string, details?: string) => {
    db.data!.auditLogs.unshift({
      id: crypto.randomUUID(),
      adminUsername: session.username,
      action,
      referenceId: ticket.referenceId,
      previousStatus: prevStatus,
      newStatus: ticket.status,
      timestamp: new Date().toISOString(),
      details,
    });
  };

  const notify = (type: "verified" | "rejected" | "cancelled", message: string) => {
    db.data!.notifications.unshift({
      id: crypto.randomUUID(),
      referenceId: ticket.referenceId,
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    });
  };

  // Post this as the first message in the ticket's chat thread, so the customer can see it
  // (and reply) as a conversation rather than a one-off notice.
  const postMessage = (text: string) => {
    db.data!.messages.push({
      id: crypto.randomUUID(),
      ticketId: ticket.id,
      referenceId: ticket.referenceId,
      sender: "admin",
      senderName: session.name || session.username,
      text,
      timestamp: new Date().toISOString(),
    });
  };

  switch (input.action) {
    case "verify": {
      const dup = db.data!.tickets.some(
        (t) => t.id !== ticket.id && t.ticketNumber === ticket.ticketNumber && t.status === "verified"
      );
      if (dup) {
        return NextResponse.json(
          { error: `Ticket number ${ticket.ticketNumber} is already verified on another record. A ticket cannot be verified twice.` },
          { status: 409 }
        );
      }
      ticket.status = "verified";
      ticket.verifiedAt = new Date().toISOString();
      ticket.verifiedBy = session.username;
      if (input.adminNotes) ticket.adminNotes = input.adminNotes;
      log(`Admin verified ticket ${ticket.referenceId}`);
      notify("verified", "Your ticket has been verified.");
      postMessage(input.adminNotes ? `Your ticket has been verified. ${input.adminNotes}` : "Your ticket has been verified.");
      break;
    }
    case "reject": {
      ticket.status = "rejected";
      ticket.verifiedAt = new Date().toISOString();
      ticket.verifiedBy = session.username;
      ticket.adminNotes = input.adminNotes || ticket.adminNotes;
      log(`Admin rejected ticket ${ticket.referenceId}`, input.adminNotes);
      notify("rejected", "Your ticket requires attention. Please contact the authorized operator.");
      postMessage(
        input.adminNotes
          ? `Your ticket was rejected: ${input.adminNotes}`
          : "Your ticket was rejected. Please contact us for details."
      );
      break;
    }
    case "cancel": {
      ticket.status = "cancelled";
      ticket.adminNotes = input.adminNotes || ticket.adminNotes;
      log(`Admin cancelled ticket ${ticket.referenceId}`, input.adminNotes);
      notify("cancelled", "Your ticket has been cancelled by the operator. Please contact support for details.");
      postMessage(
        input.adminNotes
          ? `Your ticket has been cancelled: ${input.adminNotes}`
          : "Your ticket has been cancelled. Please contact us if you have questions."
      );
      break;
    }
    case "mark_duplicate": {
      ticket.isDuplicate = true;
      log(`Admin flagged ticket ${ticket.referenceId} as possible duplicate`);
      break;
    }
    case "unmark_duplicate": {
      ticket.isDuplicate = false;
      log(`Admin cleared duplicate flag on ticket ${ticket.referenceId}`);
      break;
    }
    case "mark_winner": {
      if (ticket.status !== "verified") {
        return NextResponse.json({ error: "Only verified tickets can be marked as winners." }, { status: 409 });
      }
      ticket.isWinner = true;
      ticket.prize = input.prize || ticket.prize;
      log(`Admin marked ticket ${ticket.referenceId} as a winner`, input.prize);
      break;
    }
    case "unmark_winner": {
      ticket.isWinner = false;
      log(`Admin cleared winner flag on ticket ${ticket.referenceId}`);
      break;
    }
    case "edit": {
      const changed: string[] = [];
      if (input.customerName && input.customerName !== ticket.customerName) {
        changed.push(`name: ${ticket.customerName} → ${input.customerName}`);
        ticket.customerName = input.customerName;
      }
      if (input.phone && input.phone !== ticket.phone) {
        changed.push(`phone: ${ticket.phone} → ${input.phone}`);
        ticket.phone = input.phone;
      }
      if (input.ticketNumber && input.ticketNumber !== ticket.ticketNumber) {
        changed.push(`ticket#: ${ticket.ticketNumber} → ${input.ticketNumber}`);
        ticket.ticketNumber = input.ticketNumber;
      }
      if (input.amount && input.amount !== ticket.amount) {
        changed.push(`amount: ${ticket.amount} → ${input.amount}`);
        ticket.amount = input.amount;
      }
      log(`Admin edited ticket ${ticket.referenceId}`, changed.join("; "));
      break;
    }
  }

  await db.write();
  return NextResponse.json({ ticket });
}
