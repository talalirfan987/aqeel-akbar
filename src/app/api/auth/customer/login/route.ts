import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { createCustomerSession } from "@/lib/customerAuth";
import { isRateLimited } from "@/lib/rateLimit";

const schema = z.object({
  phone: z.string().trim().min(1, "Enter your mobile number"),
  password: z.string().min(1, "Enter your password"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (isRateLimited(`customer-login:${ip}`, 10, 5 * 60_000)) {
    return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Phone number and password are required" }, { status: 400 });

  const db = await getDb();
  const customer = db.data!.customers.find((c) => c.phone === parsed.data.phone.trim());
  if (!customer || !bcrypt.compareSync(parsed.data.password, customer.passwordHash)) {
    return NextResponse.json({ error: "Invalid phone number or password" }, { status: 401 });
  }

  await createCustomerSession({ customerId: customer.id, name: customer.name, phone: customer.phone });

  return NextResponse.json({ ok: true, name: customer.name });
}
