import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";

// Mock the server action for certificate generation
const mockGenerateCertificate = vi.fn().mockResolvedValue({
  previewUrl: "data:application/pdf;base64,test",
  mimeType: "application/pdf",
  contentDisposition: 'attachment; filename="certificate-123.pdf"',
});

const mockSaveCertificateToCDN = vi.fn().mockResolvedValue({
  publicUrl: "https://cdn.example.com/certificates/cert-123.pdf",
});

vi.mock("@/app/actions/certificate", () => ({
  generateCertificate: mockGenerateCertificate,
  saveCertificateToCDN: mockSaveCertificateToCDN,
}));

const { mockApproveInspection } = vi.hoisted(() => ({
  mockApproveInspection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/actions/admin", () => ({
  approveInspection: mockApproveInspection,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { name: "Admin User" } },
    status: "authenticated",
  }),
}));

vi.mock("@/app/lib/pdf/resolver", () => ({
  hasTemplateMapper: vi.fn(),
}));

import ApprovalDialog from "@/app/components/InspectionDetailView/ApprovalDialog";
import { hasTemplateMapper } from "@/app/lib/pdf/resolver";
import { useInspectionStore } from "@/app/store/inspectionStore";
import type { InspectionDetail } from "@/app/lib/types";

const mockHasTemplateMapper = vi.mocked(hasTemplateMapper);

function detail(overrides: Partial<InspectionDetail> = {}): InspectionDetail {
  return {
    id: "234",
    dateCreated: "2026-08-15T17:14:00",
    dateModified: "2026-08-15T17:14:00",
    inspectionStatus: "paid",
    paymentStatus: "succeeded",
    vin: "1HGCM82633A004352",
    make: "Honda",
    model: "Accord",
    year: "2020",
    fuelType: "gasoline",
    mileage: "50000",
    color: "Silver",
    location: { country: "USA", state: "AL" },
    companies: ["uber", "lyft", "getaround"],
    inspectionDate: "2026-08-15",
    expiryDate: "",
    hostName: "Test User",
    hostEmail: "test@example.com",
    hostPhoneNumber: "555-0100",
    driverName: "Test User",
    driverEmail: "test@example.com",
    driverPhoneNumber: "+15550100",
    media: { general: [], interior: [], exterior: [], tires: [] },
    certificates: {},
    orderSubtotal: "63",
    approvalFields: {
      vehicleMake: "Honda",
      vehicleModel: "Accord",
      frontBrakeLeft: "pass",
      inspectionStateUsa: "AL",
      inspectionStateCanada: "",
    },
    author: {
      node: {
        databaseId: 1,
        displayName: "John Doe",
      },
    },
    handlerName: "John Doe",
    handlerSignature: "Signature here",
    licensePlate: "",
    ...overrides,
  };
}

function renderDialog(inspection = detail()) {
  return render(
    <ApprovalDialog open onOpenChange={vi.fn()} inspection={inspection} />,
  );
}

/** Expand every company's "Advanced Settings" section (collapsed by default). */
function openAdvancedSettings() {
  for (const toggle of screen.getAllByRole("button", {
    name: /Advanced Settings/,
  })) {
    fireEvent.click(toggle);
  }
}

let openSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  useInspectionStore.setState({ approvalCardState: {} });
  mockHasTemplateMapper.mockReturnValue(true);
  openSpy = vi.spyOn(window, "open").mockReturnValue({
    document: { write: vi.fn(), close: vi.fn() },
  } as unknown as Window);
  mockGenerateCertificate.mockResolvedValue({
    previewUrl: "data:application/pdf;base64,test",
    mimeType: "application/pdf",
    contentDisposition: 'attachment; filename="certificate-123.pdf"',
  });
  mockSaveCertificateToCDN.mockResolvedValue({
    publicUrl: "https://cdn.example.com/certificates/cert-123.pdf",
  });
});

afterEach(() => {
  openSpy.mockRestore();
});

