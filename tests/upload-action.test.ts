import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const ORIGINAL_ENV = { ...process.env }

const mocks = vi.hoisted(() => ({
  mockS3Client: vi.fn(),
  mockPutObjectCommand: vi.fn(),
  mockGetSignedUrl: vi.fn(),
}))

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: mocks.mockS3Client,
  PutObjectCommand: mocks.mockPutObjectCommand,
}))

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mocks.mockGetSignedUrl,
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
  vi.stubEnv("BUNNY_STORAGE_ZONE_NAME", "ovi-media")
  vi.stubEnv("BUNNY_STORAGE_PASSWORD", "zone-password")
  vi.stubEnv("BUNNY_STORAGE_REGION", "ny")
  vi.stubEnv("BUNNY_PULL_ZONE_HOSTNAME", "rideshareinspection.b-cdn.net")
  vi.spyOn(Date, "now").mockReturnValue(1724000000000)
  mocks.mockGetSignedUrl.mockResolvedValue(
    "https://ny-s3.storage.bunnycdn.com/ovi-media/uploads/550e8400-e29b-41d4-a716-446655440000-1724000000000.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256",
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  process.env = { ...ORIGINAL_ENV }
})

describe("generateUploadUrl", () => {
  it("throws when Bunny Storage is not fully configured", async () => {
    vi.stubEnv("BUNNY_STORAGE_ZONE_NAME", "")
    vi.stubEnv("BUNNY_PULL_ZONE_HOSTNAME", "")

    await expect(generateUploadUrl("image/jpeg", 1024)).rejects.toThrow(
      "Bunny Storage is not fully configured",
    )
  })

  it("signs a PUT against the Bunny S3-compatible endpoint with path-style addressing", async () => {
    const result = await generateUploadUrl("image/jpeg", 1024)

    expect(mocks.mockS3Client).toHaveBeenCalledWith({
      region: "ny",
      endpoint: "https://ny-s3.storage.bunnycdn.com",
      forcePathStyle: true,
      credentials: {
        accessKeyId: "ovi-media",
        secretAccessKey: "zone-password",
      },
    })

    expect(mocks.mockPutObjectCommand).toHaveBeenCalledWith({
      Bucket: "ovi-media",
      Key: "uploads/550e8400-e29b-41d4-a716-446655440000-1724000000000.jpg",
      ContentType: "image/jpeg",
    })

    expect(mocks.mockGetSignedUrl).toHaveBeenCalledTimes(1)

    expect(result).toEqual({
      uploadUrl:
        "https://ny-s3.storage.bunnycdn.com/ovi-media/uploads/550e8400-e29b-41d4-a716-446655440000-1724000000000.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256",
      publicUrl:
        "https://rideshareinspection.b-cdn.net/uploads/550e8400-e29b-41d4-a716-446655440000-1724000000000.jpg",
      fileKey: "550e8400-e29b-41d4-a716-446655440000-1724000000000",
      contentType: "image/jpeg",
    })
  })

  it("maps video MIME types to a CDN-friendly extension", async () => {
    const result = await generateUploadUrl("video/quicktime", 5_000_000)

    expect(mocks.mockPutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Key: "uploads/550e8400-e29b-41d4-a716-446655440000-1724000000000.mov",
        ContentType: "video/quicktime",
      }),
    )

    expect(result.publicUrl).toContain(".mov")
  })

  it("falls back to octet-stream content type when the MIME type is empty", async () => {
    const result = await generateUploadUrl("", 1024)

    expect(mocks.mockPutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Key: "uploads/550e8400-e29b-41d4-a716-446655440000-1724000000000.bin",
        ContentType: "application/octet-stream",
      }),
    )

    expect(result.contentType).toBe("application/octet-stream")
  })
})