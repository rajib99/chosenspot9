"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; exact?: boolean };

export function DashboardNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
      {items.map((i) => {
        const active = i.exact ? path === i.href : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn("whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors lg:rounded-xl", active ? "bg-emerald text-white" : "text-ink-soft hover:bg-cream-200")}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
