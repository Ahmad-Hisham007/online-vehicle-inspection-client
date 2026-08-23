"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface HeaderMenuSkeletonProps {
  variant: "desktop" | "mobile";
  isOpen?: boolean;
}

const HeaderMenuSkeleton = ({
  variant,
  isOpen = true,
}: HeaderMenuSkeletonProps) => {
  if (variant === "mobile" && !isOpen) return null;

  return (
    <div
      className={
        variant === "desktop"
          ? "hidden md:flex items-center justify-between gap-6 h-20 w-full max-w-275 mx-auto"
          : "flex md:hidden items-center justify-between gap-6 h-20 w-full mx-auto px-2.5"
      }
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
          <Skeleton className="h-6 w-32 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md ml-auto" />
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </>
      )}
    </div>
  );
};

export default HeaderMenuSkeleton;
