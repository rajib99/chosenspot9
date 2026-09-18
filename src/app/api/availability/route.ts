import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeSlots } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const tableId = u.searchParams.get("tableId") ?? "";
  const date = u.searchParams.get("date") ?? "";
  const duration = Number(u.searchParams.get("duration"));
  const table = await prisma.table.findFirst({
    where: { id: tableId, isActive: true, deletedAt: null, restaurant: { status: "APPROVED", listingFeeStatus: "PAID" } },
    include: { restaurant: { select: { timezone: true } } },
  });
  if (!table || !duration) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Reschedule: the booking's secret token lets its own slot count as free.
  const own = u.searchParams.get("exclude");
  const excludeId = own ? (await prisma.booking.findUnique({ where: { cancelToken: own }, select: { id: true, tableId: true } }).then((b) => (b?.tableId === table.id ? b.id : undefined))) : undefined;
  const slots = await computeSlots(table, table.restaurant.timezone, date, duration, new Date(), excludeId);
  return NextResponse.json({ slots });
}
