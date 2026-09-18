import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/card";
import { RestaurantActions } from "@/components/admin-actions";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantDetail({ params }: { params: { id: string } }) {
  const r = await prisma.restaurant.findUnique({ where: { id: params.id }, include: { owner: true, tables: { where: { deletedAt: null } }, _count: { select: { reviews: true } } } });
  if (!r) notFound();
  const bookings = await prisma.booking.count({ where: { table: { restaurantId: r.id } } });
  const rows: [string, string][] = [["Status", r.status], ["Listing fee", r.listingFeeStatus], ["Owner", `${r.owner.name ?? ""} <${r.owner.email}>`], ["Address", `${r.address}, ${r.city}`], ["Cuisine", r.cuisine], ["Timezone", r.timezone], ["Phone", r.phone ?? "—"], ["Contact email", r.email ?? "—"], ["Stripe Connect", r.stripeAccountId ? (r.canAcceptPaid ? "Connected" : "Incomplete") : "Not connected"], ["Bookings", String(bookings)]];
  return (
    <div className="max-w-3xl">
      <Link href="/admin/restaurants" className="text-sm text-ink-soft hover:text-ink">← Restaurants</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">{r.name}</h1><RestaurantActions id={r.id} status={r.status} paid={r.listingFeeStatus === "PAID"} /></div>
      <Card><CardBody className="space-y-2 text-sm">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-6"><span className="text-ink-muted">{k}</span><span className="text-right font-medium">{v}</span></div>)}</CardBody></Card>
      <p className="mt-6 whitespace-pre-line text-ink-soft">{r.description}</p>
      <h2 className="mb-3 mt-8 text-xl font-semibold">Tables</h2>
      <ul className="space-y-2 text-sm">{r.tables.map((t) => <li key={t.id} className="flex justify-between rounded-xl border border-line bg-white px-4 py-3"><span>{t.name} · {t.locationTag} · {t.capacity} guests</span><span>{Number(t.bookingFee) > 0 ? formatMoney(Number(t.bookingFee), t.currency) : "Free"}</span></li>)}{r.tables.length === 0 && <li className="text-ink-muted">No tables yet.</li>}</ul>
    </div>
  );
}
