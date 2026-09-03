import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getDb, nextReferenceId } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getCustomerSession } from "@/lib/customerAuth";
import { isRateLimited } from "@/lib/rateLimit";
import type { Ticket } from "@/lib/types";

const submitSchema = z.object({
  customerName: z.string().trim().min(3, "Full name must be at least 3 characters").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^03\d{9}$/, "Enter a valid Pakistani mobile number (e.g. 03001234567)"),
  city: z.string().trim().min(2, "Please enter your city").max(60),
  cnic: z
    .string()
    .trim()
    .regex(/^\d{5}-\d{7}-\d{1}$/, "CNIC must look like 12345-1234567-1")
    .optional()
    .or(z.literal("")),
  quantity: z.coerce.number().int().positive("Enter a valid number of tickets").default(1),
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
