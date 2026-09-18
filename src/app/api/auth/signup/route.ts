import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["CUSTOMER", "RESTAURANT_OWNER"]),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { name, email, password, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  await prisma.user.create({ data: { name, email, role, passwordHash: await bcrypt.hash(password, 11) } });
  return NextResponse.json({ ok: true });
}
