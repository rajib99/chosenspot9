import { tagMeta } from "@/lib/tags";
import { cn } from "@/lib/utils";

export function TagBadge({ tag, className }: { tag: string; className?: string }) {
  const m = tagMeta(tag);
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", m.gold ? "border border-gold/30 bg-gold-light text-gold" : "bg-cream-200 text-ink-soft", className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {m.label}
    </span>
  );
}

export function FeeBadge({ fee, currency }: { fee: number; currency: string }) {
  if (fee <= 0) return <span className="inline-flex rounded-full bg-emerald px-2.5 py-1 text-xs font-medium text-white">Free</span>;
  return <span className="text-sm font-medium text-ink">{new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: fee % 1 ? 2 : 0 }).format(fee)}</span>;
}
