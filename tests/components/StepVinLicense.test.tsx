import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

const mockStore = vi.hoisted(() => ({
  currentStep: 1,
  vehicleInfo: null,
  vinInfo: null as Record<string, unknown> | null,
  inspectionScope: null,
  uploadFields: null,
  reviewAgreement: null,
  setStep: vi.fn(),
  updateVehicleInfo: vi.fn(),
  updateVinInfo: vi.fn(),
  updateInspectionScope: vi.fn(),
  updateUploadField: vi.fn(),
  updateReviewAgreement: vi.fn(),
  reset: vi.fn(),
}))

vi.mock("next/image", () => ({
  default: ({ src, alt, width, height, style, className }: any) =>
    React.createElement("div", {
      "data-src": src,
      "data-alt": alt,
      "data-width": width,
      "data-height": height,
      style,
      className,
    }),
}))

vi.mock("@/app/store/inspectionStore", () => ({
  useInspectionStore: vi.fn(() => mockStore),
}))

import { StepVinLicense } from "@/app/dashboard/customer/inspection/_components/StepVinLicense"

const mockOnNext = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockStore.vinInfo = null
})

function setup() {
  const user = userEvent.setup()
  const utils = render(
    <>
      <StepVinLicense onNext={mockOnNext} />
      <button type="submit" form="step-2" data-testid="submit-btn">
        Submit
      </button>
    </>,
  )
  return { user, ...utils }
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/vin/i), "1HGCM82633A123456")
  await user.type(screen.getByLabelText(/make/i), "Honda")
  await user.type(screen.getByLabelText(/model/i), "Accord")
  await user.selectOptions(screen.getByLabelText(/year/i), "2020")
  await user.selectOptions(screen.getByLabelText(/fuel type/i), "gasoline")
}

describe("StepVinLicense", () => {
  it("renders all input fields", () => {
    setup()
    expect(screen.getByLabelText(/vin/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/make/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fuel type/i)).toBeInTheDocument()
  })

  it("shows no error for valid VIN pattern", async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText(/vin/i), "1HGCM82633A123456")
    await fillRequiredFields(user)
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(
        screen.queryByText(/invalid vin format/i),
      ).not.toBeInTheDocument()
    })
  })

  it("shows validation error for VIN with I letter", async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText(/vin/i), "1HGCM82633AI23456")
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(screen.getByText(/invalid vin format/i)).toBeInTheDocument()
    })
  })

  it("shows validation error for VIN with O letter", async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText(/vin/i), "1HGCM82633AO23456")
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(screen.getByText(/invalid vin format/i)).toBeInTheDocument()
    })
  })

  it("shows validation error for VIN with Q letter", async () => {
    const { user } = setup()
    await user.type(screen.getByLabelText(/vin/i), "1HGCM82633AQ23456")
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(screen.getByText(/invalid vin format/i)).toBeInTheDocument()
    })
  })

  it("populates year dropdown with options from 1990 to 2026", () => {
    setup()
    const yearSelect = screen.getByLabelText(/year/i)
    const options = Array.from(yearSelect.querySelectorAll("option"))
    const yearValues = options
      .map((o) => o.value)
      .filter((v) => v !== "")
      .map(Number)
    expect(yearValues[0]).toBe(2026)
    expect(yearValues[yearValues.length - 1]).toBe(1990)
    expect(yearValues).toHaveLength(37)
  })

  it("calls store.updateVinInfo on valid submit", async () => {
    const { user } = setup()
    await fillRequiredFields(user)
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(mockStore.updateVinInfo).toHaveBeenCalledWith({
        vin: "1HGCM82633A123456",
        make: "Honda",
        model: "Accord",
        year: 2020,
        fuelType: "gasoline",
      })
    })
  })

  it("calls onNext after successful submit", async () => {
    const { user } = setup()
    await fillRequiredFields(user)
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(mockOnNext).toHaveBeenCalledOnce()
    })
  })

  it("pre-fills fields from store defaultValues", () => {
    mockStore.vinInfo = {
      vin: "1HGCM82633A123456",
      make: "Honda",
      model: "Accord",
      year: 2020,
      fuelType: "electric",
    }
    setup()
    const vinInput = screen.getByLabelText(/vin/i) as HTMLInputElement
    const makeInput = screen.getByLabelText(/make/i) as HTMLInputElement
    const modelInput = screen.getByLabelText(/model/i) as HTMLInputElement
    expect(vinInput.value).toBe("1HGCM82633A123456")
    expect(makeInput.value).toBe("Honda")
    expect(modelInput.value).toBe("Accord")
  })

  it("pre-fills year and fuelType from store", () => {
    mockStore.vinInfo = {
      vin: "1HGCM82633A123456",
      make: "Honda",
      model: "Accord",
      year: 2020,
      fuelType: "electric",
    }
    setup()
    const yearSelect = screen.getByLabelText(/year/i) as HTMLSelectElement
    const fuelSelect = screen.getByLabelText(/fuel type/i) as HTMLSelectElement
    expect(yearSelect.value).toBe("2020")
    expect(fuelSelect.value).toBe("electric")
  })
})
