import { NextResponse } from "next/server";
import { getOwnerRestaurant } from "@/lib/owner";
import { getStripe, stripeConfigured } from "@/lib/stripe";

export async function POST() {
  const r = await getOwnerRestaurant();
  if (!r?.stripeAccountId || !stripeConfigured()) return NextResponse.json({ error: "No connected account." }, { status: 400 });
  const link = await getStripe().accounts.createLoginLink(r.stripeAccountId);
  return NextResponse.json({ url: link.url });
}
