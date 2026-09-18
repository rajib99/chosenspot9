import { notFound, redirect } from "next/navigation";
import { getOwnerRestaurant } from "@/lib/owner";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { TableForm } from "@/components/table-form";

export const metadata = { title: "Edit table" };

export default async function EditTablePage({ params }: { params: { id: string } }) {
  const r = await getOwnerRestaurant();
  if (!r) redirect("/restaurant/onboarding");
  const t = await prisma.table.findFirst({ where: { id: params.id, restaurantId: r.id, deletedAt: null } });
  if (!t) notFound();
  const s = await getSettings();
  return (
    <div className="max-w-2xl">
      <h1 className="mb-8 text-3xl font-semibold">Edit table</h1>
      <TableForm
        tableId={t.id}
        currency={t.currency || s.currency}
        canAcceptPaid={r.canAcceptPaid}
        initial={{ name: t.name, description: t.description, locationTag: t.locationTag, capacity: t.capacity, bookingFee: Number(t.bookingFee), photos: t.photos, isActive: t.isActive, openDays: t.openDays, openTime: t.openTime, closeTime: t.closeTime, minDuration: t.minDuration, maxDuration: t.maxDuration, bufferMinutes: t.bufferMinutes }}
      />
    </div>
  );
}
