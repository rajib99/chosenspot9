import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOwnerRestaurant } from "@/lib/owner";
import { couponSchema, resolveCouponData } from "@/lib/coupon-service";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const r0 = await getOwnerRestaurant();
  if (!r0) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  // Owners can only touch coupons that belong to their own restaurant.
  const existing = await prisma.coupon.findFirst({ where: { id: params.id, restaurantId: r0.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const toggle = z.object({ isActive: z.boolean() }).strict().safeParse(body);
  if (toggle.success) {
    await prisma.coupon.update({ where: { id: existing.id }, data: toggle.data });
    return NextResponse.json({ ok: true });
  }
  const parsed = couponSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const r = await resolveCouponData(parsed.data, { kind: "owner", restaurantId: r0.id });
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  const clash = await prisma.coupon.findFirst({ where: { code: r.data.code, NOT: { id: existing.id } } });
  if (clash) return NextResponse.json({ error: "That code already exists." }, { status: 409 });
  await prisma.coupon.update({ where: { id: existing.id }, data: r.data });
  return NextResponse.json({ ok: true });
}
