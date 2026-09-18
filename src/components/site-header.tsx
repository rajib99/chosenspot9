import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getSession, homeForRole } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function SiteHeader() {
  const session = await getSession();
  const user = session?.user;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="font-serif text-xl font-semibold sm:text-2xl tracking-tight text-ink">
          Chosen<span className="text-emerald">Spot</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/restaurants" className="hidden px-3 text-sm text-ink-soft hover:text-ink sm:block">Restaurants</Link>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm"><Link href={homeForRole(user.role)}>{user.role === "CUSTOMER" ? "My bookings" : "Dashboard"}</Link></Button>
              <SignOutButton />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/signup/restaurant">For restaurants</Link></Button>
              <Button asChild size="sm"><Link href="/login">Sign in</Link></Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
