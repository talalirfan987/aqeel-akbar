import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

function csvEscape(v: string | number | undefined) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Verified customers only — Name, Phone, City — deduped by phone (latest verified ticket wins).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const verified = db.data!.tickets
    .filter((t) => t.status === "verified")
    .sort((a, b) => new Date(a.verifiedAt || a.submittedAt).getTime() - new Date(b.verifiedAt || b.submittedAt).getTime());

  const byPhone = new Map<string, { name: string; phone: string; city: string }>();
  for (const t of verified) {
    byPhone.set(t.phone, { name: t.customerName, phone: t.phone, city: t.city || "" });
  }

  const headers = ["Name", "Phone Number", "City"];
  const rows = [...byPhone.values()].map((c) => [c.name, c.phone, c.city].map(csvEscape).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="verified-customers-${Date.now()}.csv"`,
    },
  });
}
