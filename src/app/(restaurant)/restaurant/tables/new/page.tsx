import { redirect } from "next/navigation";
import { getOwnerRestaurant } from "@/lib/owner";
import { getSettings } from "@/lib/settings";
import { TableForm } from "@/components/table-form";

export const metadata = { title: "New table" };

export default async function NewTablePage() {
  const r = await getOwnerRestaurant();
  if (!r) redirect("/restaurant/onboarding");
  const s = await getSettings();
  return (
    <div className="max-w-2xl">
      <h1 className="mb-8 text-3xl font-semibold">New table</h1>
      <TableForm currency={s.currency} canAcceptPaid={r.canAcceptPaid} />
    </div>
  );
}
