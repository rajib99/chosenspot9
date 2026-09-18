import { prisma } from "@/lib/prisma";

export type PlatformSettings = {
  commissionPercent: number;
  listingFee: number;
  currency: string;
  cancellationWindowHours: number;
};

const defaults = (): PlatformSettings => ({
  commissionPercent: Number(process.env.PLATFORM_COMMISSION_PERCENT ?? 10),
  listingFee: Number(process.env.LISTING_FEE_AMOUNT ?? 49),
  currency: (process.env.PLATFORM_CURRENCY ?? "usd").toLowerCase(),
  cancellationWindowHours: Number(process.env.CANCELLATION_WINDOW_HOURS ?? 24),
});

export async function getSettings(): Promise<PlatformSettings> {
  const d = defaults();
  const rows = await prisma.setting.findMany();
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    commissionPercent: m.commissionPercent !== undefined ? Number(m.commissionPercent) : d.commissionPercent,
    listingFee: m.listingFee !== undefined ? Number(m.listingFee) : d.listingFee,
    currency: m.currency ?? d.currency,
    cancellationWindowHours: m.cancellationWindowHours !== undefined ? Number(m.cancellationWindowHours) : d.cancellationWindowHours,
  };
}

export async function saveSettings(s: Partial<PlatformSettings>) {
  await prisma.$transaction(
    Object.entries(s).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })
    )
  );
}
