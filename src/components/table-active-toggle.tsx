"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export function TableActiveToggle({ id, initial }: { id: string; initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  return (
    <Switch
      checked={on}
      aria-label="Active"
      onCheckedChange={async (v) => {
        setOn(v);
        const res = await fetch(`/api/restaurant/tables/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: v }) });
        if (!res.ok) {
          setOn(!v);
          return toast.error("Could not update table.");
        }
        toast.success(v ? "Table is now active" : "Table hidden from guests");
        router.refresh();
      }}
    />
  );
}
