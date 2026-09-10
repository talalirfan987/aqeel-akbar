import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getDb, nextReferenceId } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCustomerSession } from "@/lib/customerAuth";
import { isRateLimited } from "@/lib/rateLimit";
import type { Ticket } from "@/lib/types";
import { nameSchema, phoneSchema, citySchema, cnicSchema, ticketHolderSchema } from "@/lib/validation";

const submitSchema = z.object({
  customerName: nameSchema,
  phone: phoneSchema,
  city: citySchema,
  cnic: cnicSchema,
  quantity: z.coerce.number().int().positive("Enter a valid number of tickets").default(1),
  // Optional breakdown when the tickets in this submission belong to more than one
  // person (e.g. 10 tickets split 4/2/4 across three names). Quantities must add up
  // to `quantity` — checked below since that check needs both fields at once.
  holders: z.array(ticketHolderSchema).optional(),
  drawId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  drawDate: z.string().min(1),
  paymentMethod: z.enum(["jazzcash", "easypaisa"], { error: "Select a payment method" }),
  paymentConfirmed: z.literal(true, { error: "Please confirm your payment before submitting" }),
  ticketImage: z.string().optional(),
  ticketImageName: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const status = searchParams.get("status") || "";
  const drawId = searchParams.get("drawId") || "";
  const sort = searchParams.get("sort") || "newest";

  let list = [...db.data!.tickets];

  if (q) {
    list = list.filter(
      (t) =>
        t.referenceId.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.phone.includes(q)
    );
  }
  if (status) list = list.filter((t) => t.status === status);
  if (drawId) list = list.filter((t) => t.drawId === drawId);

  list.sort((a, b) => {
    if (sort === "oldest") return +new Date(a.submittedAt) - +new Date(b.submittedAt);
    if (sort === "highest") return b.amount - a.amount;
    if (sort === "lowest") return a.amount - b.amount;
    return +new Date(b.submittedAt) - +new Date(a.submittedAt);
  });

  return NextResponse.json({ tickets: list });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (isRateLimited(`submit:${ip}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "Too many submissions. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const db = await getDb();
  const draw = db.data!.draws.find((d) => d.id === data.drawId);
  if (!draw) return NextResponse.json({ error: "Selected draw was not found" }, { status: 400 });
  if (!draw.active || (typeof draw.timerEndMs === "number" && draw.timerEndMs <= Date.now())) {
    return NextResponse.json({ error: "Submissions for this draw are currently closed. The timer has ended." }, { status: 400 });
  }
  if (data.amount !== draw.ticketPrice * data.quantity) {
    return NextResponse.json({ error: "Amount does not match the selected draw's ticket price" }, { status: 400 });
  }
  if (data.holders && data.holders.length > 0) {
    const holderTotal = data.holders.reduce((sum, h) => sum + h.quantity, 0);
    if (holderTotal !== data.quantity) {
      return NextResponse.json(
        { error: `Ticket holder quantities (${holderTotal}) must add up to the total number of tickets (${data.quantity})` },
        { status: 400 }
      );
    }
  }

  const referenceId = nextReferenceId(db.data!.tickets);
  const ticketNumber = `TK-${referenceId.split("-").pop()}`;
  const customerSession = await getCustomerSession();

  const ticket: Ticket = {
    id: nanoid(),
    referenceId,
    customerName: data.customerName,
    phone: data.phone,
    city: data.city,
    cnic: data.cnic || undefined,
    ticketNumber,
    quantity: data.quantity,
    holders: data.holders && data.holders.length > 0 ? data.holders : undefined,
    drawId: draw.id,
    drawName: draw.name,
    amount: data.amount,
    drawDate: data.drawDate,
    paymentMethod: data.paymentMethod,
    paymentConfirmed: data.paymentConfirmed,
    ticketImage: data.ticketImage,
    ticketImageName: data.ticketImageName,
    status: "pending",
    isDuplicate: false,
    submittedAt: new Date().toISOString(),
    customerId: customerSession?.customerId,
  };

  db.data!.tickets.unshift(ticket);
  db.data!.notifications.unshift({
    id: nanoid(),
    referenceId: ticket.referenceId,
    type: "submitted",
    message: `Your ticket has been submitted successfully. Reference ID: ${ticket.referenceId}`,
    timestamp: new Date().toISOString(),
    read: false,
  });
  await db.write();

  return NextResponse.json({ referenceId: ticket.referenceId, isDuplicate: ticket.isDuplicate }, { status: 201 });
}
