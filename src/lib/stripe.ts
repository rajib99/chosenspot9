import Stripe from "stripe";

let client: Stripe | null = null;

export function stripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  return (client ??= new Stripe(process.env.STRIPE_SECRET_KEY));
}

/** Dev-only escape hatch: with no Stripe key, payment steps can be simulated locally. Never active in production. */
export function devPaymentsSimulated() {
  return !stripeConfigured() && process.env.NODE_ENV !== "production";
}

export const toMinor = (amount: number) => Math.round(amount * 100);
