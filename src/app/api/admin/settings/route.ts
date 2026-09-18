import { NextResponse } from "next/server";
import { z } from "zod";
import { adminOrNull } from "@/lib/admin";
import { saveSettings } from "@/lib/settings";
import { audit } from "@/lib/audit";

const schema = z.object({
  commissionPercent: z.coerce.number().min(0).max(100),
  listingFee: z.coerce.number().min(0).max(100000),
  currency: z.string().trim().toLowerCase().regex(/^[a-z]{3}$/, "Use a 3-letter currency code"),
  cancellationWindowHours: z.coerce.number().int().min(0).max(720),
});

export async function PUT(req: Request) {
  const admin = await adminOrNull();
  if (!admin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  await saveSettings(parsed.data);
  await audit(admin.id, "settings.update", "Setting", "platform", parsed.data);
  return NextResponse.json({ ok: true });
}
