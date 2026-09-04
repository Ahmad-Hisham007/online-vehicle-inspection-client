"use client";

import Link from "next/link";
import { IoArrowBackOutline, IoRefreshOutline } from "react-icons/io5";
import { Button, buttonVariants } from "@/app/components/Button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  reset?: () => void;
  resetLabel?: string;
  homeHref?: string;
  homeLabel?: string;
}

export default function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  reset,
  resetLabel = "Try again",
  homeHref,
  homeLabel = "Back",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-lg font-bold text-primary">
        !
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <div className="mx-auto mt-2 h-0.5 w-16 bg-linear-to-br from-primary to-secondary" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {reset && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="!w-auto !px-6"
            onClick={() => reset()}
          >
            <IoRefreshOutline className="size-4" />
            {resetLabel}
          </Button>
        )}
        {homeHref && (
          <Link
            href={homeHref}
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "!w-auto !px-6",
            )}
          >
            <IoArrowBackOutline className="size-4" />
            {homeLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
