import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customerAuth";

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ customer: null });
  return NextResponse.json({ customer: session });
}
