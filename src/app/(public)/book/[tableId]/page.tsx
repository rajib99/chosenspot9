import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { liveRestaurant, liveTable } from "@/lib/public-queries";
import { isValidDate, zonedInstant } from "@/lib/availability";
import { BookingForm } from "@/components/booking-form";

export const metadata = { title: "Complete your booking" };
export const dynamic = "force-dynamic";

export default async function BookPage({ params, searchParams }: { params: { tableId: string }; searchParams: { date?: string; time?: string; duration?: string; party?: string } }) {
  const table = await prisma.table.findFirst({ where: { id: params.tableId, ...liveTable, restaurant: liveRestaurant }, include: { restaurant: true } });
  if (!table) notFound();
  const { date = "", time = "", duration, party } = searchParams;
  const back = `/restaurants/${table.restaurant.slug}/tables/${table.id}`;
  if (!isValidDate(date) || !/^\d{2}:\d{2}$/.test(time) || !Number(duration) || !Number(party)) redirect(back);

  const session = await getSession();
  const user = session?.user?.role === "CUSTOMER" ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true } }) : null;
  const startAt = zonedInstant(date, time, table.restaurant.timezone);

  return (
    <div className="container-page max-w-4xl py-8 sm:py-12">
      <Link href={back} className="text-sm text-ink-soft hover:text-ink">← Change selection</Link>
      <h1 className="mb-8 mt-3 text-3xl font-semibold sm:text-4xl">Complete your booking</h1>
      <BookingForm
        table={{ id: table.id, name: table.name, tag: table.locationTag, photo: table.photos[0] ?? null, fee: Number(table.bookingFee), currency: table.currency, restaurantName: table.restaurant.name, address: `${table.restaurant.address}, ${table.restaurant.city}` }}
        selection={{ date, time, duration: Number(duration), party: Number(party), pretty: formatInTimeZone(startAt, table.restaurant.timezone, "EEEE, d MMMM yyyy 'at' HH:mm") }}
        prefill={{ name: user?.name ?? "", email: user?.email ?? "" }}
      />
    </div>
  );
}
