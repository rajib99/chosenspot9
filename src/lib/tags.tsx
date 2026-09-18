import { AppWindow, Armchair, Crown, Sun, Sparkles, type LucideIcon } from "lucide-react";

export const PRESET_TAGS = ["WINDOW", "CENTER", "TERRACE", "VIP", "OTHER"] as const;

const META: Record<string, { label: string; icon: LucideIcon; gold?: boolean }> = {
  WINDOW: { label: "Window", icon: AppWindow },
  CENTER: { label: "Center stage", icon: Armchair },
  TERRACE: { label: "Terrace", icon: Sun },
  VIP: { label: "VIP", icon: Crown, gold: true },
  OTHER: { label: "Special", icon: Sparkles },
};

export function tagMeta(tag: string) {
  return META[tag] ?? { label: tag, icon: Sparkles };
}
