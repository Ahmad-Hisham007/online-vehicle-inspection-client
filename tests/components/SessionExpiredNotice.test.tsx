import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockReplace = vi.hoisted(() => vi.fn());
const mockSearchParams = vi.hoisted(() => ({
  value: new URLSearchParams("expired=1"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams.value,
}));

import SessionExpiredNotice from "@/app/(public)/(auth)/login/_components/SessionExpiredNotice";

describe("SessionExpiredNotice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.value = new URLSearchParams("expired=1");
  });

  it("shows the notice and strips the query param", () => {
    render(<SessionExpiredNotice />);

    expect(screen.getByRole("status")).toHaveTextContent(/session expired/i);
    expect(mockReplace).toHaveBeenCalledWith("/login", { scroll: false });
  });

  it("renders nothing without the expired flag", () => {
    mockSearchParams.value = new URLSearchParams("");

    render(<SessionExpiredNotice />);

    expect(screen.queryByRole("status")).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
