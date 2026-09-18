import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RestaurantActions } from "@/components/admin-actions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Admin · Restaurants" };
export const dynamic = "force-dynamic";

const tone = { PENDING: "warn", APPROVED: "success", SUSPENDED: "danger", REJECTED: "danger" } as const;
const FILTERS = ["ALL", "PENDING", "APPROVED", "SUSPENDED"] as const;

export default async function AdminRestaurants({ searchParams }: { searchParams: { status?: string } }) {
  const f = FILTERS.includes(searchParams.status as never) ? searchParams.status! : "ALL";
  const rows = await prisma.restaurant.findMany({ where: f === "ALL" ? {} : { status: f as never }, include: { owner: { select: { email: true } }, _count: { select: { tables: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Restaurants</h1>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((s) => <Link key={s} href={s === "ALL" ? "/admin/restaurants" : `/admin/restaurants?status=${s}`} className={cn("rounded-full px-4 py-1.5 text-sm", f === s ? "bg-emerald text-white" : "bg-cream-200 text-ink-soft hover:bg-cream-300")}>{s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}</Link>)}
      </div>
      {rows.length === 0 ? <Card className="p-10 text-center text-ink-soft">No restaurants in this view.</Card> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}><Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><Link href={`/admin/restaurants/${r.id}`} className="font-serif text-lg font-semibold hover:text-emerald">{r.name}</Link><Badge variant={tone[r.status]}>{r.status.charAt(0) + r.status.slice(1).toLowerCase()}</Badge>{r.listingFeeStatus === "UNPAID" && <Badge variant="warn">Fee unpaid</Badge>}</div>
                <p className="mt-1 text-sm text-ink-soft">{r.cuisine} · {r.city} · {r._count.tables} tables · {r.owner.email}</p>
              </div>
              <RestaurantActions id={r.id} status={r.status} paid={r.listingFeeStatus === "PAID"} />
            </Card></li>
          ))}
        </ul>
      )}
    </div>
  );
}
