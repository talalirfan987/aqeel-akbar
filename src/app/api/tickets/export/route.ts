import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

function csvEscape(v: string | number | undefined) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const headers = [
    "Reference ID",
    "Customer Name",
    "Phone",
    "Ticket Number",
    "Draw",
    "Amount",
    "Status",
    "Duplicate",
    "Submitted At",
    "Verified At",
    "Verified By",
  ];
  const rows = db.data!.tickets.map((t) =>
    [
      t.referenceId,
      t.customerName,
      t.phone,
      t.ticketNumber,
      t.drawName,
      t.amount,
      t.status,
      t.isDuplicate ? "Yes" : "No",
      t.submittedAt,
      t.verifiedAt || "",
      t.verifiedBy || "",
    ]
      .map(csvEscape)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="blm-tickets-${Date.now()}.csv"`,
    },
  });
}
