import { redirect } from "next/navigation";
import { getOwnerRestaurant } from "@/lib/owner";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BookingStatusButtons } from "@/components/booking-status-buttons";

export const metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

const tone = { CONFIRMED: "success", PENDING: "warn", CANCELLED: "danger", COMPLETED: "default", NO_SHOW: "danger" } as const;

export default async function OwnerBookings() {
  const r = await getOwnerRestaurant();
  if (!r) redirect("/restaurant/onboarding");
  const bookings = await prisma.booking.findMany({ where: { table: { restaurantId: r.id }, NOT: { status: "PENDING" } }, include: { table: true }, orderBy: { startAt: "desc" }, take: 200 });
  const now = Date.now();
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Bookings</h1>
      {bookings.length === 0 ? <Card className="p-10 text-center"><p className="font-serif text-xl">No bookings yet</p><p className="mt-1 text-sm text-ink-soft">They&apos;ll appear here as guests reserve your tables.</p></Card> : (
        <ul className="space-y-3">
          {bookings.map((b) => (
            <li key={b.id}><Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{b.guestName}</span><Badge variant={tone[b.status]}>{b.status}</Badge></div>
                <p className="mt-1 text-sm text-ink-soft">{b.table.name} · {b.date} {b.startTime} · {b.durationMinutes} min · {b.partySize} guests · {Number(b.feeAmount) > 0 ? formatMoney(Number(b.feeAmount), b.table.currency) : "Free"}</p>
                <p className="text-sm text-ink-muted">{b.guestEmail}{b.guestPhone ? ` · ${b.guestPhone}` : ""}</p>
              </div>
              {b.status === "CONFIRMED" && b.startAt.getTime() <= now && <BookingStatusButtons id={b.id} />}
            </Card></li>
          ))}
        </ul>
      )}
    </div>
  );
}
