import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ token: z.string().min(10), password: z.string().min(8).max(100) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }
  await prisma.user.update({ where: { email: record.email }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 11) } });
  await prisma.passwordResetToken.deleteMany({ where: { email: record.email } });
  return NextResponse.json({ ok: true });
}
