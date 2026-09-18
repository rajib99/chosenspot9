"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PayListingButton({ simulate }: { simulate: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);
    const res = await fetch(simulate ? "/api/restaurant/listing-simulate" : "/api/restaurant/listing-checkout", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return toast.error(data.error ?? "Could not start payment.");
    }
    if (simulate) {
      toast.success("Dev mode: payment simulated.");
      router.push("/restaurant?listing=success");
      router.refresh();
    } else window.location.href = data.url;
  }

  return (
    <div className="mt-6">
      <Button className="w-full" size="lg" onClick={pay} disabled={busy}>{busy ? "Please wait…" : simulate ? "Simulate payment (dev mode)" : "Pay with Stripe"}</Button>
      {simulate && <p className="mt-3 text-xs text-ink-muted">No STRIPE_SECRET_KEY is set, so payment is simulated locally. This button never appears in production.</p>}
    </div>
  );
}
