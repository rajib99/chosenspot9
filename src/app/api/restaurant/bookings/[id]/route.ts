import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getOwnerRestaurant } from "@/lib/owner";

const schema = z.object({ status: z.enum(["COMPLETED", "NO_SHOW"]) });

/** Owners can close out a booking after the fact. Cancellation/refunds go through the guest-facing cancel flow. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const r = await getOwnerRestaurant();
  if (!r) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const b = await prisma.booking.findFirst({ where: { id: params.id, table: { restaurantId: r.id } } });
  if (!b || b.status !== "CONFIRMED") return NextResponse.json({ error: "Booking can't be updated." }, { status: 400 });
  if (b.startAt.getTime() > Date.now()) return NextResponse.json({ error: "You can only close out bookings that have started." }, { status: 400 });
  await prisma.booking.update({ where: { id: b.id }, data: { status: parsed.data.status } });
  return NextResponse.json({ ok: true });
}
