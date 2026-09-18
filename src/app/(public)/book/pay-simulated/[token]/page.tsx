import { notFound } from "next/navigation";
import { getBookingByToken } from "@/lib/booking";
import { devPaymentsSimulated } from "@/lib/stripe";
import { formatMoney } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { SimulatePayButton } from "@/components/simulate-pay-button";

export const metadata = { title: "Dev payment" };

export default async function SimulatedPayPage({ params }: { params: { token: string } }) {
  if (!devPaymentsSimulated()) notFound();
  const b = await getBookingByToken(params.token);
  if (!b) notFound();
  return (
    <div className="container-page max-w-md py-16">
      <Card><CardBody className="space-y-4 text-center">
        <p className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">Dev mode · no Stripe key configured</p>
        <h1 className="text-2xl font-semibold">Simulated checkout</h1>
        <p className="text-ink-soft">{b.table.name} at {b.table.restaurant.name}</p>
        <p className="font-serif text-4xl">{formatMoney(Number(b.feeAmount), b.table.currency)}</p>
        <SimulatePayButton token={b.cancelToken} />
      </CardBody></Card>
    </div>
  );
}
