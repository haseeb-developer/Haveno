import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-[1500px] px-6 py-12 lg:px-10">
      <div className="mb-10 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-5">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="mt-4 h-3 w-24" />
            <Skeleton className="mt-2 h-4 w-32" />
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-8">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <Skeleton className="mt-4 h-4 w-48" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
      </Card>
    </main>
  );
}