describe("ApprovalDialog", () => {
  it("renders an accordion only for certificate companies", () => {
    renderDialog();

    expect(screen.getByText("Approve inspection")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Uber/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Lyft/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Getaround/ }),
    ).not.toBeInTheDocument();
  });

  it("pre-fills the forms from the inspection approvalFields", () => {
    renderDialog();
    openAdvancedSettings();

    expect(screen.getAllByDisplayValue("Honda").length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue("Accord").length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue("Alabama").length).toBeGreaterThan(0);
  });

  it("hides the Canada province field for a USA inspection", () => {
    renderDialog();
    openAdvancedSettings();
    const uberPanel = screen.getByRole("button", { name: /Uber/ })
      .parentElement?.parentElement;
    expect(within(uberPanel as HTMLElement).queryByText("Province (Canada)")).toBeNull();
  });

  it("shows the province field for a Canada inspection", () => {
    renderDialog(
      detail({
        location: { country: "Canada", state: "ON" },
        approvalFields: { ...detail().approvalFields, inspectionStateCanada: "ON" },
      }),
    );
    openAdvancedSettings();
    expect(screen.getAllByText("Province (Canada)").length).toBeGreaterThan(0);
    expect(screen.queryByText("State (USA)")).not.toBeInTheDocument();
  });

  it("toggles the Generate icon and opens a preview tab", async () => {
    renderDialog();

    const generateButtons = screen.getAllByRole("button", {
      name: /Generate/,
    });
    const first = generateButtons[0];

    fireEvent.click(first);

    // Generate creates the certificate asynchronously
    await waitFor(() => {
      expect(mockGenerateCertificate).toHaveBeenCalled();
    });

    expect(openSpy).toHaveBeenCalled();
  });

  it("reveals Save only after Generate and disables it once saved", async () => {
    renderDialog();

    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Generate/ })[0]);

    // Generate creates the certificate asynchronously, so wait for Save to appear
    const save = await screen.findByRole("button", { name: "Save" });
    expect(save).toBeEnabled();

    fireEvent.click(save);

    // Save is async (CDN upload) — wait for the "Saved" state
    const savedBtn = await screen.findByRole("button", { name: "Saved" });
    expect(savedBtn).toBeDisabled();
  });

  it("renders pass/fail fields as radios and yes/no as radios", () => {
    renderDialog();
    openAdvancedSettings();
    // 3 companies × (registration sticker + 4 brakes) = 15 pass/fail groups
    expect(screen.getAllByLabelText("Pass").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Fail").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Yes").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("No").length).toBeGreaterThan(0);
  });

  it("shows an empty message when no certificate companies are present", () => {
    renderDialog(detail({ companies: ["getaround"] }));
    expect(
      screen.getByText("No certificate companies on this inspection."),
    ).toBeInTheDocument();
  });

  it("shows the skip panel instead of the form when no template exists", () => {
    mockHasTemplateMapper.mockReturnValue(false);
    renderDialog();

    expect(
      screen.getAllByText(/Certificate template not yet available/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /Skip this form/ }).length,
    ).toBeGreaterThan(0);
    // No Generate button inside the skipped company's panel
    expect(
      screen.queryByRole("button", { name: /Generate/ }),
    ).not.toBeInTheDocument();
  });

  it("marks a company as skipped and enables Approve when all are saved-or-skipped", async () => {
    mockHasTemplateMapper.mockReturnValue(false);
    renderDialog();

    // Skip every company — re-query between clicks (DOM nodes are replaced)
    while (screen.queryAllByRole("button", { name: /Skip this form/ }).length > 0) {
      fireEvent.click(
        screen.getAllByRole("button", { name: /Skip this form/ })[0],
      );
    }

    const state = useInspectionStore.getState().approvalCardState["234"];
    expect(state?.skippedBy).toEqual({ lyft: true, uber: true, turo: false });

    // Approve button appears once every company is saved-or-skipped
    expect(await screen.findByRole("button", { name: "Approve" })).toBeEnabled();
    expect(
      screen.getByText(/Approving without certificates for: Uber, Lyft/),
    ).toBeInTheDocument();
  });

  it("keeps Approve hidden while a company is neither saved nor skipped", () => {
    mockHasTemplateMapper.mockReturnValue(false);
    renderDialog();

    // Only skip the first company
    fireEvent.click(
      screen.getAllByRole("button", { name: /Skip this form/ })[0],
    );

    expect(screen.queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
  });

  it("allows approving a mixed saved + skipped set", async () => {
    // lyft has a template (pre-saved), uber does not (must be skipped)
    mockHasTemplateMapper.mockImplementation((input) => input.company === "lyft");
    renderDialog();

    // Pre-seed: lyft already saved, uber not processed
    useInspectionStore.setState({
      approvalCardState: {
        "234": {
          inspectionId: "234",
          mergedOverrides: { vehicleMake: "Honda" },
          certificates: { lyft: "https://cdn.example.com/lyft.pdf" },
          generatedBy: { lyft: true, uber: false, turo: false },
          savedBy: { lyft: true, uber: false, turo: false },
          skippedBy: { lyft: false, uber: false, turo: false },
        },
      },
    });

    // Skip uber (the only unsaved company)
    fireEvent.click(screen.getByRole("button", { name: /Skip this form/ }));

    expect(await screen.findByRole("button", { name: "Approve" })).toBeEnabled();
  });

  it("approves without sending a certificate for a skipped company", async () => {
    mockHasTemplateMapper.mockImplementation((input) => input.company === "lyft");
    renderDialog();

    // Skip uber (no template) and pre-save lyft
    useInspectionStore.setState({
      approvalCardState: {
        "234": {
          inspectionId: "234",
          mergedOverrides: { vehicleMake: "Honda" },
          certificates: { lyft: "https://cdn.example.com/lyft.pdf" },
          generatedBy: { lyft: true, uber: false, turo: false },
          savedBy: { lyft: true, uber: false, turo: false },
          skippedBy: { lyft: false, uber: true, turo: false },
        },
      },
    });

    const approveButton = await screen.findByRole("button", { name: "Approve" });
    fireEvent.click(approveButton);

    await waitFor(() => expect(mockApproveInspection).toHaveBeenCalledTimes(1));
    expect(mockApproveInspection).toHaveBeenCalledWith("234", "1", {
      mergedOverrides: { vehicleMake: "Honda" },
      certificates: { lyft: "https://cdn.example.com/lyft.pdf" },
    });
  });
});