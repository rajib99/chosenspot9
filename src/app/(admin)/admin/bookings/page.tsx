import { prisma } from "@/lib/prisma";
import { bookingWhere } from "@/lib/booking-query";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";

export const metadata = { title: "Admin · Bookings" };
export const dynamic = "force-dynamic";

const tone = { CONFIRMED: "success", PENDING: "warn", CANCELLED: "danger", COMPLETED: "default", NO_SHOW: "danger" } as const;
type SP = { q?: string; status?: string; restaurant?: string; from?: string; to?: string };

export default async function AdminBookings({ searchParams }: { searchParams: SP }) {
  const [rows, restaurants] = await Promise.all([
    prisma.booking.findMany({ where: bookingWhere(searchParams), include: { table: { include: { restaurant: true } } }, orderBy: { startAt: "desc" }, take: 200 }),
    prisma.restaurant.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const qs = new URLSearchParams(Object.entries(searchParams).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-semibold">Bookings</h1><Button asChild variant="outline"><a href={`/api/admin/bookings/export${qs ? `?${qs}` : ""}`}>Export CSV</a></Button></div>
      <form className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" role="search">
        <Input name="q" placeholder="Guest, email, reference" defaultValue={searchParams.q} aria-label="Search" />
        <Select name="status" defaultValue={searchParams.status ?? ""} aria-label="Status"><option value="">Any status</option>{["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"].map((s) => <option key={s}>{s}</option>)}</Select>
        <Select name="restaurant" defaultValue={searchParams.restaurant ?? ""} aria-label="Restaurant"><option value="">All restaurants</option>{restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select>
        <Input name="from" type="date" defaultValue={searchParams.from} aria-label="From" /><Input name="to" type="date" defaultValue={searchParams.to} aria-label="To" />
        <Button type="submit" className="sm:col-span-2 lg:col-span-5 lg:w-fit">Filter</Button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-soft">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Restaurant / table</th><th className="px-4 py-3">When (local)</th><th className="px-4 py-3">Guest</th><th className="px-4 py-3">Guests</th><th className="px-4 py-3">Fee</th><th className="px-4 py-3">Status</th></tr></thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{b.id.slice(-8).toUpperCase()}</td>
                <td className="px-4 py-3"><div className="font-medium">{b.table.restaurant.name}</div><div className="text-ink-muted">{b.table.name}</div></td>
                <td className="px-4 py-3">{b.date} {b.startTime}</td>
                <td className="px-4 py-3"><div>{b.guestName}</div><div className="text-ink-muted">{b.guestEmail}</div></td>
                <td className="px-4 py-3">{b.partySize}</td>
                <td className="px-4 py-3">{Number(b.feeAmount) > 0 ? formatMoney(Number(b.feeAmount), b.table.currency) : "Free"}</td>
                <td className="px-4 py-3"><Badge variant={tone[b.status]}>{b.status}</Badge></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-ink-soft">No bookings match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
