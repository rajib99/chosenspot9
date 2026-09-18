import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth";

const MAX_BYTES = 6 * 1024 * 1024;
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role === "CUSTOMER") return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  const ext = EXT[file.type];
  if (!ext) return NextResponse.json({ error: "Only JPG, PNG or WebP images are allowed." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is too large (max 6MB)." }, { status: 400 });

  const name = `${nanoid(12)}.${ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`restaurants/${name}`, file, { access: "public", contentType: file.type });
    return NextResponse.json({ url: blob.url });
  }
  if (process.env.VERCEL) {
    return NextResponse.json({ error: "Image storage is not configured (BLOB_READ_WRITE_TOKEN)." }, { status: 500 });
  }
  // Local dev fallback: write to public/uploads
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ url: `/uploads/${name}` });
}
