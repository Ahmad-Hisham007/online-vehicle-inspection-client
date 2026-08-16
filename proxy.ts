import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = req.auth?.user?.role;
  const dashboardUrl =
    role === "administrator" ? "/dashboard/admin" : "/dashboard/customer";

  // Logged-in users are redirected away from auth pages to their dashboard
  if (isLoggedIn && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL(dashboardUrl, req.url));
  }

  if (path === "/inspection") {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard/customer", req.url));
  }

  if (role && role !== "administrator") {
    if (path === "/dashboard" || path.startsWith("/dashboard/admin")) {
      return NextResponse.redirect(new URL("/dashboard/customer", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/inspection", "/login", "/register"],
};
