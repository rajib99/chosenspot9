import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-8">
      <Skeleton className="aspect-[16/6] w-full" />
      <Skeleton className="mt-8 h-12 w-1/2" />
      <Skeleton className="mt-4 h-24 w-full max-w-2xl" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-56" />)}</div>
    </div>
  );
}
