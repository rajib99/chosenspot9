import type { Prisma } from "@prisma/client";

export type BookingFilters = { q?: string; status?: string; restaurant?: string; from?: string; to?: string };

export function bookingWhere(f: BookingFilters): Prisma.BookingWhereInput {
  const where: Prisma.BookingWhereInput = {};
  if (f.status && ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"].includes(f.status)) where.status = f.status as never;
  if (f.restaurant) where.table = { restaurantId: f.restaurant };
  if (f.q) where.OR = [{ guestName: { contains: f.q, mode: "insensitive" } }, { guestEmail: { contains: f.q, mode: "insensitive" } }, { id: { endsWith: f.q.toLowerCase() } }];
  if (f.from || f.to) where.startAt = { ...(f.from ? { gte: new Date(`${f.from}T00:00:00Z`) } : {}), ...(f.to ? { lte: new Date(`${f.to}T23:59:59Z`) } : {}) };
  return where;
}
