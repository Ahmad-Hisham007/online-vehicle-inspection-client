import { describe, it, expect } from "vitest"
import {
  vehicleInfoSchema,
  vinInfoSchema,
  inspectionScopeSchema,
  uploadFieldsSchema,
  reviewAgreementSchema,
} from "@/app/lib/schemas"

describe("vehicleInfoSchema", () => {
  it("accepts valid data", () => {
    const result = vehicleInfoSchema.safeParse({
      licensePlate: "ABC123",
      mileage: 50000,
    })
    expect(result.success).toBe(true)
  })

  it("rejects license plate with more than 10 characters", () => {
    const result = vehicleInfoSchema.safeParse({
      licensePlate: "TOOLONGPLATE123",
      mileage: 50000,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative mileage", () => {
    const result = vehicleInfoSchema.safeParse({
      licensePlate: "ABC123",
      mileage: -1,
    })
    expect(result.success).toBe(false)
  })
})

describe("vinInfoSchema", () => {
  const validInput = {
    vin: "1HGCM82633A123456",
    make: "Honda",
    model: "Accord",
    year: 2020,
    fuelType: "gasoline",
  } as const

  it("accepts valid data", () => {
    const result = vinInfoSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it("rejects VIN with excluded letter (I)", () => {
    const result = vinInfoSchema.safeParse({
      ...validInput,
      vin: "1HGCM82633AI23456",
    })
    expect(result.success).toBe(false)
  })

  it("rejects VIN with excluded letter (O)", () => {
    const result = vinInfoSchema.safeParse({
      ...validInput,
      vin: "1HGCM82633AO23456",
    })
    expect(result.success).toBe(false)
  })

  it("rejects VIN with excluded letter (Q)", () => {
    const result = vinInfoSchema.safeParse({
      ...validInput,
      vin: "1HGCM82633AQ23456",
    })
    expect(result.success).toBe(false)
  })

  it("rejects year before 1900", () => {
    const result = vinInfoSchema.safeParse({
      ...validInput,
      year: 1800,
    })
    expect(result.success).toBe(false)
  })
})

describe("inspectionScopeSchema", () => {
  it("accepts valid USA data", () => {
    const result = inspectionScopeSchema.safeParse({
      country: "usa",
      state: "CA",
      companies: ["uber"],
      tiresOlderThan6Years: true,
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid Canada data", () => {
    const result = inspectionScopeSchema.safeParse({
      country: "canada",
      state: "ON",
      companies: ["turo"],
      tiresOlderThan6Years: true,
      batteryOlderThan5Years: true,
    })
    expect(result.success).toBe(true)
  })

  it("rejects USA country with Canadian province", () => {
    const result = inspectionScopeSchema.safeParse({
      country: "usa",
      state: "ON",
      companies: ["uber"],
      tiresOlderThan6Years: true,
    })
    expect(result.success).toBe(false)
  })

  it("rejects USA with garbage state code", () => {
    const result = inspectionScopeSchema.safeParse({
      country: "usa",
      state: "XX",
      companies: ["uber"],
      tiresOlderThan6Years: true,
    })
    expect(result.success).toBe(false)
  })

  it("rejects Canada with garbage province code", () => {
    const result = inspectionScopeSchema.safeParse({
      country: "canada",
      state: "ZZ",
      companies: ["turo"],
      tiresOlderThan6Years: true,
      batteryOlderThan5Years: true,
    })
    expect(result.success).toBe(false)
  })

  it("rejects USA with invalid company", () => {
    const result = inspectionScopeSchema.safeParse({
      country: "usa",
      state: "CA",
      companies: ["invalid-co"],
      tiresOlderThan6Years: true,
    })
    expect(result.success).toBe(false)
  })

  it("rejects tiresOlderThan6Years when false", () => {
    const result = inspectionScopeSchema.safeParse({
      country: "usa",
      state: "CA",
      companies: ["uber"],
      tiresOlderThan6Years: false,
    })
    expect(result.success).toBe(false)
  })

  it("rejects Turo selected without batteryOlderThan5Years", () => {
    const result = inspectionScopeSchema.safeParse({
      country: "usa",
      state: "CA",
      companies: ["turo"],
      tiresOlderThan6Years: true,
    })
    expect(result.success).toBe(false)
  })

  it("rejects batteryOlderThan5Years=false without voltageGreaterThan12_1V", () => {
    const result = inspectionScopeSchema.safeParse({
      country: "usa",
      state: "CA",
      companies: ["turo"],
      tiresOlderThan6Years: true,
      batteryOlderThan5Years: false,
    })
    expect(result.success).toBe(false)
  })

  it("accepts Turo with batteryOlderThan5Years=false and voltageGreaterThan12_1V=true", () => {
    const result = inspectionScopeSchema.safeParse({
      country: "usa",
      state: "CA",
      companies: ["turo"],
      tiresOlderThan6Years: true,
      batteryOlderThan5Years: false,
      voltageGreaterThan12_1V: true,
    })
    expect(result.success).toBe(true)
  })
})

describe("uploadFieldsSchema", () => {
  it("accepts empty object (all fields optional)", () => {
    const result = uploadFieldsSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts valid file metadata", () => {
    const result = uploadFieldsSchema.safeParse({
      registrationCardPhoto: {
        name: "photo.jpg",
        status: "done",
        progress: 100,
      },
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid status", () => {
    const result = uploadFieldsSchema.safeParse({
      registrationCardPhoto: {
        name: "photo.jpg",
        status: "invalid",
        progress: 50,
      },
    })
    expect(result.success).toBe(false)
  })
})

describe("reviewAgreementSchema", () => {
  it("accepts both agreements checked", () => {
    const result = reviewAgreementSchema.safeParse({
      userAgreement: true,
      inspectionAgreement: true,
    })
    expect(result.success).toBe(true)
  })

  it("rejects userAgreement false", () => {
    const result = reviewAgreementSchema.safeParse({
      userAgreement: false,
      inspectionAgreement: true,
    })
    expect(result.success).toBe(false)
  })

  it("rejects inspectionAgreement false", () => {
    const result = reviewAgreementSchema.safeParse({
      userAgreement: true,
      inspectionAgreement: false,
    })
    expect(result.success).toBe(false)
  })
})
