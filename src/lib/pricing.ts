import { prisma } from "@/lib/prisma";
import type { Coupon } from "@prisma/client";

export type CouponResult =
  | { valid: true; coupon: Coupon; discount: number; finalFee: number }
  | { valid: false; reason: string };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function applyCoupon(coupon: Coupon, fee: number) {
  const raw = coupon.type === "PERCENT" ? (fee * Number(coupon.value)) / 100 : Number(coupon.value);
  const discount = round2(Math.min(fee, Math.max(0, raw)));
  return { discount, finalFee: round2(fee - discount) };
}

export async function validateCoupon(code: string, table: { id: string; restaurantId: string; bookingFee: unknown }): Promise<CouponResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.isActive) return { valid: false, reason: "This code isn't valid." };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, reason: "This code has expired." };
  if (coupon.maxRedemptions !== null && coupon.timesRedeemed >= coupon.maxRedemptions) return { valid: false, reason: "This code has been fully redeemed." };
  if (coupon.appliesTo === "RESTAURANT" && coupon.restaurantId !== table.restaurantId) return { valid: false, reason: "This code doesn't apply to this restaurant." };
  if (coupon.appliesTo === "TABLE" && coupon.tableId !== table.id) return { valid: false, reason: "This code doesn't apply to this table." };
  const fee = Number(table.bookingFee);
  if (fee <= 0) return { valid: false, reason: "This table is already free." };
  return { valid: true, coupon, ...applyCoupon(coupon, fee) };
}
