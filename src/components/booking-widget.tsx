"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Slot = { time: string; available: boolean };

function todayIn(tz: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function BookingWidget({ tableId, capacity, durations, timezone, openDays }: { tableId: string; capacity: number; durations: number[]; timezone: string; openDays: number[] }) {
  const router = useRouter();
  const min = useMemo(() => todayIn(timezone), [timezone]);
  const [date, setDate] = useState(min);
  const [duration, setDuration] = useState(durations[Math.min(1, durations.length - 1)]);
  const [party, setParty] = useState(Math.min(2, capacity));
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setSlots(null);
    setTime(null);
    fetch(`/api/availability?tableId=${tableId}&date=${date}&duration=${duration}`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => {});
    return () => ctrl.abort();
  }, [tableId, date, duration]);

  const closedDay = date && !openDays.includes(new Date(`${date}T00:00:00Z`).getUTCDay());
  const anyAvailable = slots?.some((s) => s.available);

  return (
    <div className="space-y-5">
      <div><Label htmlFor="date">Date</Label><Input id="date" type="date" min={min} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="duration">Duration</Label>
          <Select id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {durations.map((d) => <option key={d} value={d}>{d % 60 === 0 ? `${d / 60} h` : `${Math.floor(d / 60)}h ${d % 60}m`.replace(/^0h /, "")}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="party">Guests</Label>
          <Select id="party" value={party} onChange={(e) => setParty(Number(e.target.value))}>
            {Array.from({ length: capacity }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </div>
      </div>

      <div>
        <Label>Time <span className="font-normal text-ink-muted">({timezone.replace("_", " ")})</span></Label>
        {slots === null ? (
          <div className="grid grid-cols-4 gap-2">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : !anyAvailable ? (
          <p className="rounded-xl bg-cream-200 p-4 text-sm text-ink-soft">{closedDay ? "This table isn't bookable on that day." : "No times available on this date — try another day or a shorter duration."}</p>
        ) : (
          <div className="grid grid-cols-4 gap-2" role="listbox" aria-label="Available times">
            {slots.map((s) => (
              <button
                key={s.time}
                type="button"
                role="option"
                aria-selected={time === s.time}
                disabled={!s.available}
                onClick={() => setTime(s.time)}
                className={cn("h-10 rounded-xl border text-sm transition-colors", time === s.time ? "border-emerald bg-emerald text-white" : "border-line bg-white hover:border-emerald", !s.available && "cursor-not-allowed bg-cream-200 text-ink-muted/60 line-through hover:border-line")}
              >
                {s.time}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button className="w-full" size="lg" disabled={!time} onClick={() => router.push(`/book/${tableId}?date=${date}&time=${time}&duration=${duration}&party=${party}`)}>
        {time ? `Continue · ${time}` : "Select a time"}
      </Button>
    </div>
  );
}
