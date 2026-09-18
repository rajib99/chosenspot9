import Link from "next/link";
import { restaurantState } from "@/lib/owner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tone = { warn: "border-amber-200 bg-amber-50 text-amber-900", danger: "border-red-200 bg-red-50 text-red-900", success: "border-emerald/20 bg-emerald-light text-emerald-dark" };

export function StatusBanner({ restaurant }: { restaurant: { status: string; listingFeeStatus: string } }) {
  const s = restaurantState(restaurant);
  return (
    <div className={cn("mb-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between", tone[s.tone])} data-testid="status-banner">
      <div>
        <p className="text-sm font-semibold">{s.label}</p>
        <p className="text-sm opacity-90">{s.text}</p>
      </div>
      {s.key === "unpaid" && <Button asChild size="sm"><Link href="/restaurant/pay-listing">Pay listing fee</Link></Button>}
    </div>
  );
}
