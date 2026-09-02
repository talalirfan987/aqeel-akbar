import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

const patchSchema = z.object({
  listTitle: z.string().min(1).max(100).optional(),
  listDate: z.string().min(1).optional(),
  srNo: z.coerce.number().int().positive().optional(),
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(150).optional(),
  prize: z.string().min(1).max(150).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const db = await getDb();
  const entry = db.data!.winnerEntries.find((w) => w.id === id);
  if (!entry) return NextResponse.json({ error: "Winner entry not found" }, { status: 404 });

  Object.assign(entry, parsed.data);
  await db.write();

  return NextResponse.json({ entry });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const db = await getDb();
  const idx = db.data!.winnerEntries.findIndex((w) => w.id === id);
  if (idx === -1) return NextResponse.json({ error: "Winner entry not found" }, { status: 404 });

  db.data!.winnerEntries.splice(idx, 1);
  await db.write();

  return NextResponse.json({ ok: true });
}
