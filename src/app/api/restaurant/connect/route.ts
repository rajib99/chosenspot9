import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOwnerRestaurant } from "@/lib/owner";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { appUrl } from "@/lib/utils";
import { getSession } from "@/lib/auth";

/** Create (or resume) Stripe Connect Express onboarding and return the hosted onboarding link. */
export async function POST() {
  const r = await getOwnerRestaurant();
  if (!r) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  if (!stripeConfigured()) return NextResponse.json({ error: "Stripe is not configured (STRIPE_SECRET_KEY)." }, { status: 503 });
  const stripe = getStripe();
  const session = await getSession();
  let accountId = r.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: r.email || session?.user?.email || undefined,
      business_profile: { name: r.name, url: `${appUrl()}/restaurants/${r.slug}` },
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      metadata: { restaurantId: r.id },
    });
    accountId = account.id;
    await prisma.restaurant.update({ where: { id: r.id }, data: { stripeAccountId: accountId } });
  }
  const link = await stripe.accountLinks.create({ account: accountId, type: "account_onboarding", refresh_url: `${appUrl()}/restaurant/payouts?refresh=1`, return_url: `${appUrl()}/restaurant/payouts?return=1` });
  return NextResponse.json({ url: link.url });
}
