import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnerRestaurant, restaurantState } from "@/lib/owner";
import { StatusBanner } from "@/components/status-banner";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { markListingPaid } from "@/lib/listing";

export const metadata = { title: "Dashboard" };

export default async function RestaurantHome({ searchParams }: { searchParams: { listing?: string; session_id?: string } }) {
  let restaurant = await getOwnerRestaurant();
  if (!restaurant) redirect("/restaurant/onboarding");

  // Returning from Stripe Checkout: confirm directly so the UI is right even before the webhook lands.
  if (searchParams.session_id && restaurant.listingFeeStatus === "UNPAID" && stripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(searchParams.session_id);
      if (session.payment_status === "paid" && session.metadata?.restaurantId === restaurant.id) {
        await markListingPaid(restaurant.id, {
          sessionId: session.id,
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          amount: (session.amount_total ?? 0) / 100,
          currency: session.currency ?? "usd",
        });
        restaurant = (await getOwnerRestaurant())!;
      }
    } catch {}
  }

  const state = restaurantState(restaurant);
  const [tables, upcoming] = await Promise.all([
    prisma.table.count({ where: { restaurantId: restaurant.id, deletedAt: null } }),
    prisma.booking.count({ where: { table: { restaurantId: restaurant.id }, startAt: { gte: new Date() }, status: { in: ["CONFIRMED", "PENDING"] } } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Overview</h1>
      <StatusBanner restaurant={restaurant} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardBody><p className="text-sm text-ink-muted">Tables</p><p className="mt-1 font-serif text-3xl">{tables}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-ink-muted">Upcoming bookings</p><p className="mt-1 font-serif text-3xl">{upcoming}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-ink-muted">Status</p><p className="mt-1 font-serif text-3xl">{state.label}</p></CardBody></Card>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild><Link href="/restaurant/tables">Manage tables</Link></Button>
        {state.key === "live" && <Button asChild variant="outline"><Link href={`/restaurants/${restaurant.slug}`}>View public page</Link></Button>}
      </div>
    </div>
  );
}
