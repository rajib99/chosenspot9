import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { liveRestaurant, liveTable, getFilterOptions } from "@/lib/public-queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { tagMeta } from "@/lib/tags";

export const dynamic = "force-dynamic";

const steps = [
  ["Pick your seat", "Browse restaurants and choose the exact table — window, terrace, VIP or centre stage."],
  ["Choose a time", "Live availability, no phone calls. Free tables confirm instantly."],
  ["Show up & enjoy", "Get a confirmation, a calendar invite and free cancellation up to the cut-off."],
];

export default async function HomePage() {
  const [featured, options] = await Promise.all([
    prisma.restaurant.findMany({ where: { ...liveRestaurant, tables: { some: liveTable } }, orderBy: { createdAt: "desc" }, take: 3, include: { tables: { where: liveTable, select: { bookingFee: true } } } }),
    getFilterOptions(),
  ]);
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-cream-200/70 to-cream">
        <div className="container-page py-16 text-center sm:py-24">
          <p className="text-sm uppercase tracking-[0.25em] text-emerald">Premium table booking</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-semibold leading-[1.05] sm:text-7xl">Reserve the table you <em className="text-emerald">actually</em> want.</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-soft">The window seat. The terrace at sunset. The corner booth. Book the exact spot, not just a time.</p>
          <form action="/restaurants" className="mx-auto mt-10 grid max-w-2xl gap-3 rounded-2xl border border-line bg-white p-3 shadow-lift sm:grid-cols-[1.4fr_1fr_auto]" role="search">
            <div className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-ink-muted" /><Input name="q" placeholder="Restaurant or cuisine" className="border-0 pl-10 focus:ring-0" aria-label="Search" /></div>
            <Select name="city" className="border-0 focus:ring-0" aria-label="City"><option value="">Any city</option>{options.cities.map((c) => <option key={c}>{c}</option>)}</Select>
            <Button type="submit" size="lg">Find a table</Button>
          </form>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-center text-3xl font-semibold sm:text-4xl">Pick your spot</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {(["WINDOW", "TERRACE", "CENTER", "VIP"] as const).map((t) => {
            const m = tagMeta(t); const Icon = m.icon;
            return (
              <Link key={t} href={`/restaurants`} className="group">
                <Card className="flex flex-col items-center gap-3 p-6 text-center transition-shadow group-hover:shadow-lift">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full ${m.gold ? "bg-gold-light text-gold" : "bg-emerald-light text-emerald"}`}><Icon className="h-6 w-6" /></span>
                  <span className="font-serif text-lg">{m.label}</span>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-page pb-16">
          <div className="flex items-end justify-between"><h2 className="text-3xl font-semibold sm:text-4xl">Newly listed</h2><Link href="/restaurants" className="text-sm text-emerald hover:underline">View all →</Link></div>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {featured.map((r) => {
              const free = r.tables.some((t) => Number(t.bookingFee) === 0);
              return (
                <li key={r.id}>
                  <Link href={`/restaurants/${r.slug}`} className="group block">
                    <Card className="overflow-hidden transition-shadow group-hover:shadow-lift">
                      <div className="aspect-[16/10] overflow-hidden bg-cream-200">{/* eslint-disable-next-line @next/next/no-img-element */}{r.coverImageUrl && <img src={r.coverImageUrl} alt={r.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}</div>
                      <div className="p-5"><div className="flex items-start justify-between gap-2"><h3 className="text-xl font-semibold">{r.name}</h3>{free && <span className="rounded-full bg-emerald px-2.5 py-1 text-xs font-medium text-white">Free tables</span>}</div><p className="mt-1 text-sm text-ink-soft">{r.cuisine}</p><p className="mt-3 inline-flex items-center gap-1 text-sm text-ink-muted"><MapPin className="h-3.5 w-3.5" />{r.city}</p></div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="border-y border-line bg-white/60">
        <div className="container-page py-16">
          <h2 className="text-center text-3xl font-semibold sm:text-4xl">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map(([t, d], i) => (<li key={t} className="text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald font-serif text-lg text-white">{i + 1}</span><h3 className="mt-4 text-xl font-semibold">{t}</h3><p className="mt-2 text-ink-soft">{d}</p></li>))}
          </ol>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="rounded-2xl bg-emerald px-6 py-12 text-center text-cream sm:px-12">
          <h2 className="text-3xl font-semibold text-cream sm:text-4xl">Own a restaurant?</h2>
          <p className="mx-auto mt-3 max-w-xl text-cream/85">List your best tables, set your own fees and get paid out directly. One-time listing fee, no monthly subscription.</p>
          <Button asChild size="lg" variant="gold" className="mt-7"><Link href="/signup/restaurant">List your restaurant</Link></Button>
        </div>
      </section>
    </>
  );
}
