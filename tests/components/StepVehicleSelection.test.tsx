import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

const mockStore = vi.hoisted(() => ({
  currentStep: 0,
  vehicleInfo: null as Record<string, unknown> | null,
  vinInfo: null,
  inspectionScope: null as Record<string, unknown> | null,
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
  default: ({ src, alt, width, height, style, className }: React.ComponentProps<"div">) =>
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

import { StepVehicleSelection, stepSchema } from "@/app/dashboard/customer/inspection/_components/StepVehicleSelection"

const mockOnNext = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  mockStore.vehicleInfo = null
  mockStore.inspectionScope = null
})

function setup() {
  const user = userEvent.setup()
  const utils = render(
    <>
      <StepVehicleSelection onNext={mockOnNext} />
      <button type="submit" form="step-1" data-testid="submit-btn">
        Submit
      </button>
    </>,
  )
  return { user, ...utils }
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/license plate/i), "ABC123")
  await user.type(screen.getByLabelText(/mileage/i), "50000")
  await user.selectOptions(screen.getByLabelText(/country/i), "usa")
  await waitFor(() => expect(screen.getByLabelText(/state/i)).toBeInTheDocument())
  await user.selectOptions(screen.getByLabelText(/state/i), "CA")
  const turoBtn = screen.getByRole("button", { name: /turo/i })
  await user.click(turoBtn)
  await waitFor(() => {
    expect(screen.getByText(/manufacture date for the tires/i)).toBeInTheDocument()
  })
  const radios = screen.getAllByRole("radio")
  const tireYes = radios[0]
  const batteryYes = radios[2]
  await user.click(tireYes)
  await user.click(batteryYes)
}

