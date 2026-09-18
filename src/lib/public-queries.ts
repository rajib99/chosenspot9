import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const liveRestaurant: Prisma.RestaurantWhereInput = { status: "APPROVED", listingFeeStatus: "PAID" };
export const liveTable: Prisma.TableWhereInput = { isActive: true, deletedAt: null };

export async function getFilterOptions() {
  const rows = await prisma.restaurant.findMany({ where: liveRestaurant, select: { city: true, cuisine: true } });
  return {
    cities: [...new Set(rows.map((r) => r.city))].sort(),
    cuisines: [...new Set(rows.map((r) => r.cuisine))].sort(),
  };
}
