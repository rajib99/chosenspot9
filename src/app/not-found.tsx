import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-7xl text-emerald">404</p>
      <h1 className="mt-4 text-3xl font-semibold">This table isn&apos;t on the floor plan</h1>
      <p className="mt-2 max-w-md text-ink-soft">The page you&apos;re looking for has moved, or never existed. Let&apos;s find you a seat elsewhere.</p>
      <div className="mt-8 flex gap-3"><Button asChild><Link href="/restaurants">Browse restaurants</Link></Button><Button asChild variant="outline"><Link href="/">Home</Link></Button></div>
    </main>
  );
}
