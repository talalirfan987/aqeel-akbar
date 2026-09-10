import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { createCustomerSession } from "@/lib/customerAuth";

const DEMO_PHONE = "03000000000";

// One-click demo login for reviewers — signs in as a fixed "Demo Customer" account
// with no name/password required. Disabled outside development so this can never
// become a real authentication bypass if the app is ever deployed.
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Demo login is only available in development" }, { status: 403 });
  }

  const db = await getDb();
  let customer = db.data!.customers.find((c) => c.phone === DEMO_PHONE);
  if (!customer) {
    customer = {
      id: nanoid(),
      name: "Demo Customer",
      phone: DEMO_PHONE,
      // Random, never displayed or shared — this account is only ever reachable
      // through this demo endpoint, not the normal password login.
      passwordHash: bcrypt.hashSync(nanoid(40), 10),
      createdAt: new Date().toISOString(),
    };
    db.data!.customers.push(customer);
    await db.write();
  }

  await createCustomerSession({ customerId: customer.id, name: customer.name, phone: customer.phone });
  return NextResponse.json({ ok: true, name: customer.name });
}
