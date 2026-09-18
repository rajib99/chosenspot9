import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getOwnerRestaurant } from "@/lib/owner";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TagBadge, FeeBadge } from "@/components/tag-badge";
import { TableActiveToggle } from "@/components/table-active-toggle";

export const metadata = { title: "Tables" };

export default async function TablesPage() {
  const r = await getOwnerRestaurant();
  if (!r) redirect("/restaurant/onboarding");
  const tables = await prisma.table.findMany({ where: { restaurantId: r.id, deletedAt: null }, orderBy: { createdAt: "asc" } });
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Tables</h1>
        <Button asChild><Link href="/restaurant/tables/new">Add table</Link></Button>
      </div>
      {tables.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-serif text-xl">No tables yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">Add your window seats, terrace spots or VIP booths — each one is bookable on its own.</p>
          <Button asChild className="mt-5"><Link href="/restaurant/tables/new">Create your first table</Link></Button>
        </Card>
      ) : (
        <ul className="space-y-3">
          {tables.map((t) => (
            <li key={t.id}>
              <Card className="flex flex-wrap items-center gap-4 p-3 sm:flex-nowrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {t.photos[0] ? <img src={t.photos[0]} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" /> : <div className="h-16 w-24 shrink-0 rounded-lg bg-cream-200" />}
                <div className="min-w-0 flex-1">
                  <Link href={`/restaurant/tables/${t.id}`} className="block truncate font-medium hover:text-emerald">{t.name}</Link>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
                    <TagBadge tag={t.locationTag} />
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t.capacity}</span>
                    <FeeBadge fee={Number(t.bookingFee)} currency={t.currency} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TableActiveToggle id={t.id} initial={t.isActive} />
                  <Button asChild variant="outline" size="sm"><Link href={`/restaurant/tables/${t.id}`}>Edit</Link></Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
