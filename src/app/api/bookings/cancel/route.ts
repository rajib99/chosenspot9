import { NextResponse } from "next/server";
import { z } from "zod";
import { cancelBookingByToken } from "@/lib/cancel";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  if (!rateLimit(`cancel:${clientIp(req)}`, 10, 60_000).ok) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const parsed = z.object({ token: z.string().min(10) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const r = await cancelBookingByToken(parsed.data.token);
  return r.ok ? NextResponse.json(r) : NextResponse.json(r, { status: r.code === "NOT_FOUND" ? 404 : 400 });
}
