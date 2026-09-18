import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";

export const SLOT_STEP_MINUTES = 30;
/** An unpaid PENDING booking holds its slot only this long (matches the Stripe Checkout window). */
export const PENDING_HOLD_MINUTES = 35;

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const pad = (n: number) => String(n).padStart(2, "0");
export const fmtMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** UTC instant for a wall-clock date + time in the restaurant's timezone. */
export function zonedInstant(date: string, time: string, tz: string) {
  return fromZonedTime(`${date}T${time}:00`, tz);
}

export function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
}

export type Slot = { time: string; available: boolean };

type TableRules = { id: string; openDays: number[]; openTime: string; closeTime: string; minDuration: number; maxDuration: number; bufferMinutes: number };

export function durationOptions(t: Pick<TableRules, "minDuration" | "maxDuration">) {
  const out: number[] = [];
  for (let d = t.minDuration; d <= t.maxDuration; d += 30) out.push(d);
  if (!out.length) out.push(t.minDuration);
  return out;
}

/**
 * Slots for a table on a date, computed from its availability rules minus existing
 * PENDING/CONFIRMED bookings (including the buffer after each booking).
 */
export async function computeSlots(table: TableRules, timezone: string, date: string, duration: number, now = new Date(), excludeBookingId?: string): Promise<Slot[]> {
  if (!isValidDate(date)) return [];
  if (duration < table.minDuration || duration > table.maxDuration) return [];
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (!table.openDays.includes(weekday)) return [];

  const dayStart = zonedInstant(date, "00:00", timezone);
  const bookings = await prisma.booking.findMany({
    where: {
      tableId: table.id,
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      OR: [{ status: "CONFIRMED" }, { status: "PENDING", createdAt: { gte: new Date(now.getTime() - PENDING_HOLD_MINUTES * 60_000) } }],
      startAt: { gte: new Date(dayStart.getTime() - 24 * 3600_000), lte: new Date(dayStart.getTime() + 48 * 3600_000) },
    },
    select: { startAt: true, durationMinutes: true },
  });
  const busy = bookings.map((b) => ({ start: b.startAt.getTime(), end: b.startAt.getTime() + (b.durationMinutes + table.bufferMinutes) * 60_000 }));

  const slots: Slot[] = [];
  const open = toMin(table.openTime);
  const close = toMin(table.closeTime);
  for (let s = open; s + duration <= close; s += SLOT_STEP_MINUTES) {
    const time = fmtMin(s);
    const start = zonedInstant(date, time, timezone).getTime();
    const end = start + (duration + table.bufferMinutes) * 60_000;
    const inPast = start <= now.getTime();
    const clash = busy.some((b) => start < b.end && end > b.start);
    slots.push({ time, available: !inPast && !clash });
  }
  return slots;
}

export async function isSlotAvailable(table: TableRules, timezone: string, date: string, time: string, duration: number) {
  const slots = await computeSlots(table, timezone, date, duration);
  return slots.some((s) => s.time === time && s.available);
}
