import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-cream-200/60">
        <div className="container-page flex flex-col gap-3 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-lg text-ink">ChosenSpot</p>
          <nav className="flex gap-5">
            <Link href="/restaurants" className="hover:text-ink">Restaurants</Link>
            <Link href="/signup/restaurant" className="hover:text-ink">List your restaurant</Link>
            <Link href="/login" className="hover:text-ink">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
