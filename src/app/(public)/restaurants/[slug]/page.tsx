import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { liveRestaurant, liveTable } from "@/lib/public-queries";
import { Card } from "@/components/ui/card";
import { TagBadge, FeeBadge } from "@/components/tag-badge";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  return prisma.restaurant.findFirst({ where: { slug, ...liveRestaurant }, include: { tables: { where: liveTable, orderBy: { createdAt: "asc" } } } });
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const r = await load(params.slug);
  if (!r) return { title: "Restaurant not found" };
  return {
    title: r.name,
    description: r.description.slice(0, 155),
    openGraph: { title: `${r.name} · ChosenSpot`, description: r.description.slice(0, 155) },
  };
}

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  const r = await load(params.slug);
  if (!r) notFound();
  const images = [r.coverImageUrl, ...r.galleryImages].filter(Boolean) as string[];
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(`${r.address}, ${r.city}`)}&output=embed`;

  return (
    <div className="container-page py-8">
      <div className="grid gap-2 overflow-hidden rounded-xl sm:grid-cols-4 sm:grid-rows-2">
        {images.slice(0, 4).map((src, i) => (
          <div key={src + i} className={i === 0 ? "aspect-[16/10] sm:col-span-2 sm:row-span-2 sm:aspect-auto" : "hidden aspect-[16/10] sm:block"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={i === 0 ? r.name : ""} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div>
          <p className="text-sm uppercase tracking-widest text-emerald">{r.cuisine}</p>
          <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">{r.name}</h1>
          <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-ink-soft">{r.description}</p>

          <h2 className="mt-12 text-2xl font-semibold">Choose your table</h2>
          {r.tables.length === 0 ? (
            <Card className="mt-4 p-8 text-center text-ink-soft">No tables are open for booking right now.</Card>
          ) : (
            <ul className="mt-5 grid gap-5 sm:grid-cols-2">
              {r.tables.map((t) => (
                <li key={t.id}>
                  <Link href={`/restaurants/${r.slug}/tables/${t.id}`} className="group block">
                    <Card className="overflow-hidden transition-shadow group-hover:shadow-lift">
                      <div className="aspect-[16/10] overflow-hidden bg-cream-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {t.photos[0] && <img src={t.photos[0]} alt={t.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2"><TagBadge tag={t.locationTag} /><FeeBadge fee={Number(t.bookingFee)} currency={t.currency} /></div>
                        <h3 className="mt-3 text-lg font-semibold">{t.name}</h3>
                        <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink-muted"><Users className="h-3.5 w-3.5" />Up to {t.capacity} guests</p>
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="overflow-hidden">
            <iframe title={`Map of ${r.name}`} src={mapSrc} loading="lazy" className="h-56 w-full border-0" referrerPolicy="no-referrer-when-downgrade" />
            <div className="space-y-2 p-5 text-sm text-ink-soft">
              <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />{r.address}, {r.city}</p>
              {r.phone && <p className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />{r.phone}</p>}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
