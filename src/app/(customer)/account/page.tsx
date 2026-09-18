import Link from "next/link";
import { redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { CalendarDays, Users } from "lucide-react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "My bookings" };
export const dynamic = "force-dynamic";

const statusBadge = { CONFIRMED: "success", PENDING: "warn", CANCELLED: "danger", COMPLETED: "default", NO_SHOW: "danger" } as const;

export default async function AccountPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/account");
  const [me, settings] = await Promise.all([prisma.user.findUnique({ where: { id: session.user.id } }), getSettings()]);
  if (!me) redirect("/login");

  // Include bookings made as a guest with the same email.
  const bookings = await prisma.booking.findMany({
    where: { OR: [{ customerId: me.id }, { guestEmail: me.email }], NOT: { status: "PENDING" } },
    include: { table: { include: { restaurant: true } } },
    orderBy: { startAt: "desc" },
  });
  const now = Date.now();
  const upcoming = bookings.filter((b) => b.startAt.getTime() >= now && b.status === "CONFIRMED").reverse();
  const past = bookings.filter((b) => !(b.startAt.getTime() >= now && b.status === "CONFIRMED"));

  const row = (b: (typeof bookings)[number]) => {
    const hoursLeft = (b.startAt.getTime() - now) / 3_600_000;
    const changeable = b.status === "CONFIRMED" && hoursLeft >= settings.cancellationWindowHours;
    const fee = Number(b.feeAmount);
    return (
      <li key={b.id}>
        <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/restaurants/${b.table.restaurant.slug}`} className="font-serif text-lg font-semibold hover:text-emerald">{b.table.restaurant.name}</Link>
              <Badge variant={statusBadge[b.status]}>{b.status.charAt(0) + b.status.slice(1).toLowerCase().replace("_", " ")}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">{b.table.name}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatInTimeZone(b.startAt, b.table.restaurant.timezone, "EEE d MMM yyyy, HH:mm")}</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{b.partySize}</span>
              <span>{fee > 0 ? formatMoney(fee, b.table.currency) : "Free"}</span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {b.status === "CONFIRMED" && !changeable && b.startAt.getTime() >= now && <span className="text-xs text-ink-muted">Contact restaurant to change</span>}
            <Button asChild variant={changeable ? "default" : "outline"} size="sm"><Link href={`/booking/${b.cancelToken}`}>{changeable ? "Manage" : "View"}</Link></Button>
          </div>
        </Card>
      </li>
    );
  };

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-4xl font-semibold">My bookings</h1>
      <p className="mt-1 text-ink-soft">Hello, {me.name ?? me.email}. Free cancellation and changes up to {settings.cancellationWindowHours}h before your booking.</p>

      <h2 className="mb-4 mt-10 text-xl font-semibold">Upcoming</h2>
      {upcoming.length ? <ul className="space-y-3">{upcoming.map(row)}</ul> : (
        <Card className="p-8 text-center"><p className="font-serif text-lg">Nothing booked yet</p><p className="mt-1 text-sm text-ink-soft">Find a table you&apos;ll love.</p><Button asChild className="mt-4"><Link href="/restaurants">Browse restaurants</Link></Button></Card>
      )}

      {past.length > 0 && (<><h2 className="mb-4 mt-10 text-xl font-semibold">Past &amp; cancelled</h2><ul className="space-y-3">{past.map(row)}</ul></>)}
    </div>
  );
}
