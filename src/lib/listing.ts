import { prisma } from "@/lib/prisma";
import { emailButton, emailLayout, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/utils";

/** Idempotently mark the listing fee paid and notify admins. Safe to call from webhook and return page. */
export async function markListingPaid(restaurantId: string, opts: { sessionId?: string; paymentIntentId?: string | null; amount?: number; currency?: string }) {
  const r = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!r) return;
  const already = r.listingFeeStatus === "PAID";
  await prisma.restaurant.update({ where: { id: restaurantId }, data: { listingFeeStatus: "PAID" } });
  if (opts.sessionId) {
    const existing = await prisma.payment.findFirst({ where: { stripeSessionId: opts.sessionId } });
    const data = { status: "SUCCEEDED" as const, stripePaymentIntentId: opts.paymentIntentId ?? undefined };
    if (existing) await prisma.payment.update({ where: { id: existing.id }, data });
    else if (opts.amount !== undefined) {
      await prisma.payment.create({
        data: { restaurantId, type: "LISTING_FEE", amount: opts.amount, currency: opts.currency ?? "usd", stripeSessionId: opts.sessionId, ...data },
      });
    }
  }
  if (already) return;
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
  const to = [...new Set([process.env.ADMIN_NOTIFY_EMAIL, ...admins.map((a) => a.email)].filter(Boolean) as string[])];
  if (to.length) {
    await sendEmail({
      to,
      subject: `New restaurant awaiting approval: ${r.name}`,
      html: emailLayout("A restaurant is awaiting approval", `<p><strong>${r.name}</strong> (${r.city}) has paid the listing fee.</p>${emailButton(`${appUrl()}/admin/restaurants`, "Review restaurant")}`),
    });
  }
}
