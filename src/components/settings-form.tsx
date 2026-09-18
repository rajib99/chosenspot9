"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { PlatformSettings } from "@/lib/settings";

export function SettingsForm({ initial }: { initial: PlatformSettings }) {
  const router = useRouter();
  const [v, setV] = useState({ ...initial });
  const [busy, setBusy] = useState(false);
  return (
    <form className="max-w-lg space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true);
      const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      const data = await res.json().catch(() => ({})); setBusy(false);
      if (!res.ok) return toast.error(data.error ?? "Could not save settings");
      toast.success("Settings saved"); router.refresh();
    }}>
      <div><Label htmlFor="commission">Platform commission (%)</Label><Input id="commission" type="number" step="0.1" value={v.commissionPercent} onChange={(e) => setV({ ...v, commissionPercent: Number(e.target.value) })} /></div>
      <div><Label htmlFor="listing">Restaurant listing fee</Label><Input id="listing" type="number" step="0.01" value={v.listingFee} onChange={(e) => setV({ ...v, listingFee: Number(e.target.value) })} /></div>
      <div><Label htmlFor="currency">Currency (ISO code)</Label><Input id="currency" maxLength={3} value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value.toLowerCase() })} /></div>
      <div><Label htmlFor="window">Cancellation window (hours before start)</Label><Input id="window" type="number" min="0" value={v.cancellationWindowHours} onChange={(e) => setV({ ...v, cancellationWindowHours: Number(e.target.value) })} /></div>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
    </form>
  );
}
