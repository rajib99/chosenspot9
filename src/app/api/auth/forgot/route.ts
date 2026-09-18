import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emailButton, emailLayout, sendEmail } from "@/lib/email";
import { appUrl } from "@/lib/utils";

export async function POST(req: Request) {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  // Always answer the same way so the endpoint can't be used to discover accounts.
  if (user && !user.suspended) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.deleteMany({ where: { email } });
    await prisma.passwordResetToken.create({
      data: { email, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = `${appUrl()}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Reset your ChosenSpot password",
      html: emailLayout("Reset your password", `<p>Use the button below to choose a new password. The link expires in one hour.</p>${emailButton(link, "Reset password")}<p style="font-size:12px">${link}</p>`),
    });
  }
  return NextResponse.json({ ok: true });
}
