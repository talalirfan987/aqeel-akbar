import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { createCustomerSession } from "@/lib/customerAuth";
import { isRateLimited } from "@/lib/rateLimit";

const schema = z.object({
  name: z.string().trim().min(3, "Please enter your full name").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^03\d{9}$/, "Enter a valid Pakistani mobile number (e.g. 03001234567)"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (isRateLimited(`signup:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, phone, password } = parsed.data;

  const db = await getDb();
  const existing = db.data!.customers.find((c) => c.phone === phone);
  if (existing) {
    return NextResponse.json({ error: "An account with this phone number already exists. Please sign in." }, { status: 409 });
  }

  const customer = {
    id: nanoid(),
    name,
    phone,
    passwordHash: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString(),
  };
  db.data!.customers.push(customer);
  await db.write();

  await createCustomerSession({ customerId: customer.id, name: customer.name, phone: customer.phone });

  return NextResponse.json({ ok: true, name: customer.name }, { status: 201 });
}
