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
  timerEndMs: z.number().optional(),
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

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3).optional(),
  drawDate: z.string().min(1).optional(),
  ticketPrice: z.coerce.number().positive().optional(),
  active: z.boolean().optional(),
  timerEndMs: z.number().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const db = await getDb();
  const index = db.data!.draws.findIndex((d) => d.id === parsed.data.id);
  if (index === -1) return NextResponse.json({ error: "Draw not found" }, { status: 404 });

  const existing = db.data!.draws[index];
  const updated = {
    ...existing,
    ...(parsed.data.name !== undefined && { name: parsed.data.name }),
    ...(parsed.data.drawDate !== undefined && { drawDate: parsed.data.drawDate }),
    ...(parsed.data.ticketPrice !== undefined && { ticketPrice: parsed.data.ticketPrice }),
    ...(parsed.data.active !== undefined && { active: parsed.data.active }),
    ...(parsed.data.timerEndMs !== undefined && {
      timerEndMs: parsed.data.timerEndMs === null ? undefined : parsed.data.timerEndMs,
    }),
  };

  db.data!.draws[index] = updated;
  await db.write();
  return NextResponse.json({ draw: updated });
}
