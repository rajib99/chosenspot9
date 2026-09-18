import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { restaurantSchema } from "@/lib/restaurant-schema";
import { nanoid } from "nanoid";
import { slugify } from "@/lib/utils";

async function owner() {
  const s = await getSession();
  return s?.user?.role === "RESTAURANT_OWNER" ? s.user : null;
}

export async function POST(req: Request) {
  const user = await owner();
  if (!user) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  if (await prisma.restaurant.findFirst({ where: { ownerId: user.id } })) {
    return NextResponse.json({ error: "You already have a restaurant profile." }, { status: 409 });
  }
  const parsed = restaurantSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;
  let slug = slugify(d.name) || "restaurant";
  if (await prisma.restaurant.findUnique({ where: { slug } })) slug = `${slug}-${nanoid(5).toLowerCase().replace(/[^a-z0-9]/g, "x")}`;
  const r = await prisma.restaurant.create({
    data: { ...d, phone: d.phone || null, email: d.email || null, slug, ownerId: user.id, status: "PENDING", listingFeeStatus: "UNPAID" },
  });
  return NextResponse.json({ id: r.id, slug: r.slug });
}

export async function PATCH(req: Request) {
  const user = await owner();
  if (!user) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const existing = await prisma.restaurant.findFirst({ where: { ownerId: user.id } });
  if (!existing) return NextResponse.json({ error: "No restaurant" }, { status: 404 });
  const parsed = restaurantSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;
  await prisma.restaurant.update({ where: { id: existing.id }, data: { ...d, phone: d.phone || null, email: d.email || null } });
  return NextResponse.json({ ok: true });
}
