import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { getBookingByToken, sendCancellationEmails } from "@/lib/booking";

export type CancelResult = { ok: true; refunded: boolean } | { ok: false; error: string; code: "NOT_FOUND" | "CLOSED" | "CUTOFF" | "REFUND_FAILED" };

/** Guest/customer-initiated cancellation. Refunds automatically when inside the free-cancellation window. */
export async function cancelBookingByToken(token: string): Promise<CancelResult> {
  const b = await getBookingByToken(token);
  if (!b) return { ok: false, error: "Booking not found.", code: "NOT_FOUND" };
  if (b.status !== "CONFIRMED" && b.status !== "PENDING") return { ok: false, error: "This booking can no longer be cancelled.", code: "CLOSED" };

  const settings = await getSettings();
  const hoursLeft = (b.startAt.getTime() - Date.now()) / 3_600_000;
  if (b.status === "CONFIRMED" && hoursLeft < settings.cancellationWindowHours) {
    return { ok: false, code: "CUTOFF", error: `Bookings can only be cancelled online up to ${settings.cancellationWindowHours}h before the start time. Please contact the restaurant.` };
  }

  let refunded = false;
  const payment = await prisma.payment.findFirst({ where: { bookingId: b.id, type: "BOOKING_FEE", status: "SUCCEEDED" } });
  if (payment) {
    if (payment.stripePaymentIntentId && stripeConfigured()) {
      try {
        await getStripe().refunds.create({ payment_intent: payment.stripePaymentIntentId, ...(b.table.restaurant.stripeAccountId ? { reverse_transfer: true, refund_application_fee: true } : {}) });
      } catch (e) {
        console.error("[refund] failed", e);
        return { ok: false, code: "REFUND_FAILED", error: "We couldn't process the refund automatically. Please contact the restaurant." };
      }
    }
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
    refunded = true;
  }

  await prisma.booking.update({ where: { id: b.id }, data: { status: "CANCELLED" } });
  if (b.couponId) await prisma.coupon.updateMany({ where: { id: b.couponId, timesRedeemed: { gt: 0 } }, data: { timesRedeemed: { decrement: 1 } } });
  await sendCancellationEmails(b, refunded).catch(() => {});
  return { ok: true, refunded };
}
