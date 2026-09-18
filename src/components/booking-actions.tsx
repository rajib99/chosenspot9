"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Slot = { time: string; available: boolean };

export function BookingActions({ token, tableId, duration, canChange, windowHours, refundable, restaurantContact }: { token: string; tableId: string; slug: string; duration: number; canChange: boolean; windowHours: number; refundable: boolean; restaurantContact: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "cancel" | "move">("idle");
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "move" || !date) return;
    setSlots(null); setTime(null);
    fetch(`/api/availability?tableId=${tableId}&date=${date}&duration=${duration}&exclude=${token}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setSlots(d.slots ?? []));
  }, [mode, date, tableId, duration, token]);

  if (!canChange) {
    return <p className="rounded-xl bg-cream-200 p-4 text-sm text-ink-soft">Online changes and cancellations close {windowHours}h before your booking. Need help? Contact the restaurant{restaurantContact ? ` at ${restaurantContact}` : ""}.</p>;
  }

  async function cancel() {
    setBusy(true);
    const res = await fetch("/api/bookings/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error(data.error ?? "Could not cancel.");
    toast.success(data.refunded ? "Booking cancelled — your fee is being refunded" : "Booking cancelled");
    router.refresh();
  }

  async function move() {
    if (!time) return;
    setBusy(true);
    const res = await fetch("/api/bookings/reschedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, date, time }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error(data.error ?? "Could not reschedule.");
    toast.success("Booking moved");
    setMode("idle");
    router.refresh();
  }

  if (mode === "cancel") {
    return (
      <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-900">Cancel this booking?{refundable ? " Your booking fee will be refunded automatically." : ""}</p>
        <div className="flex gap-2"><Button variant="danger" size="sm" onClick={cancel} disabled={busy}>{busy ? "Cancelling…" : "Yes, cancel booking"}</Button><Button variant="ghost" size="sm" onClick={() => setMode("idle")}>Keep it</Button></div>
      </div>
    );
  }
  if (mode === "move") {
    return (
      <div className="space-y-3 rounded-xl border border-line bg-white p-4">
        <p className="text-sm font-medium">Pick a new date and time</p>
        <Input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} aria-label="New date" />
        {date && (slots === null ? <p className="text-sm text-ink-muted">Loading…</p> : (
          <div className="grid grid-cols-4 gap-2">{slots.map((s) => <button key={s.time} type="button" disabled={!s.available} onClick={() => setTime(s.time)} className={cn("h-10 rounded-xl border text-sm", time === s.time ? "border-emerald bg-emerald text-white" : "border-line bg-white", !s.available && "bg-cream-200 text-ink-muted/60 line-through")}>{s.time}</button>)}</div>
        ))}
        <div className="flex gap-2"><Button size="sm" onClick={move} disabled={!time || busy}>Confirm new time</Button><Button variant="ghost" size="sm" onClick={() => setMode("idle")}>Back</Button></div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <Button variant="outline" className="flex-1" onClick={() => setMode("move")}>Change time</Button>
      <Button variant="ghost" className="flex-1 text-red-700 hover:bg-red-50" onClick={() => setMode("cancel")}>Cancel booking</Button>
    </div>
  );
}
