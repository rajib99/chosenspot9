import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-10">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-8 h-20 w-full" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i}><Skeleton className="aspect-[16/10] w-full" /><Skeleton className="mt-4 h-5 w-2/3" /><Skeleton className="mt-2 h-4 w-1/3" /></div>)}</div>
    </div>
  );
}
