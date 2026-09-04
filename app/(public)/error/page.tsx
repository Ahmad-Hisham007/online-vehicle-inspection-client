import Link from "next/link";
import { IoArrowBackOutline, IoPersonAddOutline } from "react-icons/io5";
import { buttonVariants } from "@/app/components/Button";
import { cn } from "@/lib/utils";

interface AuthErrorPageProps {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps) {
  const { error } = await searchParams;
  const isAccessDenied = error === "AccessDenied";

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10">
          {isAccessDenied ? (
            <IoPersonAddOutline className="size-7 text-primary" />
          ) : (
            <span className="text-2xl font-bold text-primary">!</span>
          )}
        </div>

        <h2 className="pt-5 text-2xl font-bold text-foreground">
          {isAccessDenied ? "Account not registered" : "Sign-in error"}
        </h2>
        <div className="mx-auto mb-5 mt-3 h-0.5 w-18 bg-linear-to-br from-primary to-secondary" />

        <p className="text-sm text-muted-foreground">
          {isAccessDenied ? (
            <>
              This Google account is not registered with us yet. Please create
              an account first — then you will be able to sign in with Google.
            </>
          ) : (
            "Something went wrong while signing you in. Please try again."
          )}
        </p>

        <div className="flex flex-col items-center gap-2 pt-6">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "primary", size: "default" }),
              "!w-auto !px-8",
            )}
          >
            {isAccessDenied ? (
              <>
                <IoPersonAddOutline className="size-4" /> Register an account
              </>
            ) : (
              "Try again"
            )}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 pt-3 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            <IoArrowBackOutline className="size-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
