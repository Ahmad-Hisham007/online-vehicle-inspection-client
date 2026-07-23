import { describe, it, expect } from "vitest"

describe("barrel exports", () => {
  it("re-exports all schemas from @/app/lib/schemas", async () => {
    const schemas = await import("@/app/lib/schemas")
    expect(schemas.vehicleInfoSchema).toBeDefined()
    expect(schemas.vinInfoSchema).toBeDefined()
    expect(schemas.inspectionScopeSchema).toBeDefined()
    expect(schemas.uploadFieldsSchema).toBeDefined()
    expect(schemas.reviewAgreementSchema).toBeDefined()
  })
})
