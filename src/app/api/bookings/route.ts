import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { isSlotAvailable, isValidDate, zonedInstant } from "@/lib/availability";
import { validateCoupon } from "@/lib/pricing";
import { confirmBooking } from "@/lib/booking";
import { getStripe, devPaymentsSimulated, stripeConfigured, toMinor } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { appUrl } from "@/lib/utils";

const schema = z.object({
  tableId: z.string().min(1),
  date: z.string().refine(isValidDate, "Invalid date"),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.coerce.number().int(),
  partySize: z.coerce.number().int().min(1),
  guestName: z.string().trim().min(2, "Enter your name").max(80),
  guestEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
  guestPhone: z.string().trim().max(30).optional().or(z.literal("")),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  const rl = rateLimit(`booking:${clientIp(req)}`, 8, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many booking attempts. Please wait a few minutes." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;

  const table = await prisma.table.findFirst({ where: { id: d.tableId, isActive: true, deletedAt: null, restaurant: { status: "APPROVED", listingFeeStatus: "PAID" } }, include: { restaurant: true } });
  if (!table) return NextResponse.json({ error: "This table is no longer available." }, { status: 404 });
  if (d.partySize > table.capacity) return NextResponse.json({ error: `This table seats up to ${table.capacity} guests.` }, { status: 400 });
  if (!(await isSlotAvailable(table, table.restaurant.timezone, d.date, d.time, d.duration))) {
    return NextResponse.json({ error: "Sorry, that time was just taken. Please choose another slot." }, { status: 409 });
  }

  let fee = Number(table.bookingFee);
  let couponId: string | null = null;
  if (d.couponCode && fee > 0) {
    const c = await validateCoupon(d.couponCode, table);
    if (!c.valid) return NextResponse.json({ error: c.reason }, { status: 400 });
    fee = c.finalFee;
    couponId = c.coupon.id;
  }
  if (fee > 0 && !table.restaurant.canAcceptPaid && stripeConfigured()) {
    return NextResponse.json({ error: "This restaurant can't accept paid bookings yet." }, { status: 400 });
  }

  const session = await getSession();
  const booking = await prisma.booking.create({
    data: {
      tableId: table.id,
      customerId: session?.user?.role === "CUSTOMER" ? session.user.id : null,
      guestName: d.guestName, guestEmail: d.guestEmail, guestPhone: d.guestPhone || null,
      startAt: zonedInstant(d.date, d.time, table.restaurant.timezone),
      date: d.date, startTime: d.time, durationMinutes: d.duration, partySize: d.partySize,
      feeAmount: fee, couponId, status: "PENDING",
    },
  });

  if (fee <= 0) {
    await confirmBooking(booking.id);
    return NextResponse.json({ url: `/booking/${booking.cancelToken}` });
  }

  if (devPaymentsSimulated()) return NextResponse.json({ url: `/book/pay-simulated/${booking.cancelToken}` });
  if (!stripeConfigured()) return NextResponse.json({ error: "Payments aren't configured." }, { status: 503 });

  const settings = await getSettings();
  const amount = toMinor(fee);
  const platformFee = Math.round((amount * settings.commissionPercent) / 100);
  const useConnect = table.restaurant.canAcceptPaid && !!table.restaurant.stripeAccountId;
  const checkout = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: d.guestEmail,
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    line_items: [{ quantity: 1, price_data: { currency: table.currency, unit_amount: amount, product_data: { name: `${table.name} — ${table.restaurant.name}`, description: `${d.date} ${d.time} · ${d.partySize} guests` } } }],
    payment_intent_data: {
      metadata: { type: "BOOKING_FEE", bookingId: booking.id },
      ...(useConnect ? { application_fee_amount: platformFee, transfer_data: { destination: table.restaurant.stripeAccountId! } } : {}),
    },
    metadata: { type: "BOOKING_FEE", bookingId: booking.id, platformFee: String(platformFee / 100) },
    success_url: `${appUrl()}/booking/${booking.cancelToken}?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/booking/${booking.cancelToken}?canceled=1`,
  });
  await prisma.payment.create({ data: { bookingId: booking.id, restaurantId: table.restaurantId, type: "BOOKING_FEE", amount: fee, platformFee: platformFee / 100, currency: table.currency, stripeSessionId: checkout.id, status: "PENDING" } });
  return NextResponse.json({ url: checkout.url });
}
