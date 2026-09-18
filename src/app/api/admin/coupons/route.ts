import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { couponSchema, resolveCouponData } from "@/lib/coupon-service";

export async function POST(req: Request) {
  const s = await getSession();
  if (s?.user?.role !== "ADMIN") return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const parsed = couponSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const r = await resolveCouponData(parsed.data, { kind: "admin" });
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
  if (await prisma.coupon.findUnique({ where: { code: r.data.code } })) return NextResponse.json({ error: "That code already exists." }, { status: 409 });
  const c = await prisma.coupon.create({ data: r.data });
  await audit(s.user.id, "coupon.create", "Coupon", c.id, { code: c.code });
  return NextResponse.json({ id: c.id });
}
