"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BookingStatusButtons({ id }: { id: string }) {
  const router = useRouter();
  const set = async (status: "COMPLETED" | "NO_SHOW") => {
    const res = await fetch(`/api/restaurant/bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error ?? "Failed");
    toast.success(status === "COMPLETED" ? "Marked completed" : "Marked no-show");
    router.refresh();
  };
  return <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => set("COMPLETED")}>Completed</Button><Button size="sm" variant="ghost" className="text-red-700" onClick={() => set("NO_SHOW")}>No-show</Button></div>;
}
