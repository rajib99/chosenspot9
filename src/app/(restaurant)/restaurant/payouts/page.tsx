import { redirect } from "next/navigation";
import { getOwnerRestaurant } from "@/lib/owner";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectButton } from "@/components/connect-buttons";

export const metadata = { title: "Payouts" };
export const dynamic = "force-dynamic";

export default async function PayoutsPage({ searchParams }: { searchParams: { return?: string } }) {
  let r = await getOwnerRestaurant();
  if (!r) redirect("/restaurant/onboarding");

  // Back from onboarding: sync immediately instead of waiting for account.updated.
  if (r.stripeAccountId && stripeConfigured()) {
    try {
      const a = await getStripe().accounts.retrieve(r.stripeAccountId);
      const ready = !!(a.charges_enabled && a.details_submitted);
      if (ready !== r.canAcceptPaid) r = await prisma.restaurant.update({ where: { id: r.id }, data: { canAcceptPaid: ready } });
    } catch {}
  }

  const [settings, agg] = await Promise.all([
    getSettings(),
    prisma.payment.aggregate({ where: { restaurantId: r.id, type: "BOOKING_FEE", status: "SUCCEEDED" }, _sum: { amount: true, platformFee: true }, _count: true }),
  ]);
  const gross = Number(agg._sum.amount ?? 0);
  const fees = Number(agg._sum.platformFee ?? 0);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-3xl font-semibold">Payouts</h1>
      <Card><CardBody className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-xl font-semibold">Stripe account</h2><p className="text-sm text-ink-soft">Booking fees are paid out to your Stripe account, minus a {settings.commissionPercent}% platform commission.</p></div>
          <Badge variant={r.canAcceptPaid ? "success" : "warn"}>{r.canAcceptPaid ? "Connected" : r.stripeAccountId ? "Action needed" : "Not connected"}</Badge>
        </div>
        {!stripeConfigured() && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Stripe isn&apos;t configured on this server yet (STRIPE_SECRET_KEY missing), so Connect onboarding is unavailable.</p>}
        {searchParams.return && !r.canAcceptPaid && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Onboarding isn&apos;t finished yet — continue where you left off.</p>}
        <div className="flex flex-wrap gap-3">
          {!r.canAcceptPaid && <ConnectButton endpoint="/api/restaurant/connect" label={r.stripeAccountId ? "Continue Stripe onboarding" : "Connect Stripe account"} />}
          {r.canAcceptPaid && <ConnectButton endpoint="/api/restaurant/connect/dashboard" label="Open Stripe dashboard" variant="outline" />}
        </div>
      </CardBody></Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card><CardBody><p className="text-sm text-ink-muted">Paid bookings</p><p className="mt-1 font-serif text-3xl">{agg._count}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-ink-muted">Gross fees</p><p className="mt-1 font-serif text-3xl">{formatMoney(gross, settings.currency)}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-ink-muted">Your payout</p><p className="mt-1 font-serif text-3xl">{formatMoney(gross - fees, settings.currency)}</p></CardBody></Card>
      </div>
    </div>
  );
}
