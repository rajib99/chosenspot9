import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getBookingByToken } from "@/lib/booking";
import { computeSlots, isValidDate, zonedInstant } from "@/lib/availability";
import { getSettings } from "@/lib/settings";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { sendEmail, emailLayout } from "@/lib/email";

const schema = z.object({ token: z.string().min(10), date: z.string().refine(isValidDate), time: z.string().regex(/^\d{2}:\d{2}$/) });

export async function POST(req: Request) {
  if (!rateLimit(`resched:${clientIp(req)}`, 10, 60_000).ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { token, date, time } = parsed.data;
  const b = await getBookingByToken(token);
  if (!b || b.status !== "CONFIRMED") return NextResponse.json({ error: "This booking can't be changed." }, { status: 400 });

  const settings = await getSettings();
  if ((b.startAt.getTime() - Date.now()) / 3_600_000 < settings.cancellationWindowHours) {
    return NextResponse.json({ error: `Changes are only possible up to ${settings.cancellationWindowHours}h before the start time. Please contact the restaurant.` }, { status: 400 });
  }
  const tz = b.table.restaurant.timezone;
  // Own current slot must not block the move (e.g. shifting by 30 minutes).
  const slots = await computeSlots(b.table, tz, date, b.durationMinutes, new Date(), b.id);
  if (!slots.some((s) => s.time === time && s.available)) return NextResponse.json({ error: "That time isn't available." }, { status: 409 });

  await prisma.booking.update({ where: { id: b.id }, data: { date, startTime: time, startAt: zonedInstant(date, time, tz) } });
  await sendEmail({ to: b.guestEmail, subject: `Your booking at ${b.table.restaurant.name} was moved`, html: emailLayout("Booking updated", `<p>Your table is now booked for <strong>${date} at ${time}</strong> (${tz}).</p>`) });
  return NextResponse.json({ ok: true });
}
