import Link from "next/link";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { liveRestaurant, liveTable, getFilterOptions } from "@/lib/public-queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Restaurants" };
export const dynamic = "force-dynamic";

type SP = { q?: string; city?: string; cuisine?: string; free?: string; maxFee?: string };

export default async function RestaurantsPage({ searchParams }: { searchParams: SP }) {
  const { q, city, cuisine, free } = searchParams;
  const maxFee = searchParams.maxFee ? Number(searchParams.maxFee) : undefined;
  const tableFilter = { ...liveTable, ...(free ? { bookingFee: 0 } : {}), ...(maxFee !== undefined && !Number.isNaN(maxFee) ? { bookingFee: { lte: maxFee } } : {}) };
  const [restaurants, options] = await Promise.all([
    prisma.restaurant.findMany({
      where: {
        ...liveRestaurant,
        ...(city ? { city } : {}),
        ...(cuisine ? { cuisine } : {}),
        ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }, { city: { contains: q, mode: "insensitive" } }] } : {}),
        tables: { some: tableFilter },
      },
      include: { tables: { where: liveTable, select: { bookingFee: true, currency: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getFilterOptions(),
  ]);

  return (
    <div className="container-page py-10">
      <h1 className="text-4xl font-semibold">Find your table</h1>
      <p className="mt-2 text-ink-soft">Handpicked restaurants, and the exact seat you want.</p>

      <form className="mt-8 grid gap-3 rounded-xl border border-line bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto_auto]" role="search">
        <Input name="q" placeholder="Search name, city…" defaultValue={q} aria-label="Search" />
        <Select name="city" defaultValue={city ?? ""} aria-label="City"><option value="">All cities</option>{options.cities.map((c) => <option key={c}>{c}</option>)}</Select>
        <Select name="cuisine" defaultValue={cuisine ?? ""} aria-label="Cuisine"><option value="">All cuisines</option>{options.cuisines.map((c) => <option key={c}>{c}</option>)}</Select>
        <Select name="maxFee" defaultValue={searchParams.maxFee ?? ""} aria-label="Price range">
          <option value="">Any fee</option><option value="20">Up to $20</option><option value="50">Up to $50</option><option value="100">Up to $100</option>
        </Select>
        <label className="flex h-11 items-center gap-2 whitespace-nowrap text-sm text-ink-soft"><input type="checkbox" name="free" value="1" defaultChecked={!!free} className="h-4 w-4 accent-emerald" />Free tables</label>
        <Button type="submit">Search</Button>
      </form>

      {restaurants.length === 0 ? (
        <Card className="mt-10 p-12 text-center">
          <p className="font-serif text-2xl">No restaurants match</p>
          <p className="mt-2 text-sm text-ink-soft">Try removing a filter or searching a different city.</p>
          <Button asChild variant="outline" className="mt-5"><Link href="/restaurants">Clear filters</Link></Button>
        </Card>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => {
            const fees = r.tables.map((t) => Number(t.bookingFee));
            const hasFree = fees.some((f) => f === 0);
            const min = Math.min(...fees);
            return (
              <li key={r.id}>
                <Link href={`/restaurants/${r.slug}`} className="group block">
                  <Card className="overflow-hidden transition-shadow group-hover:shadow-lift">
                    <div className="aspect-[16/10] overflow-hidden bg-cream-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {r.coverImageUrl && <img src={r.coverImageUrl} alt={r.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-xl font-semibold">{r.name}</h2>
                        {hasFree ? <span className="shrink-0 rounded-full bg-emerald px-2.5 py-1 text-xs font-medium text-white">Free tables</span> : null}
                      </div>
                      <p className="mt-1 text-sm text-ink-soft">{r.cuisine}</p>
                      <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{r.city}</span>
                        <span>{hasFree ? "From Free" : `From ${formatMoney(min, r.tables[0]?.currency)}`}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
