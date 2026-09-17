import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const rows = await sql`SELECT data FROM app_state WHERE id = 'ticket_images'`;
    if (!rows.length || !rows[0].data || !rows[0].data[id]) {
      return new NextResponse("Image not found", { status: 404 });
    }

    const dataUrl: string = rows[0].data[id];
    if (!dataUrl.startsWith("data:")) {
      return NextResponse.redirect(dataUrl);
    }

    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return new NextResponse("Invalid image format", { status: 400 });
    }

    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return new NextResponse("Failed to load image", { status: 500 });
  }
}

