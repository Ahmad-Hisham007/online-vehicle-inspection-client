import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/admin/archive",
}));

import ArchiveContent from "@/app/components/admin/ArchiveContent";
import ProposalsPage from "@/app/dashboard/(panel)/admin/proposals/page";
import SettingsPage from "@/app/dashboard/(panel)/admin/settings/page";

describe("Admin panel pages", () => {
  it("renders the ArchiveContent with empty state", () => {
    render(
      <ArchiveContent
        rows={[]}
        search=""
        page={1}
        status={null}
        totalPages={1}
        total={0}
      />,
    );
    expect(screen.getByText("No items found.")).toBeInTheDocument();
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter")).toBeInTheDocument();
  });

  it("renders the ArchiveContent with rows", () => {
    render(
      <ArchiveContent
        rows={[
          {
            id: "1",
            title: "Inspection #1",
            dateCreated: "2026-08-22T19:02:00",
            inspectionStatus: "approved",
            location: "MI",
            country: "USA",
            author: "John Doe",
            companies: ["uber", "lyft"],
          },
        ]}
        search=""
        page={1}
        status={null}
        totalPages={1}
        total={1}
      />,
    );
    expect(screen.getAllByText("Approved").length).toBeGreaterThan(0);
    expect(screen.getByText("Uber")).toBeInTheDocument();
    expect(screen.getByText("Lyft")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("USA, Michigan")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("renders the Proposals page", () => {
    render(<ProposalsPage />);
    expect(screen.getByText("Proposals")).toBeInTheDocument();
    expect(screen.getAllByText("Resolve").length).toBeGreaterThan(0);
  });

  it("renders the Settings page form", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});