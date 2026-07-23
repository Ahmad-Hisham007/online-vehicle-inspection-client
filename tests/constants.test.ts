  import { describe, it, expect } from "vitest"
import { calculatePrice, getStates, getCompanies } from "@/app/lib/constants"
import { US_STATES, CA_PROVINCES, USA_COMPANIES, CA_COMPANIES } from "@/app/lib/constants"

describe("calculatePrice", () => {
  it("['uber', 'lyft'] → total $39, combined breakdown", () => {
    const result = calculatePrice(["uber", "lyft"])
    expect(result).toEqual({
      total: 39,
      breakdown: [{ label: "Uber + Lyft", amount: 39 }],
    })
  })

  it("['uber'] → total $24", () => {
    const result = calculatePrice(["uber"])
    expect(result).toEqual({
      total: 24,
      breakdown: [{ label: "Uber", amount: 24 }],
    })
  })

  it("['lyft'] → total $24", () => {
    const result = calculatePrice(["lyft"])
    expect(result).toEqual({
      total: 24,
      breakdown: [{ label: "Lyft", amount: 24 }],
    })
  })

  it("['turo'] → total $24", () => {
    const result = calculatePrice(["turo"])
    expect(result).toEqual({
      total: 24,
      breakdown: [{ label: "Turo", amount: 24 }],
    })
  })

  it("['uber', 'turo'] → total $48 (uber + other)", () => {
    const result = calculatePrice(["uber", "turo"])
    expect(result).toEqual({
      total: 48,
      breakdown: [
        { label: "Uber", amount: 24 },
        { label: "Turo", amount: 24 },
      ],
    })
  })

  it("['lyft', 'turo'] → total $48 (lyft + other)", () => {
    const result = calculatePrice(["lyft", "turo"])
    expect(result).toEqual({
      total: 48,
      breakdown: [
        { label: "Lyft", amount: 24 },
        { label: "Turo", amount: 24 },
      ],
    })
  })

  it("['uber', 'lyft', 'turo'] → total $63", () => {
    const result = calculatePrice(["uber", "lyft", "turo"])
    expect(result).toEqual({
      total: 63,
      breakdown: [
        { label: "Uber + Lyft", amount: 39 },
        { label: "Turo", amount: 24 },
      ],
    })
  })

  it("['getaround', 'hopskipdrive'] → total $48", () => {
    const result = calculatePrice(["getaround", "hopskipdrive"])
    expect(result).toEqual({
      total: 48,
      breakdown: [
        { label: "Getaround", amount: 24 },
        { label: "Hop Skip Drive", amount: 24 },
      ],
    })
  })

  it("['unknown-co'] → uses raw value as label (fallback branch)", () => {
    const result = calculatePrice(["unknown-co"])
    expect(result).toEqual({
      total: 24,
      breakdown: [{ label: "unknown-co", amount: 24 }],
    })
  })

  it("[] → total $0, empty breakdown", () => {
    const result = calculatePrice([])
    expect(result).toEqual({
      total: 0,
      breakdown: [],
    })
  })
})

describe("getStates", () => {
  it("returns US_STATES for 'usa'", () => {
    expect(getStates("usa")).toBe(US_STATES)
  })

  it("returns CA_PROVINCES for 'canada'", () => {
    expect(getStates("canada")).toBe(CA_PROVINCES)
  })
})

describe("getCompanies", () => {
  it("returns USA_COMPANIES for 'usa'", () => {
    expect(getCompanies("usa")).toBe(USA_COMPANIES)
  })

  it("returns CA_COMPANIES for 'canada'", () => {
    expect(getCompanies("canada")).toBe(CA_COMPANIES)
  })
})
