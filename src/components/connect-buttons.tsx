"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ConnectButton({ endpoint, label, variant = "default" }: { endpoint: string; label: string; variant?: "default" | "outline" }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button variant={variant} disabled={busy} onClick={async () => {
      setBusy(true);
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setBusy(false); return toast.error(data.error ?? "Something went wrong."); }
      window.location.href = data.url;
    }}>{busy ? "Redirecting…" : label}</Button>
  );
}
