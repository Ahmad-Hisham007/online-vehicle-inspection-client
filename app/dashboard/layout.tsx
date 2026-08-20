import { Suspense } from "react";
import HeaderNav from "@/app/components/Header/HeaderNav";
import HeaderSkeleton from "@/app/components/Header/HeaderSkeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <HeaderNav />
      </Suspense>
      <main className="flex-1">{children}</main>
    </>
  );
}