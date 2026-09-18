import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "Restaurant on ChosenSpot";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const r = await prisma.restaurant.findUnique({ where: { slug: params.slug }, select: { name: true, cuisine: true, city: true, status: true } });
  const name = r && r.status === "APPROVED" ? r.name : "ChosenSpot";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg,#0f5d4a,#0a4436)", color: "#faf7f2" }}>
        <div style={{ fontSize: 34, letterSpacing: 2, opacity: 0.85 }}>CHOSENSPOT</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05 }}>{name}</div>
          {r && <div style={{ fontSize: 40, marginTop: 20, color: "#e6c98a" }}>{`${r.cuisine} · ${r.city}`}</div>}
        </div>
        <div style={{ fontSize: 30, opacity: 0.85 }}>Reserve the table you actually want.</div>
      </div>
    ),
    size
  );
}
