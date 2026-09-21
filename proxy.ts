import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ADMIN_ROLES = ["administrator", "inspector"];

function isAdminRole(role?: string): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}

export default auth((req) => {
  // A session whose WordPress refresh token was definitively rejected is no
  // longer usable: treat it as logged out so the dashboard cannot bounce the
  // user straight back to /dashboard after sign-out.
  const authError = req.auth?.error;
  const isLoggedIn = !!req.auth && !authError;
  const path = req.nextUrl.pathname;
  const isDashboard = path.startsWith("/dashboard");

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(
      new URL(authError ? "/login?expired=1" : "/login", req.url),
    );
  }

  const role = req.auth?.user?.role;
  const dashboardUrl = isAdminRole(role)
    ? "/dashboard/admin/requests"
    : "/dashboard/customer";

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

  // Customers hitting the admin panel or the admin/inspector dashboard
  if (!isAdminRole(role)) {
    if (path === "/dashboard" || path.startsWith("/dashboard/admin")) {
      return NextResponse.redirect(new URL("/dashboard/customer", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/inspection", "/login", "/register"],
};
