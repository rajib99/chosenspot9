import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { BarChart } from "@/components/bar-chart";

export const metadata = { title: "Admin overview" };
export const dynamic = "force-dynamic";

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

export default async function AdminOverview() {
  const since = new Date(Date.now() - 29 * 86400000);
  since.setUTCHours(0, 0, 0, 0);
  const [settings, restaurants, pending, bookings, payments, recentBookings, recentPayments] = await Promise.all([
    getSettings(),
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { status: "PENDING", listingFeeStatus: "PAID" } }),
    prisma.booking.count({ where: { status: { in: ["CONFIRMED", "COMPLETED"] } } }),
    prisma.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amount: true, platformFee: true } , _count: true }),
    prisma.booking.findMany({ where: { createdAt: { gte: since }, status: { in: ["CONFIRMED", "COMPLETED"] } }, select: { createdAt: true } }),
    prisma.payment.findMany({ where: { createdAt: { gte: since }, status: "SUCCEEDED" }, select: { createdAt: true, type: true, amount: true, platformFee: true } }),
  ]);
  const listing = await prisma.payment.aggregate({ where: { status: "SUCCEEDED", type: "LISTING_FEE" }, _sum: { amount: true } });
  const revenue = Number(payments._sum.platformFee ?? 0) + Number(listing._sum.amount ?? 0);

  const days = Array.from({ length: 30 }, (_, i) => dayKey(new Date(since.getTime() + i * 86400000)));
  const bByDay = Object.fromEntries(days.map((d) => [d, 0]));
  const rByDay = Object.fromEntries(days.map((d) => [d, 0]));
  recentBookings.forEach((b) => { const k = dayKey(b.createdAt); if (k in bByDay) bByDay[k]++; });
  recentPayments.forEach((p) => { const k = dayKey(p.createdAt); if (k in rByDay) rByDay[k] += p.type === "LISTING_FEE" ? Number(p.amount) : Number(p.platformFee); });

  const stats = [["Restaurants", String(restaurants)], ["Pending approvals", String(pending)], ["Total bookings", String(bookings)], ["Platform revenue", formatMoney(revenue, settings.currency)]];
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Overview</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([k, v]) => <Card key={k}><CardBody><p className="text-sm text-ink-muted">{k}</p><p className="mt-1 font-serif text-3xl" data-testid={`stat-${k}`}>{v}</p></CardBody></Card>)}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <BarChart title="Bookings per day" unitLabel="· last 30 days" data={days.map((d) => ({ label: d, value: bByDay[d] }))} />
        <BarChart title="Revenue per day" unitLabel="· last 30 days" kind="money" currency={settings.currency} data={days.map((d) => ({ label: d, value: rByDay[d] }))} />
      </div>
      <p className="mt-3 text-xs text-ink-muted">Revenue = platform commission on booking fees + restaurant listing fees.</p>
    </div>
  );
}
