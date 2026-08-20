import { Skeleton } from "@/components/ui/skeleton";

export default function HeaderSkeleton() {
  return (
    <header className="w-full bg-white shadow-sm relative z-50">
      <div className="max-w-290 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex-1 flex justify-start">
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>

          <div className="flex-1 flex justify-center">
            <Skeleton className="h-10 w-36 rounded" />
          </div>

          <div className="flex-1 flex justify-end">
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    </header>
  );
}