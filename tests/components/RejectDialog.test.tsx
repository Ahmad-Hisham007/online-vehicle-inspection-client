import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockRejectInspection = vi.hoisted(() => vi.fn());
const mockToastSuccess = vi.hoisted(() => vi.fn());
const mockToastError = vi.hoisted(() => vi.fn());
const mockRefresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh }),
}));
vi.mock("react-hot-toast", () => ({
  default: { success: mockToastSuccess, error: mockToastError },
}));
vi.mock("@/app/actions/admin", () => ({
  rejectInspection: mockRejectInspection,
}));

import RejectDialog from "@/app/components/InspectionDetailView/RejectDialog";

function renderDialog(overrides: Record<string, unknown> = {}) {
  return render(
    <RejectDialog
      open
      onOpenChange={vi.fn()}
      inspectionId="234"
      inspectionAuthorId="1"
      onRefresh={mockRefresh}
      {...overrides}
    />,
  );
}

/** Select one or more options in the native multi-select by label. */
function selectOptions(labels: string[]) {
  const select = screen.getByLabelText("Invalid fields") as HTMLSelectElement;
  for (const label of labels) {
    const option = Array.from(select.options).find((o) => o.text === label);
    if (!option) throw new Error(`Option not found: ${label}`);
    option.selected = true;
  }
  fireEvent.change(select);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRejectInspection.mockResolvedValue(undefined);
});

describe("RejectDialog", () => {
  it("lists all 17 invalid fields as options", () => {
    renderDialog();

    const select = screen.getByLabelText("Invalid fields");
    const options = Array.from(select.querySelectorAll("option"));

    expect(options).toHaveLength(17);
    expect(options.map((o) => o.textContent)).toEqual([
      "License plate",
      "Driver seat adjustment",
      "Passenger seat adjustment",
      "Exterior front",
      "Exterior rear",
      "Exterior right",
      "Exterior left",
      "Horn",
      "Interior backseat",
      "Interior driver side",
      "Interior passenger side",
      "Tire front left",
      "Tire front right",
      "Tire rear left",
      "Tire rear right",
      "Odometer",
      "VIN",
    ]);
  });

  it("shows an inline error when submitting with nothing selected", async () => {
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: /Confirm rejection/ }));

    expect(
      await screen.findByText("Select at least one invalid field"),
    ).toBeInTheDocument();
    expect(mockRejectInspection).not.toHaveBeenCalled();
  });

  it("shows a reason error when submitting without a reason", async () => {
    renderDialog();

    selectOptions(["Horn"]);
    fireEvent.click(screen.getByRole("button", { name: /Confirm rejection/ }));

    expect(
      await screen.findByText("Rejection reason is required"),
    ).toBeInTheDocument();
    expect(mockRejectInspection).not.toHaveBeenCalled();
  });

  it("submits the selected fields and trimmed reason", async () => {
    renderDialog();

    selectOptions(["License plate", "VIN"]);
    fireEvent.change(
      screen.getByPlaceholderText("Describe what needs to be fixed…"),
      { target: { value: "  Fix the VIN and plate  " } },
    );
    fireEvent.click(screen.getByRole("button", { name: /Confirm rejection/ }));

    await waitFor(() => expect(mockRejectInspection).toHaveBeenCalledTimes(1));
    expect(mockRejectInspection).toHaveBeenCalledWith("234", "1", {
      invalidFields: ["licensePlate", "vin"],
      rejectionReason: "Fix the VIN and plate",
    });
  });

  it("calls onRefresh after successful rejection", async () => {
    renderDialog();

    selectOptions(["License plate"]);
    fireEvent.change(
      screen.getByPlaceholderText("Describe what needs to be fixed…"),
      { target: { value: "Fix plate" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /Confirm rejection/ }));

    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalled());
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("keeps the dialog open and shows an error when the action throws", async () => {
    mockRejectInspection.mockRejectedValueOnce(new Error("WP down"));
    renderDialog();

    selectOptions(["License plate"]);
    fireEvent.change(
      screen.getByPlaceholderText("Describe what needs to be fixed…"),
      { target: { value: "Bad" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /Confirm rejection/ }));

    await waitFor(() => expect(mockRejectInspection).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("resets selections when reopened", () => {
    const onOpenChange = vi.fn();
    const { rerender } = renderDialog({ onOpenChange });

    selectOptions(["Horn"]);
    // Both the <option> and summary span render "Horn" — verify a match exists
    expect(screen.getAllByText("Horn").length).toBeGreaterThanOrEqual(1);

    rerender(
      <RejectDialog
        open={false}
        onOpenChange={onOpenChange}
        inspectionId="234"
        inspectionAuthorId="1"
        onRefresh={mockRefresh}
      />,
    );

    rerender(
      <RejectDialog
        open
        onOpenChange={onOpenChange}
        inspectionId="234"
        inspectionAuthorId="1"
        onRefresh={mockRefresh}
      />,
    );

    // summary resets to the empty placeholder
    expect(
      screen.getByText("Select invalid fields…"),
    ).toBeInTheDocument();
    // no "field selected" summary text
    expect(screen.queryByText(/field selected/)).not.toBeInTheDocument();
  });

  it("shows error toast when rejection fails", async () => {
    mockRejectInspection.mockRejectedValueOnce(new Error("WP down"));
    renderDialog();

    selectOptions(["License plate"]);
    fireEvent.change(
      screen.getByPlaceholderText("Describe what needs to be fixed…"),
      { target: { value: "Fix plate" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /Confirm rejection/ }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    expect(mockToastError).toHaveBeenCalledWith("WP down");
  });
});