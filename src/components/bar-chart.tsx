"use client";
import { useState } from "react";

export type Bar = { label: string; value: number };

const niceMax = (v: number) => {
  if (v <= 0) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};

/** Single-series column chart: thin rounded-top bars, hairline grid, hover tooltip, table view for a11y. */
export function BarChart({ title, data, kind = "count", currency = "usd", unitLabel }: { title: string; data: Bar[]; kind?: "count" | "money"; currency?: string; unitLabel: string }) {
  const format = (n: number) => (kind === "money" ? new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: n % 1 ? 2 : 0 }).format(n) : String(Math.round(n * 100) / 100));
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 220, L = 44, R = 8, T = 12, B = 26;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const slot = (W - L - R) / data.length;
  const bw = Math.min(24, slot - 4);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const ticks = [0, max / 2, max];
  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <figure className="rounded-xl border border-line bg-white p-5 shadow-soft">
      <figcaption className="mb-1 flex items-baseline justify-between gap-3">
        <span className="font-serif text-lg">{title}</span>
        <span className="text-sm text-ink-muted">{format(total)} {unitLabel}</span>
      </figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${title}, last ${data.length} days. Total ${format(total)}.`} onMouseLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e6dfd2" strokeWidth="1" />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#7a746a">{format(t)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = L + i * slot + (slot - bw) / 2;
            const h = Math.max(0, (H - T - B) * (d.value / max));
            const r = Math.min(4, h);
            return (
              <g key={d.label} onMouseEnter={() => setHover(i)}>
                {/* wide invisible hit target: bigger than the mark */}
                <rect x={L + i * slot} y={T} width={slot} height={H - T - B} fill="transparent" />
                {h > 0 && <path d={`M${x},${T + (H - T - B)} v${-(h - r)} a${r},${r} 0 0 1 ${r},${-r} h${bw - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} z`} fill="#0f5d4a" opacity={hover === null || hover === i ? 1 : 0.45} />}
                {i % 5 === 0 && <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#7a746a">{d.label.slice(5)}</text>}
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-line bg-white px-3 py-1.5 text-xs shadow-lift" style={{ left: `${((L + hover * slot + slot / 2) / W) * 100}%` }}>
            <div className="text-ink-muted">{data[hover].label}</div>
            <div className="font-medium">{format(data[hover].value)}</div>
          </div>
        )}
      </div>
      <details className="mt-2 text-xs text-ink-muted">
        <summary className="cursor-pointer">View as table</summary>
        <table className="mt-2 w-full text-left"><tbody>{data.map((d) => <tr key={d.label}><td className="py-0.5">{d.label}</td><td className="text-right">{format(d.value)}</td></tr>)}</tbody></table>
      </details>
    </figure>
  );
}
