import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const ORIGINAL_ENV = { ...process.env }

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
}))

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}))

const mockRandomUUID = vi.fn()
Object.defineProperty(globalThis, "crypto", {
  value: { randomUUID: mockRandomUUID },
  writable: true,
})

import { generateUploadUrl } from "@/app/actions/upload"

beforeEach(() => {
  vi.clearAllMocks()
  mockRandomUUID.mockReturnValue("550e8400-e29b-41d4-a716-446655440000")
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe("generateUploadUrl", () => {
  it("returns Uploadcare sentinel when UPLOADCARE_PUBLIC_KEY is set", async () => {
    process.env = { UPLOADCARE_PUBLIC_KEY: "demopublickey" }
    delete process.env.AWS_ACCESS_KEY_ID

    const result = await generateUploadUrl("image/jpeg", 1024)

    expect(result.uploadUrl).toBe("uploadcare")
    expect(result.publicUrl).toBe("")
    expect(result.fileKey).toContain("550e8400-e29b-41d4-a716-446655440000")
    expect(result.fileKey).toContain("-")
  })

  it("throws when no upload provider is configured", async () => {
    delete process.env.UPLOADCARE_PUBLIC_KEY
    delete process.env.AWS_ACCESS_KEY_ID

    await expect(generateUploadUrl("image/jpeg", 1024)).rejects.toThrow(
      "No upload provider configured",
    )
  })
})