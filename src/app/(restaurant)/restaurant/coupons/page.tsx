import { redirect } from "next/navigation";
import { getOwnerRestaurant } from "@/lib/owner";
import { prisma } from "@/lib/prisma";
import { CouponManager } from "@/components/coupon-manager";

export const metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

export default async function OwnerCouponsPage() {
  const r = await getOwnerRestaurant();
  if (!r) redirect("/restaurant/onboarding");
  const [coupons, tables] = await Promise.all([
    prisma.coupon.findMany({ where: { restaurantId: r.id }, include: { table: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.table.findMany({ where: { restaurantId: r.id, deletedAt: null }, select: { id: true, name: true } }),
  ]);
  return (
    <CouponManager
      mode="owner"
      apiBase="/api/restaurant/coupons"
      tables={tables.map((t) => ({ id: t.id, label: t.name }))}
      coupons={coupons.map((c) => ({ id: c.id, code: c.code, type: c.type, value: Number(c.value), appliesTo: c.appliesTo, restaurantId: c.restaurantId, tableId: c.tableId, restaurantName: r.name, tableName: c.table?.name, maxRedemptions: c.maxRedemptions, timesRedeemed: c.timesRedeemed, expiresAt: c.expiresAt?.toISOString() ?? null, isActive: c.isActive }))}
    />
  );
}
