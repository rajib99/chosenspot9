import { redirect } from "next/navigation";
import { getOwnerRestaurant } from "@/lib/owner";
import { getSettings } from "@/lib/settings";
import { devPaymentsSimulated } from "@/lib/stripe";
import { formatMoney } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { PayListingButton } from "@/components/pay-listing-button";

export const metadata = { title: "Pay listing fee" };

export default async function PayListingPage({ searchParams }: { searchParams: { canceled?: string } }) {
  const restaurant = await getOwnerRestaurant();
  if (!restaurant) redirect("/restaurant/onboarding");
  if (restaurant.listingFeeStatus === "PAID") redirect("/restaurant");
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-3xl font-semibold">Activate your listing</h1>
      <p className="mt-2 text-ink-soft">A one-time listing fee puts <strong>{restaurant.name}</strong> in front of guests once our team approves it.</p>
      <Card className="mt-8">
        <CardBody>
          <div className="flex items-baseline justify-between">
            <span className="text-ink-soft">One-time listing fee</span>
            <span className="font-serif text-4xl">{formatMoney(settings.listingFee, settings.currency)}</span>
          </div>
          {searchParams.canceled && <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Payment was canceled — you can try again any time.</p>}
          <PayListingButton simulate={devPaymentsSimulated()} />
        </CardBody>
      </Card>
    </div>
  );
}
