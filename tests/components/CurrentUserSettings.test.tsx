import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockUpdateCurrentUser = vi.hoisted(() => vi.fn());
const mockUpdateUserSignature = vi.hoisted(() => vi.fn());
const mockUpdateCurrentUserPassword = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());

vi.mock("@/app/actions/users", () => ({
  updateCurrentUser: mockUpdateCurrentUser,
  updateUserSignature: mockUpdateUserSignature,
  updateCurrentUserPassword: mockUpdateCurrentUserPassword,
}));

vi.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

// Mock FileUploadField so we don't need to deal with its internal XHR/upload logic
vi.mock("@/app/components/FileUploadField", () => ({
  FileUploadField: ({ onChange, label }: { onChange: (meta: { status: string; publicUrl?: string }) => void; label: string }) => (
    <div data-testid="file-upload-field">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange({ status: "done", publicUrl: "https://example.com/sig.png" })}
      >
        Simulate Upload
      </button>
    </div>
  ),
}));

import CurrentUserSettingsForm from "@/app/components/admin/CurrentUserSettingsForm";

const mockUser = {
  displayName: "Test Inspector",
  email: "inspector@example.com",
  firstName: "Test",
  lastName: "Inspector",
  phone: "555-0100",
  signature: "https://example.com/signature.png",
  registeredDate: "2025-03-15T10:00:00",
};

const renderForm = (userOverride?: Partial<typeof mockUser>) =>
  render(
    <CurrentUserSettingsForm user={{ ...mockUser, ...userOverride }} />,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateCurrentUser.mockResolvedValue(undefined);
  mockUpdateUserSignature.mockResolvedValue(undefined);
  mockUpdateCurrentUserPassword.mockResolvedValue(undefined);
});

describe("CurrentUserSettingsForm", () => {
  it("renders pre-filled form with user data", () => {
    renderForm();

    expect(screen.getByDisplayValue("inspector@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Inspector")).toBeInTheDocument();
    expect(screen.getByDisplayValue("555-0100")).toBeInTheDocument();
  });

  it("renders display name and email subtitle in header", () => {
    renderForm();

    expect(screen.getByText("Test Inspector")).toBeInTheDocument();
    expect(screen.getByText("inspector@example.com")).toBeInTheDocument();
  });

  it("renders signature badge when signature exists", () => {
    renderForm();

    const sigImg = screen.getByAltText("Current signature");
    expect(sigImg).toBeInTheDocument();
    expect(sigImg).toHaveAttribute("src", "https://example.com/signature.png");
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("does not render signature badge when signature is empty", () => {
    renderForm({ signature: "" });

    expect(screen.queryByAltText("Current signature")).not.toBeInTheDocument();
  });

  it("renders FileUploadField for signature upload", () => {
    renderForm();

    expect(screen.getByText("Signature (PNG)")).toBeInTheDocument();
    expect(screen.getByTestId("file-upload-field")).toBeInTheDocument();
  });

  it("renders Update password button", () => {
    renderForm();

    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });

  it("renders Save Changes button", () => {
    renderForm();

    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("calls updateCurrentUser with form data on submit", async () => {
    const user = userEvent.setup();
    renderForm();

    const firstNameInput = screen.getByDisplayValue("Test");
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "UpdatedName");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateCurrentUser).toHaveBeenCalledWith({
        firstName: "UpdatedName",
        lastName: "Inspector",
        email: "inspector@example.com",
        phone: "555-0100",
      });
    });
  });

  it("shows success toast on successful update", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith("Profile updated");
    });
  });

  it("shows error toast on failed update", async () => {
    const user = userEvent.setup();
    mockUpdateCurrentUser.mockRejectedValue(new Error("Network error"));

    renderForm();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith("Network error");
    });
  });

  it("opens password dialog and validates confirmation match", async () => {
    const user = userEvent.setup();
    renderForm();

    // Open dialog
    await user.click(screen.getByRole("button", { name: /update password/i }));

    // The dialog should be visible
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Enter new password"), "password123");
    await user.type(screen.getByPlaceholderText("Confirm new password"), "different");

    // Submit using the dialog footer button
    const dialogButtons = screen.getAllByRole("button", { name: /update password/i });
    // The last one is the dialog footer submit button (has loading text variant)
    await user.click(dialogButtons[dialogButtons.length - 1]);

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });
  });

  it("submits password when passwords match", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Enter new password"), "newpassword");
    await user.type(screen.getByPlaceholderText("Confirm new password"), "newpassword");

    const dialogButtons = screen.getAllByRole("button", { name: /update password/i });
    await user.click(dialogButtons[dialogButtons.length - 1]);

    await waitFor(() => {
      expect(mockUpdateCurrentUserPassword).toHaveBeenCalledWith("newpassword");
    });
  });

  it("closes password dialog on cancel", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /update password/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("calls updateUserSignature when signature upload completes", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /simulate upload/i }));

    await waitFor(() => {
      expect(mockUpdateUserSignature).toHaveBeenCalledWith("https://example.com/sig.png");
    });
  });
});
