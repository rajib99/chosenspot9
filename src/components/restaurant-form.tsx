"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { ImageDropzone } from "@/components/image-dropzone";
import { restaurantSchema, type RestaurantInput } from "@/lib/restaurant-schema";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "The basics", fields: ["name", "cuisine", "description"] },
  { title: "Location & contact", fields: ["address", "city", "timezone", "phone", "email"] },
  { title: "Photos", fields: ["coverImageUrl", "galleryImages"] },
] as const;

export function RestaurantForm({ initial, mode }: { initial?: Partial<RestaurantInput>; mode: "create" | "edit" }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [zones, setZones] = useState<string[]>(["UTC"]);
  const { register, control, handleSubmit, trigger, setValue, formState: { errors } } = useForm<RestaurantInput>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: { name: "", description: "", cuisine: "", address: "", city: "", timezone: "UTC", phone: "", email: "", coverImageUrl: "", galleryImages: [], ...initial },
  });

  useEffect(() => {
    try {
      setZones(Intl.supportedValuesOf("timeZone"));
      // set after options render, otherwise the select falls back to its first option
      if (!initial?.timezone) setTimeout(() => setValue("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone), 0);
    } catch {}
  }, [initial?.timezone, setValue]);

  const isLast = step === STEPS.length - 1;
  const zoneOptions = useMemo(() => zones.map((z) => <option key={z} value={z}>{z}</option>), [zones]);

  async function next() {
    if (await trigger([...STEPS[step].fields] as never)) setStep((s) => s + 1);
  }

  async function submit(values: RestaurantInput) {
    setBusy(true);
    const res = await fetch("/api/restaurant", { method: mode === "create" ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      return toast.error(data.error ?? "Could not save.");
    }
    toast.success(mode === "create" ? "Profile saved" : "Profile updated");
    router.push(mode === "create" ? "/restaurant/pay-listing" : "/restaurant");
    router.refresh();
  }

  const show = (i: number) => (mode === "edit" ? true : step === i);

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-8" noValidate>
      {mode === "create" && (
        <ol className="flex gap-2 text-xs sm:text-sm">
          {STEPS.map((s, i) => (
            <li key={s.title} className={cn("flex-1 rounded-full px-3 py-2 text-center", i === step ? "bg-emerald text-white" : i < step ? "bg-emerald-light text-emerald" : "bg-cream-200 text-ink-muted")}>
              {i + 1}. {s.title}
            </li>
          ))}
        </ol>
      )}

      <div className={cn("space-y-4", !show(0) && "hidden")}>
        <div><Label htmlFor="name">Restaurant name</Label><Input id="name" {...register("name")} /><FieldError message={errors.name?.message} /></div>
        <div><Label htmlFor="cuisine">Cuisine</Label><Input id="cuisine" placeholder="e.g. Modern Italian" {...register("cuisine")} /><FieldError message={errors.cuisine?.message} /></div>
        <div><Label htmlFor="description">Description</Label><Textarea id="description" {...register("description")} /><FieldError message={errors.description?.message} /></div>
      </div>

      <div className={cn("space-y-4", !show(1) && "hidden")}>
        <div><Label htmlFor="address">Street address</Label><Input id="address" {...register("address")} /><FieldError message={errors.address?.message} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="city">City</Label><Input id="city" {...register("city")} /><FieldError message={errors.city?.message} /></div>
          <div><Label htmlFor="timezone">Timezone</Label><Select id="timezone" {...register("timezone")}>{zoneOptions}</Select></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" {...register("phone")} /></div>
          <div><Label htmlFor="email">Contact email</Label><Input id="email" type="email" {...register("email")} /><FieldError message={errors.email?.message} /></div>
        </div>
      </div>

      <div className={cn("space-y-6", !show(2) && "hidden")}>
        <div>
          <Label>Cover image</Label>
          <Controller control={control} name="coverImageUrl" render={({ field }) => <ImageDropzone value={field.value ? [field.value] : []} onChange={(v) => field.onChange(v[0] ?? "")} label="Drop your cover image here or click to browse" />} />
          <FieldError message={errors.coverImageUrl?.message} />
        </div>
        <div>
          <Label>Gallery</Label>
          <Controller control={control} name="galleryImages" render={({ field }) => <ImageDropzone multiple value={field.value} onChange={field.onChange} />} />
        </div>
      </div>

      <div className="flex justify-between gap-3">
        {mode === "create" && step > 0 ? <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button> : <span />}
        {mode === "create" && !isLast ? (
          <Button type="button" onClick={next}>Continue</Button>
        ) : (
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : mode === "create" ? "Save & continue to payment" : "Save changes"}</Button>
        )}
      </div>
    </form>
  );
}
