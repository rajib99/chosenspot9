import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateCoupon } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const schema = z.object({ code: z.string().trim().min(1).max(40), tableId: z.string().min(1) });

/** Public: used by the booking form to preview a discount. */
export async function POST(req: Request) {
  const rl = rateLimit(`coupon:${clientIp(req)}`, 15, 60_000);
  if (!rl.ok) return NextResponse.json({ valid: false, reason: "Too many attempts. Try again shortly." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ valid: false, reason: "Enter a code." }, { status: 400 });
  const table = await prisma.table.findFirst({ where: { id: parsed.data.tableId, isActive: true, deletedAt: null } });
  if (!table) return NextResponse.json({ valid: false, reason: "Table not found." }, { status: 404 });
  const r = await validateCoupon(parsed.data.code, table);
  if (!r.valid) return NextResponse.json({ valid: false, reason: r.reason });
  return NextResponse.json({ valid: true, code: r.coupon.code, discount: r.discount, finalFee: r.finalFee });
}
