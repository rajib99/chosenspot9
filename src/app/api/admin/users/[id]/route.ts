import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminOrNull } from "@/lib/admin";
import { audit } from "@/lib/audit";

const schema = z.object({ role: z.enum(["CUSTOMER", "RESTAURANT_OWNER", "ADMIN"]).optional(), suspended: z.boolean().optional() }).refine((d) => d.role !== undefined || d.suspended !== undefined);

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await adminOrNull();
  if (!admin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  if (params.id === admin.id) return NextResponse.json({ error: "You can't change your own account." }, { status: 400 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const u = await prisma.user.update({ where: { id: params.id }, data: parsed.data }).catch(() => null);
  if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await audit(admin.id, parsed.data.suspended !== undefined ? (parsed.data.suspended ? "user.suspend" : "user.reinstate") : "user.role", "User", u.id, { email: u.email, ...parsed.data });
  return NextResponse.json({ ok: true });
}
