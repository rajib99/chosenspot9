import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOwnerRestaurant } from "@/lib/owner";
import { tableSchema } from "@/lib/table-schema";

async function ownedTable(id: string) {
  const r = await getOwnerRestaurant();
  if (!r) return null;
  return prisma.table.findFirst({ where: { id, restaurantId: r.id, deletedAt: null } });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const t = await ownedTable(params.id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  // Lightweight toggle used by the list view
  const toggle = z.object({ isActive: z.boolean() }).strict().safeParse(body);
  if (toggle.success) {
    await prisma.table.update({ where: { id: t.id }, data: toggle.data });
    return NextResponse.json({ ok: true });
  }
  const parsed = tableSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  await prisma.table.update({ where: { id: t.id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const t = await ownedTable(params.id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bookings = await prisma.booking.count({ where: { tableId: t.id } });
  if (bookings > 0) {
    // Keep history intact: soft delete + deactivate.
    await prisma.table.update({ where: { id: t.id }, data: { deletedAt: new Date(), isActive: false } });
    return NextResponse.json({ ok: true, soft: true });
  }
  await prisma.table.delete({ where: { id: t.id } });
  return NextResponse.json({ ok: true, soft: false });
}
