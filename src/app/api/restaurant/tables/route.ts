import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnerRestaurant } from "@/lib/owner";
import { getSettings } from "@/lib/settings";
import { tableSchema } from "@/lib/table-schema";

export async function POST(req: Request) {
  const r = await getOwnerRestaurant();
  if (!r) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const parsed = tableSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { currency } = await getSettings();
  const t = await prisma.table.create({ data: { ...parsed.data, currency, restaurantId: r.id } });
  return NextResponse.json({ id: t.id });
}
