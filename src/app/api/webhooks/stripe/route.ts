import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { handleStripeEvent } from "@/lib/stripe-events";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  const body = await req.text(); // raw body is required for signature verification
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    await handleStripeEvent(event);
  } catch (e) {
    console.error("[stripe webhook] handler failed", event.type, e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 }); // non-2xx makes Stripe retry
  }
  return NextResponse.json({ received: true });
}
