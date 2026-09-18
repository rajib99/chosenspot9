import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { couponSchema, resolveCouponData } from "@/lib/coupon-service";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const s = await getSession();
  if (s?.user?.role !== "ADMIN") return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const existing = await prisma.coupon.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const toggle = z.object({ isActive: z.boolean() }).strict().safeParse(body);
  if (toggle.success) {
    await prisma.coupon.update({ where: { id: existing.id }, data: toggle.data });
    await audit(s.user.id, toggle.data.isActive ? "coupon.activate" : "coupon.deactivate", "Coupon", existing.id, { code: existing.code });
    return NextResponse.json({ ok: true });
  }
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const r = await resolveCouponData(parsed.data, { kind: "admin" });
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  const clash = await prisma.coupon.findFirst({ where: { code: r.data.code, NOT: { id: existing.id } } });
  if (clash) return NextResponse.json({ error: "That code already exists." }, { status: 409 });
  await prisma.coupon.update({ where: { id: existing.id }, data: r.data });
  await audit(s.user.id, "coupon.update", "Coupon", existing.id, { code: r.data.code });
  return NextResponse.json({ ok: true });
}
