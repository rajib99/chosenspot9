import { notFound } from "next/navigation";
import { CalendarPlus, CheckCircle2, Clock, XCircle } from "lucide-react";
import { getBookingByToken, whenText, confirmBooking } from "@/lib/booking";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingActions } from "@/components/booking-actions";

export const metadata = { title: "Your booking" };
export const dynamic = "force-dynamic";

export default async function BookingPage({ params, searchParams }: { params: { token: string }; searchParams: { session_id?: string; canceled?: string } }) {
  let b = await getBookingByToken(params.token);
  if (!b) notFound();

  // Back from Stripe: confirm right away rather than waiting for the webhook.
  if (b.status === "PENDING" && searchParams.session_id && stripeConfigured()) {
    try {
      const s = await getStripe().checkout.sessions.retrieve(searchParams.session_id);
      if (s.payment_status === "paid" && s.metadata?.bookingId === b.id) {
        await confirmBooking(b.id, { sessionId: s.id, paymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id, amount: (s.amount_total ?? 0) / 100, currency: s.currency ?? undefined, platformFee: Number(s.metadata?.platformFee ?? 0) });
        b = (await getBookingByToken(params.token))!;
      }
    } catch {}
  }

  const settings = await getSettings();
  const r = b.table.restaurant;
  const fee = Number(b.feeAmount);
  const hoursLeft = (b.startAt.getTime() - Date.now()) / 3_600_000;
  const state =
    b.status === "CONFIRMED" ? { icon: CheckCircle2, tone: "text-emerald", title: "You're all set", note: "A confirmation email is on its way." }
    : b.status === "CANCELLED" ? { icon: XCircle, tone: "text-red-700", title: "Booking cancelled", note: "This reservation has been cancelled." }
    : b.status === "PENDING" ? { icon: Clock, tone: "text-amber-700", title: searchParams.canceled ? "Payment not completed" : "Awaiting payment", note: "Your table isn't reserved until payment completes." }
    : { icon: CheckCircle2, tone: "text-ink-soft", title: b.status === "COMPLETED" ? "Visit completed" : "Booking closed", note: "" };
  const Icon = state.icon;

  return (
    <div className="container-page max-w-xl py-12">
      <div className="mb-8 text-center">
        <Icon className={`mx-auto h-12 w-12 ${state.tone}`} />
        <h1 className="mt-3 text-3xl font-semibold" data-testid="booking-title">{state.title}</h1>
        <p className="mt-1 text-ink-soft">{state.note}</p>
      </div>
      <Card><CardBody className="space-y-3 text-sm">
        {[["Restaurant", r.name], ["Table", b.table.name], ["When", whenText(b)], ["Duration", `${b.durationMinutes} min`], ["Guests", String(b.partySize)], ["Name", b.guestName], ["Booking fee", fee > 0 ? formatMoney(fee, b.table.currency) : "Free"], ["Address", `${r.address}, ${r.city}`], ["Reference", b.id.slice(-8).toUpperCase()]].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-6"><span className="text-ink-muted">{k}</span><span className="text-right font-medium">{v}</span></div>
        ))}
      </CardBody></Card>

      {b.status === "CONFIRMED" && (
        <div className="mt-6 space-y-4">
          <Button asChild variant="outline" className="w-full"><a href={`/api/booking/${b.cancelToken}/ics`}><CalendarPlus className="h-4 w-4" />Add to calendar (.ics)</a></Button>
          <BookingActions token={b.cancelToken} tableId={b.tableId} slug={r.slug} duration={b.durationMinutes} canChange={hoursLeft >= settings.cancellationWindowHours} windowHours={settings.cancellationWindowHours} refundable={fee > 0} restaurantContact={r.email || r.phone || ""} />
        </div>
      )}
    </div>
  );
}
