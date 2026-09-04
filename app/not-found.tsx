"use client";

import Link from "next/link";
import { IoHomeOutline } from "react-icons/io5";
import { buttonVariants } from "@/app/components/Button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-6xl font-black text-primary/20">404</p>
        <h2 className="pt-3 text-2xl font-bold text-foreground">
          Page not found
        </h2>
        <div className="mx-auto mt-3 h-0.5 w-16 bg-linear-to-br from-primary to-secondary" />
        <p className="pt-3 text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col items-center gap-2 pt-6">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "primary", size: "default" }),
              "!w-auto !px-8",
            )}
          >
            <IoHomeOutline className="size-4" /> Back to home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 pt-3 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
