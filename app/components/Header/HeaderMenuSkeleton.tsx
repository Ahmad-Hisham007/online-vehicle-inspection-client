"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface HeaderMenuSkeletonProps {
  variant: "desktop" | "mobile";
  isOpen?: boolean;
}

const HeaderMenuSkeleton = ({ variant, isOpen = true }: HeaderMenuSkeletonProps) => {
  if (variant === "mobile" && !isOpen) return null;

  return (
    <div
      className={variant === "desktop"
        ? "hidden md:flex items-center gap-6 h-20"
        : "md:hidden flex flex-col w-full min-h-[calc(100dvh-5rem)] pt-4"}
      aria-hidden="true"
    >
      {variant === "desktop" ? (
        <>
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md ml-auto" />
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </>
      ) : (
        <>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </>
      )}
    </div>
  );
};

export default HeaderMenuSkeleton;