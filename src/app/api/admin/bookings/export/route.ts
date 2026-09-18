import { prisma } from "@/lib/prisma";
import { adminOrNull } from "@/lib/admin";
import { bookingWhere } from "@/lib/booking-query";

const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // neutralise spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(req: Request) {
  if (!(await adminOrNull())) return new Response("Forbidden", { status: 403 });
  const u = new URL(req.url).searchParams;
  const rows = await prisma.booking.findMany({ where: bookingWhere({ q: u.get("q") ?? undefined, status: u.get("status") ?? undefined, restaurant: u.get("restaurant") ?? undefined, from: u.get("from") ?? undefined, to: u.get("to") ?? undefined }), include: { table: { include: { restaurant: true } } }, orderBy: { startAt: "desc" }, take: 10000 });
  const head = ["Reference", "Restaurant", "Table", "Date", "Time", "Duration", "Guests", "Guest name", "Guest email", "Guest phone", "Status", "Fee", "Currency", "Created"];
  const lines = [head.map(cell).join(","), ...rows.map((b) => [b.id.slice(-8).toUpperCase(), b.table.restaurant.name, b.table.name, b.date, b.startTime, b.durationMinutes, b.partySize, b.guestName, b.guestEmail, b.guestPhone, b.status, b.feeAmount.toString(), b.table.currency, b.createdAt.toISOString()].map(cell).join(","))];
  return new Response(lines.join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
