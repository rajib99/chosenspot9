"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-7xl text-gold">Oops</p>
      <h1 className="mt-4 text-3xl font-semibold">Something went wrong in the kitchen</h1>
      <p className="mt-2 max-w-md text-ink-soft">An unexpected error occurred. You can try again — if it keeps happening, please let us know.{error.digest && <span className="mt-2 block text-xs text-ink-muted">Ref: {error.digest}</span>}</p>
      <div className="mt-8 flex gap-3"><Button onClick={reset}>Try again</Button><Button asChild variant="outline"><a href="/">Home</a></Button></div>
    </main>
  );
}
