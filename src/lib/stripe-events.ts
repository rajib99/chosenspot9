import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { markListingPaid } from "@/lib/listing";
import { confirmBooking } from "@/lib/booking";

const piId = (pi: string | Stripe.PaymentIntent | null | undefined) => (typeof pi === "string" ? pi : pi?.id ?? null);

/** All Stripe webhook business logic. Every branch is idempotent (Stripe retries deliveries). */
export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.payment_status !== "paid") break;
      if (s.metadata?.type === "LISTING_FEE" && s.metadata.restaurantId) {
        await markListingPaid(s.metadata.restaurantId, { sessionId: s.id, paymentIntentId: piId(s.payment_intent), amount: (s.amount_total ?? 0) / 100, currency: s.currency ?? "usd" });
      } else if (s.metadata?.type === "BOOKING_FEE" && s.metadata.bookingId) {
        await confirmBooking(s.metadata.bookingId, { sessionId: s.id, paymentIntentId: piId(s.payment_intent), amount: (s.amount_total ?? 0) / 100, currency: s.currency ?? undefined, platformFee: Number(s.metadata.platformFee ?? 0) });
      }
      break;
    }
    case "checkout.session.expired": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.metadata?.type === "BOOKING_FEE" && s.metadata.bookingId) {
        // Checkout window closed unpaid: release the held slot.
        await prisma.booking.updateMany({ where: { id: s.metadata.bookingId, status: "PENDING" }, data: { status: "CANCELLED" } });
        await prisma.payment.updateMany({ where: { stripeSessionId: s.id, status: "PENDING" }, data: { status: "FAILED" } });
      }
      break;
    }
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      if (pi.metadata?.type === "BOOKING_FEE" && pi.metadata.bookingId) {
        await confirmBooking(pi.metadata.bookingId, { paymentIntentId: pi.id, amount: pi.amount_received / 100, currency: pi.currency });
      }
      await prisma.payment.updateMany({ where: { stripePaymentIntentId: pi.id, status: "PENDING" }, data: { status: "SUCCEEDED" } });
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await prisma.payment.updateMany({ where: { OR: [{ stripePaymentIntentId: pi.id }, ...(pi.metadata?.bookingId ? [{ bookingId: pi.metadata.bookingId, status: "PENDING" as const }] : [])], status: { not: "SUCCEEDED" } }, data: { status: "FAILED", stripePaymentIntentId: pi.id } });
      break;
    }
    case "charge.refunded": {
      const ch = event.data.object as Stripe.Charge;
      const id = piId(ch.payment_intent);
      if (!id) break;
      const payment = await prisma.payment.findFirst({ where: { stripePaymentIntentId: id } });
      if (payment && ch.refunded) {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
        // Full refund issued from the Stripe dashboard: the booking no longer holds a table.
        if (payment.bookingId) await prisma.booking.updateMany({ where: { id: payment.bookingId, status: "CONFIRMED" }, data: { status: "CANCELLED" } });
      }
      break;
    }
    case "account.updated": {
      const a = event.data.object as Stripe.Account;
      await prisma.restaurant.updateMany({ where: { stripeAccountId: a.id }, data: { canAcceptPaid: !!(a.charges_enabled && a.details_submitted) } });
      break;
    }
  }
}
