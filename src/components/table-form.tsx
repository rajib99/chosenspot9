"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ImageDropzone } from "@/components/image-dropzone";
import { tableSchema, type TableInput } from "@/lib/table-schema";
import { PRESET_TAGS, tagMeta } from "@/lib/tags";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TableForm({ tableId, initial, currency, canAcceptPaid }: { tableId?: string; initial?: Partial<TableInput>; currency: string; canAcceptPaid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const initialTag = initial?.locationTag ?? "WINDOW";
  const isPreset = (PRESET_TAGS as readonly string[]).includes(initialTag);
  const [tagChoice, setTagChoice] = useState<string>(isPreset ? initialTag : "CUSTOM");

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<TableInput>({
    resolver: zodResolver(tableSchema) as never,
    defaultValues: { name: "", description: "", locationTag: initialTag, capacity: 2, bookingFee: 0, photos: [], isActive: true, openDays: [0, 1, 2, 3, 4, 5, 6], openTime: "17:00", closeTime: "23:00", minDuration: 60, maxDuration: 180, bufferMinutes: 15, ...initial },
  });
  const fee = Number(watch("bookingFee") || 0);

  async function submit(values: TableInput) {
    setBusy(true);
    const res = await fetch(tableId ? `/api/restaurant/tables/${tableId}` : "/api/restaurant/tables", { method: tableId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return toast.error(data.error ?? "Could not save table.");
    }
    toast.success(tableId ? "Table updated" : "Table created");
    router.push("/restaurant/tables");
    router.refresh();
  }

  async function remove() {
    if (!tableId || !window.confirm("Delete this table? Tables with past bookings are archived instead.")) return;
    const res = await fetch(`/api/restaurant/tables/${tableId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error ?? "Could not delete.");
    toast.success(data.soft ? "Table archived (it has bookings)" : "Table deleted");
    router.push("/restaurant/tables");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submit as never)} className="space-y-10" noValidate>
      <section className="space-y-4">
        <h2 className="text-xl">Details</h2>
        <div><Label htmlFor="name">Table name</Label><Input id="name" placeholder="e.g. Window Table 3" {...register("name")} /><FieldError message={errors.name?.message} /></div>
        <div><Label htmlFor="description">Description</Label><Textarea id="description" {...register("description")} /><FieldError message={errors.description?.message} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="tag">Location</Label>
            <Select
              id="tag"
              value={tagChoice}
              onChange={(e) => {
                setTagChoice(e.target.value);
                setValue("locationTag", e.target.value === "CUSTOM" ? "" : e.target.value, { shouldValidate: true });
              }}
            >
              {PRESET_TAGS.map((t) => <option key={t} value={t}>{tagMeta(t).label}</option>)}
              <option value="CUSTOM">Custom tag…</option>
            </Select>
            {tagChoice === "CUSTOM" && <Input className="mt-2" placeholder="e.g. Chef's counter" {...register("locationTag")} />}
            <FieldError message={errors.locationTag?.message} />
          </div>
          <div><Label htmlFor="capacity">Capacity (guests)</Label><Input id="capacity" type="number" min={1} {...register("capacity")} /><FieldError message={errors.capacity?.message} /></div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl">Photos</h2>
        <Controller control={control} name="photos" render={({ field }) => <ImageDropzone multiple reorderable value={field.value} onChange={field.onChange} label="Drop table photos here or click to browse" />} />
        <p className="text-xs text-ink-muted">The first photo is the primary one shown on cards.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl">Booking fee</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fee">Fee per booking ({currency.toUpperCase()})</Label>
            <Input id="fee" type="number" step="0.01" min={0} {...register("bookingFee")} />
            <FieldError message={errors.bookingFee?.message} />
            <p className="mt-1 text-xs text-ink-muted">{fee <= 0 ? "Guests will see a “Free” badge." : "Guests pay this fee to reserve the table."}</p>
          </div>
          <div><Label>Currency</Label><Input value={currency.toUpperCase()} disabled readOnly /><p className="mt-1 text-xs text-ink-muted">Set by the platform.</p></div>
        </div>
        {fee > 0 && !canAcceptPaid && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Connect your Stripe account under Payouts before guests can book paid tables.</p>}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl">Availability</h2>
        <div>
          <Label>Bookable days</Label>
          <Controller control={control} name="openDays" render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => {
                const on = field.value.includes(i);
                return <button type="button" key={d} onClick={() => field.onChange(on ? field.value.filter((x) => x !== i) : [...field.value, i].sort())} className={cn("h-10 w-14 rounded-full border text-sm transition-colors", on ? "border-emerald bg-emerald text-white" : "border-line bg-white text-ink-soft")}>{d}</button>;
              })}
            </div>
          )} />
          <FieldError message={errors.openDays?.message as string} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="open">First slot starts</Label><Input id="open" type="time" {...register("openTime")} /><FieldError message={errors.openTime?.message} /></div>
          <div><Label htmlFor="close">Last booking ends</Label><Input id="close" type="time" {...register("closeTime")} /><FieldError message={errors.closeTime?.message} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label htmlFor="min">Min duration (min)</Label><Input id="min" type="number" step={15} {...register("minDuration")} /><FieldError message={errors.minDuration?.message} /></div>
          <div><Label htmlFor="max">Max duration (min)</Label><Input id="max" type="number" step={15} {...register("maxDuration")} /><FieldError message={errors.maxDuration?.message} /></div>
          <div><Label htmlFor="buffer">Buffer between bookings (min)</Label><Input id="buffer" type="number" step={5} {...register("bufferMinutes")} /><FieldError message={errors.bufferMinutes?.message} /></div>
        </div>
      </section>

      <section className="flex items-center justify-between rounded-xl border border-line bg-white p-4">
        <div><p className="font-medium">Active</p><p className="text-sm text-ink-muted">Inactive tables are hidden from guests.</p></div>
        <Controller control={control} name="isActive" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="Active" />} />
      </section>

      <div className="flex items-center justify-between gap-3">
        {tableId ? <Button type="button" variant="ghost" className="text-red-700" onClick={remove}>Delete table</Button> : <span />}
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/restaurant/tables")}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : tableId ? "Save changes" : "Create table"}</Button>
        </div>
      </div>
    </form>
  );
}
