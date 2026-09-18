import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { devPaymentsSimulated } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { markListingPaid } from "@/lib/listing";

/** Local-development only: pretend the listing fee was paid when no Stripe key is configured. */
export async function POST() {
  if (!devPaymentsSimulated()) return NextResponse.json({ error: "Not available" }, { status: 404 });
  const s = await getSession();
  if (s?.user?.role !== "RESTAURANT_OWNER") return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const r = await prisma.restaurant.findFirst({ where: { ownerId: s.user.id } });
  if (!r) return NextResponse.json({ error: "No restaurant" }, { status: 400 });
  const settings = await getSettings();
  await markListingPaid(r.id, { sessionId: `dev_${Date.now()}`, amount: settings.listingFee, currency: settings.currency });
  return NextResponse.json({ ok: true });
}
