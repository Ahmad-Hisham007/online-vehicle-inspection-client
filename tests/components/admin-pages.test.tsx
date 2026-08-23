import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

import RequestsPage from "@/app/dashboard/(panel)/admin/requests/page";
import UsersPage from "@/app/dashboard/(panel)/admin/users/page";
import ArchivePage from "@/app/dashboard/(panel)/admin/archive/page";
import ProposalsPage from "@/app/dashboard/(panel)/admin/proposals/page";
import SettingsPage from "@/app/dashboard/(panel)/admin/settings/page";

describe("Admin panel pages", () => {
  it("renders the Requests page with table chrome", () => {
    render(<RequestsPage />);
    expect(screen.getByText("Requests")).toBeInTheDocument();
    expect(screen.getAllByText("View Inspection").length).toBeGreaterThan(0);
  });

  it("renders the Users page", () => {
    render(<UsersPage />);
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getAllByText("Edit").length).toBeGreaterThan(0);
  });

  it("renders the Archive page", () => {
    render(<ArchivePage />);
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.getAllByText("Details").length).toBeGreaterThan(0);
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
