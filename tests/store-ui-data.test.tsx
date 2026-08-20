import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useUIStore } from "@/app/store/uiStore";
import { useDataStore, DATA_TTL } from "@/app/store/dataStore";
import { LoadingIndicator } from "@/app/components/LoadingIndicator";

describe("uiStore", () => {
  beforeEach(() => {
    useUIStore.setState({ navPending: false });
  });

  it("starts with navPending=false", () => {
    expect(useUIStore.getState().navPending).toBe(false);
  });

  it("setNavPending updates navPending", () => {
    useUIStore.getState().setNavPending(true);
    expect(useUIStore.getState().navPending).toBe(true);
  });
});

describe("dataStore", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useDataStore.setState({ details: {}, listVersion: 0 });
  });

  const detail = {
    id: "42",
    licensePlate: "ABC123",
    paymentStatus: "pending",
    orderSubtotal: 99,
  } as never;

  it("setDetail then getDetail returns cached entry", () => {
    useDataStore.getState().setDetail("42", detail);
    expect(useDataStore.getState().getDetail("42")).toBe(detail);
  });

  it("getDetail returns null for unknown id", () => {
    expect(useDataStore.getState().getDetail("missing")).toBeNull();
  });

  it("getDetail returns null when entry exceeds TTL", () => {
    useDataStore.getState().setDetail("42", detail);
    vi.spyOn(Date, "now").mockReturnValueOnce(Date.now() + DATA_TTL + 1);
    expect(useDataStore.getState().getDetail("42")).toBeNull();
    expect(useDataStore.getState().details["42"]).toBeUndefined();
    vi.restoreAllMocks();
  });

  it("invalidateDetail removes a single entry", () => {
    useDataStore.getState().setDetail("42", detail);
    useDataStore.getState().setDetail("43", detail);
    useDataStore.getState().invalidateDetail("42");
    expect(useDataStore.getState().getDetail("42")).toBeNull();
    expect(useDataStore.getState().getDetail("43")).toBe(detail);
  });

  it("invalidateList bumps listVersion", () => {
    const before = useDataStore.getState().listVersion;
    useDataStore.getState().invalidateList();
    expect(useDataStore.getState().listVersion).toBeGreaterThan(before);
  });
});

describe("LoadingIndicator", () => {
  it("renders spinner variant by default with status role", () => {
    render(<LoadingIndicator />);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("renders label text when provided", () => {
    render(<LoadingIndicator label="Loading..." />);
    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("renders three dots for dots variant", () => {
    const { container } = render(<LoadingIndicator variant="dots" />);
    expect(container.querySelectorAll("span")).toHaveLength(3);
  });

  it("renders pulse variant without throwing", () => {
    render(<LoadingIndicator variant="pulse" size="lg" />);
    expect(screen.getByRole("status")).toBeTruthy();
  });
});