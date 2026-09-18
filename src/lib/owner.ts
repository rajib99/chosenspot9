import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getOwnerRestaurant() {
  const s = await getSession();
  if (!s?.user || s.user.role !== "RESTAURANT_OWNER") return null;
  return prisma.restaurant.findFirst({ where: { ownerId: s.user.id }, orderBy: { createdAt: "asc" } });
}

export function restaurantState(r: { status: string; listingFeeStatus: string }) {
  if (r.status === "SUSPENDED") return { key: "suspended", label: "Suspended", tone: "danger" as const, text: "Your listing has been suspended. Contact support to reactivate it." };
  if (r.status === "REJECTED") return { key: "rejected", label: "Rejected", tone: "danger" as const, text: "Your listing was not approved. Update your details or contact support." };
  if (r.listingFeeStatus === "UNPAID") return { key: "unpaid", label: "Pending payment", tone: "warn" as const, text: "Pay the one-time listing fee to submit your restaurant for approval." };
  if (r.status === "PENDING") return { key: "pending", label: "Pending approval", tone: "warn" as const, text: "Payment received. Our team is reviewing your restaurant — you'll get an email once it's live." };
  return { key: "live", label: "Live", tone: "success" as const, text: "Your restaurant is live and visible to guests." };
}
