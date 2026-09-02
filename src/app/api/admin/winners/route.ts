import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

const createSchema = z.object({
  listTitle: z.string().min(1).max(100),
  listDate: z.string().min(1),
  srNo: z.coerce.number().int().positive(),
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(150),
  prize: z.string().min(1).max(150),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const entries = [...db.data!.winnerEntries].sort((a, b) => {
    const d = new Date(b.listDate).getTime() - new Date(a.listDate).getTime();
    return d !== 0 ? d : b.srNo - a.srNo;
  });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const db = await getDb();
  const entry = {
    id: nanoid(),
    ...parsed.data,
    createdAt: new Date().toISOString(),
  };
  db.data!.winnerEntries.push(entry);
  await db.write();

  return NextResponse.json({ entry }, { status: 201 });
}
