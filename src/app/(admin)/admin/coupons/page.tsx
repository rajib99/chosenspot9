import { prisma } from "@/lib/prisma";
import { CouponManager } from "@/components/coupon-manager";

export const metadata = { title: "Admin · Coupons" };
export const dynamic = "force-dynamic";

export default async function AdminCoupons() {
  const [coupons, restaurants, tables] = await Promise.all([
    prisma.coupon.findMany({ include: { restaurant: { select: { name: true } }, table: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.restaurant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.table.findMany({ where: { deletedAt: null }, select: { id: true, name: true, restaurant: { select: { name: true } } }, orderBy: { name: "asc" } }),
  ]);
  return (
    <CouponManager mode="admin" apiBase="/api/admin/coupons"
      restaurants={restaurants.map((r) => ({ id: r.id, label: r.name }))}
      tables={tables.map((t) => ({ id: t.id, label: `${t.restaurant.name} — ${t.name}` }))}
      coupons={coupons.map((c) => ({ id: c.id, code: c.code, type: c.type, value: Number(c.value), appliesTo: c.appliesTo, restaurantId: c.restaurantId, tableId: c.tableId, restaurantName: c.restaurant?.name, tableName: c.table?.name, maxRedemptions: c.maxRedemptions, timesRedeemed: c.timesRedeemed, expiresAt: c.expiresAt?.toISOString() ?? null, isActive: c.isActive }))} />
  );
}
