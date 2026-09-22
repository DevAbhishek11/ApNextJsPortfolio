import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/surface";

function CardSkeleton() {
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <Skeleton className="aspect-[16/10] w-full" />
      <Skeleton className="mt-4 h-4 w-2/3" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  );
}

export function PageSkeleton({ withGrid = true }: { withGrid?: boolean }) {
  return (
    <div aria-label="Loading content" aria-busy="true">
      <div className="border-b border-border pt-16">
        <Container className="py-16 sm:py-20">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-10 w-2/3 max-w-xl" />
          <Skeleton className="mt-4 h-4 w-1/2 max-w-lg" />
        </Container>
      </div>
      <Container className="py-14">
        {withGrid ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div aria-label="Loading content" aria-busy="true">
      <div className="flex min-h-[80svh] items-center pt-16">
        <Container>
          <Skeleton className="h-7 w-56 rounded-full" />
          <Skeleton className="mt-8 h-16 w-3/4 max-w-2xl" />
          <Skeleton className="mt-4 h-8 w-64" />
          <Skeleton className="mt-4 h-4 w-full max-w-lg" />
          <Skeleton className="mt-3 h-4 w-2/3 max-w-lg" />
          <div className="mt-9 flex gap-3">
            <Skeleton className="h-12 w-36" />
            <Skeleton className="h-12 w-44" />
          </div>
        </Container>
      </div>
      <div className="border-y border-border py-12">
        <Container>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="mx-auto h-10 w-24 lg:mx-0" />
                <Skeleton className="mx-auto mt-2 h-3 w-32 lg:mx-0" />
              </div>
            ))}
          </div>
        </Container>
      </div>
      <Container className="py-20">
        <Skeleton className="mx-auto h-3 w-20" />
        <Skeleton className="mx-auto mt-4 h-9 w-72" />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-label="Loading content" aria-busy="true">
      <div className="border-b border-border pt-16">
        <Container className="pb-10 pt-14">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-6 h-11 w-2/3 max-w-xl" />
          <Skeleton className="mt-4 h-4 w-1/2 max-w-lg" />
          <Skeleton className="mt-6 h-7 w-64" />
        </Container>
      </div>
      <Container className="py-10">
        <Skeleton className="aspect-[16/8] w-full rounded-[1.25rem]" />
        <div className="mt-12 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </Container>
    </div>
  );
}
