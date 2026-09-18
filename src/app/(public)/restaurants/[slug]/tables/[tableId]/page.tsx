import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { liveRestaurant, liveTable } from "@/lib/public-queries";
import { TagBadge, FeeBadge } from "@/components/tag-badge";
import { Card, CardBody } from "@/components/ui/card";
import { BookingWidget } from "@/components/booking-widget";
import { durationOptions } from "@/lib/availability";
import { stripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

async function load(slug: string, tableId: string) {
  return prisma.table.findFirst({ where: { id: tableId, ...liveTable, restaurant: { slug, ...liveRestaurant } }, include: { restaurant: true } });
}

export async function generateMetadata({ params }: { params: { slug: string; tableId: string } }) {
  const t = await load(params.slug, params.tableId);
  return t ? { title: `${t.name} at ${t.restaurant.name}`, description: t.description.slice(0, 155) } : { title: "Table not found" };
}

export default async function TablePage({ params }: { params: { slug: string; tableId: string } }) {
  const t = await load(params.slug, params.tableId);
  if (!t) notFound();
  const fee = Number(t.bookingFee);
  const paidUnavailable = fee > 0 && !t.restaurant.canAcceptPaid && stripeConfigured();
  return (
    <div className="container-page py-8">
      <Link href={`/restaurants/${t.restaurant.slug}`} className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"><ChevronLeft className="h-4 w-4" />{t.restaurant.name}</Link>
      <div className="mt-5 grid gap-10 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="grid gap-2 overflow-hidden rounded-xl sm:grid-cols-2">
            {t.photos.slice(0, 3).map((src, i) => (
              <div key={src} className={i === 0 ? "aspect-[16/10] sm:col-span-2" : "hidden aspect-[16/10] sm:block"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={i === 0 ? t.name : ""} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3"><TagBadge tag={t.locationTag} /><FeeBadge fee={fee} currency={t.currency} /></div>
          <h1 className="mt-3 text-4xl font-semibold">{t.name}</h1>
          <p className="mt-2 inline-flex items-center gap-1.5 text-ink-soft"><Users className="h-4 w-4" />Seats up to {t.capacity} guests</p>
          <p className="mt-5 whitespace-pre-line text-lg leading-relaxed text-ink-soft">{t.description}</p>
        </div>
        <aside>
          <Card className="sticky top-24">
            <CardBody>
              <h2 className="text-xl font-semibold">Reserve this table</h2>
              <p className="mb-5 mt-1 text-sm text-ink-muted">{fee > 0 ? "A booking fee secures your spot." : "Free — no payment needed."}</p>
              {paidUnavailable ? <p className="rounded-xl bg-cream-200 p-4 text-sm text-ink-soft">This restaurant isn&apos;t accepting paid bookings just yet. Please check back soon.</p> : <BookingWidget tableId={t.id} capacity={t.capacity} durations={durationOptions(t)} timezone={t.restaurant.timezone} openDays={t.openDays} />}
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
