import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";

export async function POST(request: Request): Promise<NextResponse> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    return handleDirectUpload(request);
  }

  // If Vercel Blob token is configured, use Vercel Blob client upload
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const body = (await request.json()) as HandleUploadBody;
      const jsonResponse = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: ["image/jpeg", "image/png", "application/pdf"],
          addRandomSuffix: true,
          maximumSizeInBytes: 5 * 1024 * 1024,
        }),
        onUploadCompleted: async () => {},
      });
      return NextResponse.json(jsonResponse);
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
  }

  // Fallback when BLOB token is not set
  return NextResponse.json(
    { error: "BLOB_READ_WRITE_TOKEN is not configured. Falling back to direct upload." },
    { status: 400 }
  );
}

export async function PUT(request: Request): Promise<NextResponse> {
  return handleDirectUpload(request);
}

async function handleDirectUpload(request: Request): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${nanoid(8)}-${safeName}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${filename}`, filename });
  } catch (err) {
    console.error("Direct upload failed:", err);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
