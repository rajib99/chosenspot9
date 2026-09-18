"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SimulatePayButton({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button size="lg" className="w-full" disabled={busy} onClick={async () => {
      setBusy(true);
      const res = await fetch(`/api/bookings/${token}/simulate-pay`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setBusy(false); return toast.error(data.error ?? "Failed"); }
      window.location.href = data.url;
    }}>{busy ? "Processing…" : "Simulate successful payment"}</Button>
  );
}
