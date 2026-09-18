import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { adminOrNull } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { emailButton, emailLayout, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/utils";

const schema = z.object({ action: z.enum(["approve", "reject", "suspend", "reactivate"]), reason: z.string().max(500).optional() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await adminOrNull();
  if (!admin) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const r = await prisma.restaurant.findUnique({ where: { id: params.id }, include: { owner: true } });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { action, reason } = parsed.data;

  if ((action === "approve" || action === "reactivate") && r.listingFeeStatus !== "PAID") return NextResponse.json({ error: "The listing fee hasn't been paid yet." }, { status: 400 });
  const status = action === "approve" || action === "reactivate" ? "APPROVED" : action === "reject" ? "REJECTED" : "SUSPENDED";
  await prisma.restaurant.update({ where: { id: r.id }, data: { status } });
  await audit(admin.id, `restaurant.${action}`, "Restaurant", r.id, { name: r.name, reason });

  const to = r.email || r.owner.email;
  if (action === "approve") await sendEmail({ to, subject: `${r.name} is now live on ChosenSpot`, html: emailLayout("You're live!", `<p>Great news — <strong>${r.name}</strong> has been approved and is now visible to guests.</p>${emailButton(`${appUrl()}/restaurant/tables`, "Add or review your tables")}`) });
  if (action === "reject") await sendEmail({ to, subject: `Update on your ChosenSpot listing`, html: emailLayout("Your listing wasn't approved", `<p>We couldn't approve <strong>${r.name}</strong> at this time.${reason ? ` Reason: ${reason}` : ""}</p><p>You can update your profile and reply to this email to be reviewed again.</p>`) });
  return NextResponse.json({ ok: true, status });
}
