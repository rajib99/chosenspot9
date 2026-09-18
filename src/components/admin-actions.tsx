"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RestaurantActions({ id, status, paid }: { id: string; status: string; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function act(action: string) {
    let reason: string | undefined;
    if (action === "reject") { reason = window.prompt("Reason for rejection (sent to the owner):") ?? undefined; }
    setBusy(true);
    const res = await fetch(`/api/admin/restaurants/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error(data.error ?? "Failed");
    toast.success(`Restaurant ${data.status.toLowerCase()}`);
    router.refresh();
  }
  return (
    <div className="flex flex-wrap gap-2">
      {(status === "PENDING" || status === "REJECTED") && <Button size="sm" disabled={busy || !paid} onClick={() => act("approve")} title={paid ? "" : "Listing fee unpaid"}>Approve</Button>}
      {status === "PENDING" && <Button size="sm" variant="outline" disabled={busy} onClick={() => act("reject")}>Reject</Button>}
      {status === "APPROVED" && <Button size="sm" variant="outline" disabled={busy} onClick={() => act("suspend")}>Suspend</Button>}
      {status === "SUSPENDED" && <Button size="sm" disabled={busy} onClick={() => act("reactivate")}>Reactivate</Button>}
    </div>
  );
}

export function UserActions({ id, role, suspended, isSelf }: { id: string; role: string; suspended: boolean; isSelf: boolean }) {
  const router = useRouter();
  async function patch(body: object) {
    const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(data.error ?? "Failed");
    toast.success("User updated");
    router.refresh();
  }
  return (
    <div className="flex items-center gap-2">
      <select defaultValue={role} disabled={isSelf} onChange={(e) => patch({ role: e.target.value })} className="h-9 rounded-lg border border-line bg-white px-2 text-sm" aria-label="Role">
        <option value="CUSTOMER">Customer</option><option value="RESTAURANT_OWNER">Owner</option><option value="ADMIN">Admin</option>
      </select>
      <Button size="sm" variant="outline" disabled={isSelf} onClick={() => patch({ suspended: !suspended })}>{suspended ? "Reinstate" : "Suspend"}</Button>
    </div>
  );
}
