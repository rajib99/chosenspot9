import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { emailButton, emailLayout, sendEmail } from "@/lib/email";
import { appUrl, formatMoney } from "@/lib/utils";

const bookingInclude = { table: { include: { restaurant: { include: { owner: { select: { email: true, name: true } } } } } } } as const;

export async function getBookingByToken(token: string) {
  return prisma.booking.findUnique({ where: { cancelToken: token }, include: bookingInclude });
}

export type FullBooking = NonNullable<Awaited<ReturnType<typeof getBookingByToken>>>;

export const whenText = (b: FullBooking) => formatInTimeZone(b.startAt, b.table.restaurant.timezone, "EEEE, d MMMM yyyy 'at' HH:mm");

function summaryHtml(b: FullBooking) {
  const r = b.table.restaurant;
  return `<table style="width:100%;font-size:14px;border-collapse:collapse">
  <tr><td style="padding:6px 0;color:#7a746a">Restaurant</td><td style="text-align:right"><strong>${r.name}</strong></td></tr>
  <tr><td style="padding:6px 0;color:#7a746a">Table</td><td style="text-align:right">${b.table.name}</td></tr>
  <tr><td style="padding:6px 0;color:#7a746a">When</td><td style="text-align:right">${whenText(b)}</td></tr>
  <tr><td style="padding:6px 0;color:#7a746a">Duration</td><td style="text-align:right">${b.durationMinutes} min</td></tr>
  <tr><td style="padding:6px 0;color:#7a746a">Guests</td><td style="text-align:right">${b.partySize}</td></tr>
  <tr><td style="padding:6px 0;color:#7a746a">Booking fee</td><td style="text-align:right">${Number(b.feeAmount) > 0 ? formatMoney(Number(b.feeAmount), b.table.currency) : "Free"}</td></tr>
  <tr><td style="padding:6px 0;color:#7a746a">Address</td><td style="text-align:right">${r.address}, ${r.city}</td></tr></table>`;
}

export const manageUrl = (b: { cancelToken: string }) => `${appUrl()}/booking/${b.cancelToken}`;

export async function sendBookingEmails(b: FullBooking) {
  const r = b.table.restaurant;
  await Promise.all([
    sendEmail({
      to: b.guestEmail,
      subject: `Your table at ${r.name} is confirmed`,
      html: emailLayout(`You're booked, ${b.guestName.split(" ")[0]}!`, `<p>Your table is reserved.</p>${summaryHtml(b)}${emailButton(manageUrl(b), "View or cancel booking")}<p style="font-size:12px">Add to calendar: ${appUrl()}/api/booking/${b.cancelToken}/ics</p>`),
    }),
    sendEmail({
      to: r.email || r.owner.email,
      subject: `New booking: ${b.table.name} — ${b.guestName}`,
      html: emailLayout("New booking", `<p><strong>${b.guestName}</strong> (${b.guestEmail}${b.guestPhone ? `, ${b.guestPhone}` : ""}) booked a table.</p>${summaryHtml(b)}${emailButton(`${appUrl()}/restaurant/bookings`, "Open dashboard")}`),
    }),
  ]);
}

export async function sendCancellationEmails(b: FullBooking, refunded: boolean) {
  const r = b.table.restaurant;
  await Promise.all([
    sendEmail({ to: b.guestEmail, subject: `Your booking at ${r.name} was cancelled`, html: emailLayout("Booking cancelled", `<p>Your reservation has been cancelled.${refunded ? " Your booking fee will be refunded to your original payment method." : ""}</p>${summaryHtml(b)}`) }),
    sendEmail({ to: r.email || r.owner.email, subject: `Booking cancelled: ${b.table.name} — ${b.guestName}`, html: emailLayout("Booking cancelled", `<p>${b.guestName} cancelled their booking.</p>${summaryHtml(b)}`) }),
  ]);
}

/** Idempotent: confirms a PENDING booking after payment (or immediately for free tables). */
export async function confirmBooking(bookingId: string, pay?: { sessionId?: string; paymentIntentId?: string | null; amount?: number; currency?: string; platformFee?: number }) {
  const claimed = await prisma.booking.updateMany({
    where: { id: bookingId, status: "PENDING" },
    data: { status: "CONFIRMED", ...(pay?.paymentIntentId ? { stripePaymentIntentId: pay.paymentIntentId } : {}) },
  });
  if (claimed.count === 0) return false; // already confirmed / cancelled: nothing more to do
  const b = await prisma.booking.findUnique({ where: { id: bookingId }, include: bookingInclude });
  if (!b) return false;

  if (pay) {
    const existing = pay.sessionId ? await prisma.payment.findFirst({ where: { bookingId, stripeSessionId: pay.sessionId } }) : null;
    if (existing) await prisma.payment.update({ where: { id: existing.id }, data: { status: "SUCCEEDED", stripePaymentIntentId: pay.paymentIntentId ?? undefined } });
    else await prisma.payment.create({ data: { bookingId, restaurantId: b.table.restaurantId, type: "BOOKING_FEE", amount: pay.amount ?? Number(b.feeAmount), platformFee: pay.platformFee ?? 0, currency: pay.currency ?? b.table.currency, stripeSessionId: pay.sessionId, stripePaymentIntentId: pay.paymentIntentId ?? undefined, status: "SUCCEEDED" } });
  }
  if (b.couponId) {
    // Guarded increment so a race can't push past maxRedemptions.
    const c = await prisma.coupon.findUnique({ where: { id: b.couponId } });
    if (c) await prisma.coupon.updateMany({ where: { id: c.id, ...(c.maxRedemptions !== null ? { timesRedeemed: { lt: c.maxRedemptions } } : {}) }, data: { timesRedeemed: { increment: 1 } } });
  }
  await sendBookingEmails(b as FullBooking);
  return true;
}
