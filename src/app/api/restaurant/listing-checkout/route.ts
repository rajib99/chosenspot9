import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getStripe, stripeConfigured, toMinor } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { appUrl } from "@/lib/utils";

export async function POST() {
  const s = await getSession();
  if (s?.user?.role !== "RESTAURANT_OWNER") return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const r = await prisma.restaurant.findFirst({ where: { ownerId: s.user.id } });
  if (!r) return NextResponse.json({ error: "Create your restaurant profile first." }, { status: 400 });
  if (r.listingFeeStatus === "PAID") return NextResponse.json({ error: "Listing fee already paid." }, { status: 400 });
  if (!stripeConfigured()) return NextResponse.json({ error: "Stripe is not configured (STRIPE_SECRET_KEY)." }, { status: 503 });

  const settings = await getSettings();
  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: s.user.email ?? undefined,
    line_items: [
      { quantity: 1, price_data: { currency: settings.currency, unit_amount: toMinor(settings.listingFee), product_data: { name: `ChosenSpot listing fee — ${r.name}` } } },
    ],
    metadata: { type: "LISTING_FEE", restaurantId: r.id },
    success_url: `${appUrl()}/restaurant?listing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/restaurant/pay-listing?canceled=1`,
  });
  await prisma.payment.create({
    data: { restaurantId: r.id, type: "LISTING_FEE", amount: settings.listingFee, currency: settings.currency, stripeSessionId: session.id, status: "PENDING" },
  });
  return NextResponse.json({ url: session.url });
}