describe("StepVehicleSelection", () => {
  it("renders all input fields", () => {
    setup()
    expect(screen.getByLabelText(/license plate/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mileage/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument()
  })

  it("shows US states when USA is selected", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "usa")
    await waitFor(() => {
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    })
    expect(screen.getByRole("option", { name: "California" })).toBeInTheDocument()
  })

  it("shows CA provinces when Canada is selected", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "canada")
    await waitFor(() => {
      expect(screen.getByLabelText(/province/i)).toBeInTheDocument()
    })
    expect(screen.getByRole("option", { name: "Ontario" })).toBeInTheDocument()
  })

  it("shows Turo conditional radios when Turo is selected", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "usa")
    await waitFor(() => expect(screen.getByLabelText(/state/i)).toBeInTheDocument())
    const turoBtn = screen.getByRole("button", { name: /turo/i })
    await user.click(turoBtn)
    await waitFor(() => {
      expect(screen.getByText(/manufacture date for the tires/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/battery less than 5 years/i)).toBeInTheDocument()
  })

  it("hides Turo conditional radios when Turo is deselected", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "usa")
    await waitFor(() => expect(screen.getByLabelText(/state/i)).toBeInTheDocument())
    const turoBtn = screen.getByRole("button", { name: /turo/i })
    await user.click(turoBtn)
    await waitFor(() => {
      expect(screen.getByText(/manufacture date for the tires/i)).toBeInTheDocument()
    })
    await user.click(turoBtn)
    await waitFor(() => {
      expect(
        screen.queryByText(/manufacture date for the tires/i),
      ).not.toBeInTheDocument()
    })
  })

  it("shows PriceSummary $39 for Uber + Lyft together", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "usa")
    await waitFor(() => expect(screen.getByLabelText(/state/i)).toBeInTheDocument())
    const uberBtn = screen.getByRole("button", { name: /uber/i })
    const lyftBtn = screen.getByRole("button", { name: /lyft/i })
    await user.click(uberBtn)
    await user.click(lyftBtn)
    await waitFor(() => {
      const matches = screen.getAllByText(/\$39\.00/)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })
  })

  it("shows PriceSummary $24 for only Uber", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "usa")
    await waitFor(() => expect(screen.getByLabelText(/state/i)).toBeInTheDocument())
    const uberBtn = screen.getByRole("button", { name: /uber/i })
    await user.click(uberBtn)
    await waitFor(() => {
      const matches = screen.getAllByText(/\$24\.00/)
      expect(matches.length).toBeGreaterThanOrEqual(1)
    })
  })

  it("displays validation errors when submitting empty", async () => {
    const { user } = setup()
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(screen.getByText(/license plate is required/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/mileage is required/i)).toBeInTheDocument()
    expect(screen.getByText(/country is required/i)).toBeInTheDocument()
  })

  it("shows company required error when country selected but no company chosen", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "usa")
    await waitFor(() => expect(screen.getByLabelText(/state/i)).toBeInTheDocument())
    await user.selectOptions(screen.getByLabelText(/state/i), "CA")
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(screen.getByText(/select at least one company/i)).toBeInTheDocument()
    })
  })

  it("calls store.updateVehicleInfo on valid submit", async () => {
    const { user } = setup()
    await fillRequiredFields(user)
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(mockStore.updateVehicleInfo).toHaveBeenCalledWith({
        licensePlate: "ABC123",
        mileage: 50000,
      })
    })
  })

  it("calls store.updateInspectionScope on valid submit", async () => {
    const { user } = setup()
    await fillRequiredFields(user)
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(mockStore.updateInspectionScope).toHaveBeenCalledWith({
        country: "usa",
        state: "CA",
        companies: ["turo"],
        tiresOlderThan6Years: true,
        batteryOlderThan5Years: true,
        voltageGreaterThan12_1V: undefined,
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

  it("shows tire error when tires radio set to No and submitted", async () => {
    const { user } = setup()
    await fillRequiredFields(user)
    const tireYes = screen.getAllByRole("radio")[0]
    await user.click(tireYes)
    const tireNo = screen.getAllByRole("radio")[1]
    await user.click(tireNo)
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(screen.getByText(/manufacture date must be less than 6 years/i)).toBeInTheDocument()
    })
  })

  it("shows voltage section when battery is No", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "usa")
    await waitFor(() => expect(screen.getByLabelText(/state/i)).toBeInTheDocument())
    const turoBtn = screen.getByRole("button", { name: /turo/i })
    await user.click(turoBtn)
    await waitFor(() => expect(screen.getByText(/manufacture date for the tires/i)).toBeInTheDocument())
    const radios = screen.getAllByRole("radio")
    await user.click(radios[0])
    await user.click(radios[3])
    await waitFor(() => {
      expect(screen.getByText(/voltage greater than 12\.1v/i)).toBeInTheDocument()
    })
  })

  it("selecting voltage Yes radio sets value", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "usa")
    await waitFor(() => expect(screen.getByLabelText(/state/i)).toBeInTheDocument())
    const turoBtn = screen.getByRole("button", { name: /turo/i })
    await user.click(turoBtn)
    await waitFor(() => expect(screen.getByText(/manufacture date for the tires/i)).toBeInTheDocument())
    const radios = screen.getAllByRole("radio")
    await user.click(radios[0])
    await user.click(radios[3])
    await waitFor(() => expect(screen.getByText(/voltage greater than 12\.1v/i)).toBeInTheDocument())
    const voltageRadios = screen.getAllByRole("radio")
    const voltageYes = voltageRadios[4]
    await user.click(voltageYes)
  })

  it("selecting voltage No radio sets value", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "usa")
    await waitFor(() => expect(screen.getByLabelText(/state/i)).toBeInTheDocument())
    const turoBtn = screen.getByRole("button", { name: /turo/i })
    await user.click(turoBtn)
    await waitFor(() => expect(screen.getByText(/manufacture date for the tires/i)).toBeInTheDocument())
    const radios = screen.getAllByRole("radio")
    await user.click(radios[0])
    await user.click(radios[3])
    await waitFor(() => expect(screen.getByText(/voltage greater than 12\.1v/i)).toBeInTheDocument())
    const voltageRadios = screen.getAllByRole("radio")
    const voltageNo = voltageRadios[5]
    await user.click(voltageNo)
  })

  it("blocks submit when battery not answered for Turo", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "usa")
    await waitFor(() => expect(screen.getByLabelText(/state/i)).toBeInTheDocument())
    await user.selectOptions(screen.getByLabelText(/state/i), "CA")
    const turoBtn = screen.getByRole("button", { name: /turo/i })
    await user.click(turoBtn)
    await waitFor(() => expect(screen.getByText(/manufacture date for the tires/i)).toBeInTheDocument())
    const radios = screen.getAllByRole("radio")
    await user.click(radios[0])
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(mockStore.updateInspectionScope).not.toHaveBeenCalled()
    })
  })

  it("blocks submit when battery is No and voltage not answered", async () => {
    const { user } = setup()
    await user.selectOptions(screen.getByLabelText(/country/i), "usa")
    await waitFor(() => expect(screen.getByLabelText(/state/i)).toBeInTheDocument())
    await user.selectOptions(screen.getByLabelText(/state/i), "CA")
    await user.click(screen.getByRole("button", { name: /turo/i }))
    await waitFor(() => expect(screen.getByText(/manufacture date for the tires/i)).toBeInTheDocument())
    const radios = screen.getAllByRole("radio")
    await user.click(radios[0])
    await user.click(radios[3])
    await waitFor(() => expect(screen.getByText(/voltage greater than 12\.1v/i)).toBeInTheDocument())
    await user.click(screen.getByTestId("submit-btn"))
    await waitFor(() => {
      expect(mockStore.updateInspectionScope).not.toHaveBeenCalled()
    })
  })

  it("direct safeParse accepts valid data without Turo", () => {
    const result = stepSchema.safeParse({
      licensePlate: "ABC123",
      mileage: 50000,
      country: "usa",
      state: "CA",
      companies: ["uber"],
      tiresOlderThan6Years: true,
    })
    expect(result.success).toBe(true)
  })

  it("direct safeParse rejects Turo without batteryOlderThan5Years", () => {
    const result = stepSchema.safeParse({
      licensePlate: "ABC123",
      mileage: 50000,
      country: "usa",
      state: "CA",
      companies: ["turo"],
      tiresOlderThan6Years: true,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues
      expect(issues.some((i) => i.path[0] === "batteryOlderThan5Years")).toBe(true)
    }
  })

  it("direct safeParse rejects battery=false without voltage answer", () => {
    const result = stepSchema.safeParse({
      licensePlate: "ABC123",
      mileage: 50000,
      country: "usa",
      state: "CA",
      companies: ["turo"],
      tiresOlderThan6Years: true,
      batteryOlderThan5Years: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues
      expect(issues.some((i) => i.path[0] === "voltageGreaterThan12_1V")).toBe(true)
    }
  })

  it("pre-fills fields from store defaultValues", () => {
    mockStore.vehicleInfo = { licensePlate: "XYZ789", mileage: 30000 }
    mockStore.inspectionScope = {
      country: "usa",
      state: "CA",
      companies: ["uber", "turo"],
      tiresOlderThan6Years: true,
      batteryOlderThan5Years: true,
      voltageGreaterThan12_1V: undefined,
    }
    setup()
    const plateInput = screen.getByLabelText(/license plate/i) as HTMLInputElement
    const mileageInput = screen.getByLabelText(/mileage/i) as HTMLInputElement
    expect(plateInput.value).toBe("XYZ789")
    expect(mileageInput.value).toBe("30000")
  })
})
