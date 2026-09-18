import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devPaymentsSimulated } from "@/lib/stripe";
import { confirmBooking } from "@/lib/booking";
import { getSettings } from "@/lib/settings";

/** Local-development only (no Stripe key). [id] is the booking's cancel token. */
export async function POST(_: Request, { params }: { params: { id: string } }) {
  if (!devPaymentsSimulated()) return NextResponse.json({ error: "Not available" }, { status: 404 });
  const b = await prisma.booking.findUnique({ where: { cancelToken: params.id } });
  if (!b || b.status !== "PENDING") return NextResponse.json({ error: "Booking not payable" }, { status: 400 });
  const { commissionPercent } = await getSettings();
  const amount = Number(b.feeAmount);
  await confirmBooking(b.id, { sessionId: `dev_${Date.now()}`, amount, platformFee: Math.round(amount * commissionPercent) / 100 });
  return NextResponse.json({ url: `/booking/${b.cancelToken}` });
}
