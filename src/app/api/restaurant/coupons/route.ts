import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnerRestaurant } from "@/lib/owner";
import { couponSchema, resolveCouponData } from "@/lib/coupon-service";

export async function POST(req: Request) {
  const r0 = await getOwnerRestaurant();
  if (!r0) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const parsed = couponSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const r = await resolveCouponData(parsed.data, { kind: "owner", restaurantId: r0.id });
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  if (await prisma.coupon.findUnique({ where: { code: r.data.code } })) return NextResponse.json({ error: "That code already exists." }, { status: 409 });
  const c = await prisma.coupon.create({ data: r.data });
  return NextResponse.json({ id: c.id });
}
