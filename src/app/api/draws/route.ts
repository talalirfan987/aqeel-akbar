import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const db = await getDb();
  return NextResponse.json({ draws: db.data!.draws });
}

const schema = z.object({
  name: z.string().min(3),
  drawDate: z.string().min(1),
  ticketPrice: z.coerce.number().positive(),
  active: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const db = await getDb();
  const draw = { id: crypto.randomUUID(), ...parsed.data };
  db.data!.draws.unshift(draw);
  await db.write();
  return NextResponse.json({ draw }, { status: 201 });
}
