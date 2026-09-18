import { getBookingByToken } from "@/lib/booking";
import { buildIcs } from "@/lib/calendar";

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const b = await getBookingByToken(params.token);
  if (!b || b.status === "CANCELLED") return new Response("Not found", { status: 404 });
  const r = b.table.restaurant;
  const ics = buildIcs({ id: b.id, startAt: b.startAt, durationMinutes: b.durationMinutes, summary: `${b.table.name} at ${r.name}`, location: `${r.name}, ${r.address}, ${r.city}`, description: `Table booking for ${b.partySize}. Manage: ${process.env.NEXT_PUBLIC_APP_URL ?? ""}/booking/${b.cancelToken}` });
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="booking-${b.id}.ics"` } });
}
