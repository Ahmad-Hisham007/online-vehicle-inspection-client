import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

const mockSignOut = vi.hoisted(() => vi.fn());
const mockSession = vi.hoisted(() => ({
  value: { data: null } as { data: { error?: string } | null },
}));
const mockPathname = vi.hoisted(() => ({ value: "/dashboard/customer" }));

vi.mock("next-auth/react", () => ({
  useSession: () => mockSession.value,
  signOut: mockSignOut,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname.value,
}));

import SessionExpiryHandler from "@/app/components/SessionExpiryHandler";

describe("SessionExpiryHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.value = { data: null };
    mockPathname.value = "/dashboard/customer";
  });

  it("does not sign out for a healthy session", () => {
    render(<SessionExpiryHandler />);

    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it("signs out to the login page when the refresh token is rejected", () => {
    mockSession.value = { data: { error: "RefreshAccessTokenError" } };

    render(<SessionExpiryHandler />);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledWith({
      redirectTo: "/login?expired=1",
    });
  });

  it("signs out only once even when the component re-renders", () => {
    mockSession.value = { data: { error: "RefreshAccessTokenError" } };

    const { rerender } = render(<SessionExpiryHandler />);
    rerender(<SessionExpiryHandler />);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("never signs out while on the login page", () => {
    mockSession.value = { data: { error: "RefreshAccessTokenError" } };
    mockPathname.value = "/login";

    render(<SessionExpiryHandler />);

    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
