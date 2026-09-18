import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const restaurants = await prisma.restaurant.findMany({ where: { status: "APPROVED", listingFeeStatus: "PAID" }, select: { slug: true, createdAt: true, tables: { where: { isActive: true, deletedAt: null }, select: { id: true } } } });
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/restaurants`, changeFrequency: "daily", priority: 0.9 },
    ...restaurants.flatMap((r) => [
      { url: `${base}/restaurants/${r.slug}`, lastModified: r.createdAt, changeFrequency: "weekly" as const, priority: 0.8 },
      ...r.tables.map((t) => ({ url: `${base}/restaurants/${r.slug}/tables/${t.id}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ]),
  ];
}
