"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FieldError, Input, Label } from "@/components/ui/input";
import { TagBadge } from "@/components/tag-badge";
import { formatMoney, cn } from "@/lib/utils";

const schema = z.object({
  guestName: z.string().trim().min(2, "Enter your name"),
  guestEmail: z.string().trim().email("Enter a valid email"),
  guestPhone: z.string().trim().max(30).optional(),
});
type Values = z.infer<typeof schema>;

type Props = {
  table: { id: string; name: string; tag: string; photo: string | null; fee: number; currency: string; restaurantName: string; address: string };
  selection: { date: string; time: string; duration: number; party: number; pretty: string };
  prefill: { name: string; email: string };
};

export function BookingForm({ table, selection, prefill }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number; finalFee: number } | null>(null);
  const [applying, setApplying] = useState(false);
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { guestName: prefill.name, guestEmail: prefill.email, guestPhone: "" } });

  const fee = coupon ? coupon.finalFee : table.fee;

  async function applyCoupon() {
    if (!code.trim()) return;
    setApplying(true);
    const res = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, tableId: table.id }) });
    const data = await res.json().catch(() => ({}));
    setApplying(false);
    if (data.valid) {
      setCoupon({ code: data.code, discount: data.discount, finalFee: data.finalFee });
      toast.success(`Coupon applied — you save ${formatMoney(data.discount, table.currency)}`);
    } else {
      setCoupon(null);
      toast.error(data.reason ?? "Invalid code");
    }
  }

  async function submit() {
    setBusy(true);
    const v = getValues();
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId: table.id, date: selection.date, time: selection.time, duration: selection.duration, partySize: selection.party, ...v, couponCode: coupon?.code ?? "" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      toast.error(data.error ?? "Payment failed. Please try again.");
      return;
    }
    window.location.href = data.url;
  }

  const summary = (
    <Card className="h-fit overflow-hidden lg:sticky lg:top-24">
      {table.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={table.photo} alt="" className="aspect-[16/8] w-full object-cover" />
      )}
      <CardBody className="space-y-4">
        <div>
          <TagBadge tag={table.tag} />
          <h2 className="mt-2 text-xl font-semibold">{table.name}</h2>
          <p className="text-sm text-ink-soft">{table.restaurantName}</p>
        </div>
        <ul className="space-y-2 text-sm text-ink-soft">
          <li className="flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />{selection.pretty} · {selection.duration} min</li>
          <li className="flex gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />{selection.party} {selection.party === 1 ? "guest" : "guests"}</li>
          <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />{table.address}</li>
        </ul>
        <div className="space-y-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><span className="text-ink-soft">Booking fee</span><span>{table.fee > 0 ? formatMoney(table.fee, table.currency) : "Free"}</span></div>
          {coupon && <div className="flex justify-between text-emerald"><span>Coupon {coupon.code}</span><span>−{formatMoney(coupon.discount, table.currency)}</span></div>}
          <div className="flex justify-between pt-1 font-serif text-lg"><span>Total</span><span data-testid="total">{fee > 0 ? formatMoney(fee, table.currency) : "Free"}</span></div>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="order-2 lg:order-1">
        <ol className="mb-6 flex gap-2 text-sm">
          {["Your details", table.fee > 0 ? "Review & pay" : "Review & confirm"].map((label, i) => (
            <li key={label} className={cn("flex-1 rounded-full px-4 py-2 text-center", step === i + 1 ? "bg-emerald text-white" : step > i + 1 ? "bg-emerald-light text-emerald" : "bg-cream-200 text-ink-muted")}>{i + 1}. {label}</li>
          ))}
        </ol>

        <Card><CardBody>
          {step === 1 ? (
            <form onSubmit={handleSubmit(() => setStep(2))} className="space-y-4" noValidate>
              <div><Label htmlFor="guestName">Full name</Label><Input id="guestName" autoComplete="name" {...register("guestName")} /><FieldError message={errors.guestName?.message} /></div>
              <div><Label htmlFor="guestEmail">Email</Label><Input id="guestEmail" type="email" autoComplete="email" {...register("guestEmail")} /><FieldError message={errors.guestEmail?.message} /></div>
              <div><Label htmlFor="guestPhone">Phone (optional)</Label><Input id="guestPhone" type="tel" autoComplete="tel" {...register("guestPhone")} /></div>
              <p className="text-xs text-ink-muted">No account needed. We&apos;ll email your confirmation and a link to manage the booking.</p>
              <Button type="submit" size="lg" className="w-full">Continue</Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="rounded-xl bg-cream-200/70 p-4 text-sm">
                <p className="font-medium">{getValues("guestName")}</p>
                <p className="text-ink-soft">{getValues("guestEmail")}{getValues("guestPhone") ? ` · ${getValues("guestPhone")}` : ""}</p>
                <button type="button" onClick={() => setStep(1)} className="mt-2 text-emerald underline">Edit details</button>
              </div>
              {table.fee > 0 && (
                <div>
                  <Label htmlFor="coupon">Coupon code</Label>
                  <div className="flex gap-2">
                    <Input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WELCOME10" disabled={!!coupon} />
                    {coupon ? (
                      <Button type="button" variant="outline" onClick={() => { setCoupon(null); setCode(""); }}>Remove</Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={applyCoupon} disabled={applying || !code.trim()}>{applying ? "…" : "Apply"}</Button>
                    )}
                  </div>
                </div>
              )}
              <Button size="lg" className="w-full" onClick={submit} disabled={busy}>
                {busy ? "Processing…" : fee > 0 ? `Pay ${formatMoney(fee, table.currency)} & confirm` : "Confirm booking"}
              </Button>
              {fee > 0 && <p className="text-center text-xs text-ink-muted">Secure payment by Stripe. Free cancellation window applies.</p>}
            </div>
          )}
        </CardBody></Card>
      </div>
      <div className="order-1 lg:order-2">{summary}</div>
    </div>
  );
}
