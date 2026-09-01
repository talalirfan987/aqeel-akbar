import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (isRateLimited(`login:${ip}`, 10, 5 * 60_000)) {
    return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Username and password are required" }, { status: 400 });

  const db = await getDb();
  const admin = db.data!.admins.find((a) => a.username === parsed.data.username);
  if (!admin || !bcrypt.compareSync(parsed.data.password, admin.passwordHash)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  await createSession({ username: admin.username, name: admin.name, role: admin.role });

  db.data!.auditLogs.unshift({
    id: crypto.randomUUID(),
    adminUsername: admin.username,
    action: `Admin ${admin.username} logged in`,
    timestamp: new Date().toISOString(),
  });
  await db.write();

  return NextResponse.json({ ok: true });
}
