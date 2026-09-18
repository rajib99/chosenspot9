import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const couponSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/, "Code: 3–30 letters, numbers, - or _"),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive("Value must be greater than 0"),
  appliesTo: z.enum(["ALL", "RESTAURANT", "TABLE"]),
  restaurantId: z.string().nullable().optional(),
  tableId: z.string().nullable().optional(),
  maxRedemptions: z.coerce.number().int().min(1).nullable().optional(),
  expiresAt: z.string().nullable().optional(), // yyyy-MM-dd, valid through end of that day (UTC)
  isActive: z.boolean().default(true),
}).superRefine((d, ctx) => {
  if (d.type === "PERCENT" && d.value > 100) ctx.addIssue({ code: "custom", path: ["value"], message: "Percent can't exceed 100" });
});
export type CouponInput = z.infer<typeof couponSchema>;

/** Scope: admin may target anything; an owner is confined to their own restaurant. Returns Prisma data or an error. */
export async function resolveCouponData(input: CouponInput, scope: { kind: "admin" } | { kind: "owner"; restaurantId: string }) {
  let restaurantId: string | null = null;
  let tableId: string | null = null;
  if (scope.kind === "owner") {
    if (input.appliesTo === "ALL") return { error: "Restaurant coupons must apply to your restaurant or one of its tables." } as const;
    restaurantId = scope.restaurantId;
  }
  if (input.appliesTo === "RESTAURANT") {
    restaurantId = scope.kind === "owner" ? scope.restaurantId : input.restaurantId ?? null;
    if (!restaurantId || !(await prisma.restaurant.findUnique({ where: { id: restaurantId } }))) return { error: "Choose a restaurant." } as const;
  }
  if (input.appliesTo === "TABLE") {
    const t = input.tableId ? await prisma.table.findUnique({ where: { id: input.tableId } }) : null;
    if (!t || (scope.kind === "owner" && t.restaurantId !== scope.restaurantId)) return { error: "Choose a valid table." } as const;
    tableId = t.id;
    restaurantId = t.restaurantId;
  }
  return {
    data: {
      code: input.code, type: input.type, value: input.value, appliesTo: input.appliesTo, restaurantId, tableId,
      maxRedemptions: input.maxRedemptions ?? null,
      expiresAt: input.expiresAt ? new Date(`${input.expiresAt}T23:59:59.999Z`) : null,
      isActive: input.isActive,
    },
  } as const;
}
