"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export type CouponRow = { id: string; code: string; type: "PERCENT" | "FIXED"; value: number; appliesTo: "ALL" | "RESTAURANT" | "TABLE"; restaurantId: string | null; tableId: string | null; restaurantName?: string | null; tableName?: string | null; maxRedemptions: number | null; timesRedeemed: number; expiresAt: string | null; isActive: boolean };
type Option = { id: string; label: string };

const blank = { code: "", type: "PERCENT" as "PERCENT" | "FIXED", value: "10", appliesTo: "ALL" as "ALL" | "RESTAURANT" | "TABLE", restaurantId: "", tableId: "", maxRedemptions: "", expiresAt: "", isActive: true };

export function CouponManager({ coupons, apiBase, mode, restaurants = [], tables = [] }: { coupons: CouponRow[]; apiBase: string; mode: "admin" | "owner"; restaurants?: Option[]; tables?: Option[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setF((p) => ({ ...p, [k]: v }));

  function open(c?: CouponRow) {
    setErr("");
    setEditing(c ? c.id : "new");
    setF(c ? { code: c.code, type: c.type, value: String(c.value), appliesTo: c.appliesTo, restaurantId: c.restaurantId ?? "", tableId: c.tableId ?? "", maxRedemptions: c.maxRedemptions?.toString() ?? "", expiresAt: c.expiresAt?.slice(0, 10) ?? "", isActive: c.isActive } : { ...blank, appliesTo: mode === "owner" ? "RESTAURANT" : "ALL" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const payload = { ...f, value: Number(f.value), restaurantId: f.appliesTo === "RESTAURANT" ? f.restaurantId || null : null, tableId: f.appliesTo === "TABLE" ? f.tableId || null : null, maxRedemptions: f.maxRedemptions ? Number(f.maxRedemptions) : null, expiresAt: f.expiresAt || null };
    const res = await fetch(editing === "new" ? apiBase : `${apiBase}/${editing}`, { method: editing === "new" ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error ?? "Could not save coupon.");
    toast.success(editing === "new" ? "Coupon created" : "Coupon updated");
    setEditing(null);
    router.refresh();
  }

  async function toggle(c: CouponRow, isActive: boolean) {
    const res = await fetch(`${apiBase}/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
    if (!res.ok) return toast.error("Could not update coupon");
    toast.success(isActive ? `${c.code} activated` : `${c.code} deactivated`);
    router.refresh();
  }

  const scopeLabel = (c: CouponRow) => (c.appliesTo === "ALL" ? "Platform-wide" : c.appliesTo === "RESTAURANT" ? c.restaurantName ?? "Restaurant" : `Table: ${c.tableName ?? ""}`);
  const expired = (c: CouponRow) => !!c.expiresAt && new Date(c.expiresAt) < new Date();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Coupons</h1>
        {editing === null && <Button onClick={() => open()}>New coupon</Button>}
      </div>

      {editing !== null && (
        <Card className="mb-6"><CardBody>
          <form onSubmit={save} className="space-y-4" data-testid="coupon-form">
            <h2 className="text-xl font-semibold">{editing === "new" ? "New coupon" : "Edit coupon"}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label htmlFor="c-code">Code</Label><Input id="c-code" value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="SUMMER20" /></div>
              <div><Label htmlFor="c-type">Type</Label><Select id="c-type" value={f.type} onChange={(e) => set("type", e.target.value as "PERCENT" | "FIXED")}><option value="PERCENT">Percent (%)</option><option value="FIXED">Fixed amount</option></Select></div>
              <div><Label htmlFor="c-value">{f.type === "PERCENT" ? "Percent off" : "Amount off"}</Label><Input id="c-value" type="number" step="0.01" min="0" value={f.value} onChange={(e) => set("value", e.target.value)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="c-scope">Applies to</Label>
                <Select id="c-scope" value={f.appliesTo} onChange={(e) => set("appliesTo", e.target.value as "ALL" | "RESTAURANT" | "TABLE")}>
                  {mode === "admin" && <option value="ALL">All restaurants (platform-wide)</option>}
                  <option value="RESTAURANT">{mode === "admin" ? "A specific restaurant" : "My whole restaurant"}</option>
                  <option value="TABLE">A specific table</option>
                </Select>
              </div>
              {f.appliesTo === "RESTAURANT" && mode === "admin" && <div><Label htmlFor="c-rest">Restaurant</Label><Select id="c-rest" value={f.restaurantId} onChange={(e) => set("restaurantId", e.target.value)}><option value="">Choose…</option>{restaurants.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</Select></div>}
              {f.appliesTo === "TABLE" && <div><Label htmlFor="c-table">Table</Label><Select id="c-table" value={f.tableId} onChange={(e) => set("tableId", e.target.value)}><option value="">Choose…</option>{tables.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</Select></div>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="c-max">Max redemptions (blank = unlimited)</Label><Input id="c-max" type="number" min="1" value={f.maxRedemptions} onChange={(e) => set("maxRedemptions", e.target.value)} /></div>
              <div><Label htmlFor="c-exp">Expires (blank = never)</Label><Input id="c-exp" type="date" value={f.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} /></div>
            </div>
            <label className="flex items-center gap-3 text-sm"><Switch checked={f.isActive} onCheckedChange={(v) => set("isActive", v)} aria-label="Active" />Active</label>
            <FieldError message={err} />
            <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save coupon"}</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
          </form>
        </CardBody></Card>
      )}

      {coupons.length === 0 ? (
        <Card className="p-10 text-center"><p className="font-serif text-xl">No coupons yet</p><p className="mt-1 text-sm text-ink-soft">Create a code to reward regulars or fill quiet nights.</p></Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-soft">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-muted"><tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Scope</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3">Active</th><th className="px-4 py-3" /></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-4 py-3">{c.type === "PERCENT" ? `${c.value}%` : `$${c.value}`}</td>
                  <td className="px-4 py-3 text-ink-soft">{scopeLabel(c)}</td>
                  <td className="px-4 py-3">{c.timesRedeemed}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}</td>
                  <td className="px-4 py-3">{c.expiresAt ? <span className={expired(c) ? "text-red-700" : ""}>{c.expiresAt.slice(0, 10)}{expired(c) && " (expired)"}</span> : <Badge>Never</Badge>}</td>
                  <td className="px-4 py-3"><Switch checked={c.isActive} onCheckedChange={(v) => toggle(c, v)} aria-label={`Toggle ${c.code}`} /></td>
                  <td className="px-4 py-3 text-right"><Button size="sm" variant="outline" onClick={() => open(c)}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
