import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

const mockGenerateUploadUrl = vi.hoisted(() => vi.fn())
const mockUploadcareUploadFile = vi.hoisted(() => vi.fn())

vi.mock("@/app/actions/upload", () => ({
  generateUploadUrl: mockGenerateUploadUrl,
}))

vi.mock("@uploadcare/upload-client", () => ({
  uploadFile: mockUploadcareUploadFile,
}))

import { useFileUpload } from "@/app/hooks/useFileUpload"

beforeEach(() => {
  vi.clearAllMocks()
})

function makeFile(name = "test.jpg", type = "image/jpeg", size = 1024): File {
  const file = new File(["dummy"], name, { type })
  Object.defineProperty(file, "size", { value: size })
  return file
}

describe("useFileUpload", () => {
  it("uploads file via Uploadcare and resolves with CDN URL", async () => {
    mockGenerateUploadUrl.mockResolvedValue({
      uploadUrl: "uploadcare",
      publicUrl: "",
      fileKey: "uuid-123",
    })
    mockUploadcareUploadFile.mockResolvedValue({
      cdnUrl: "https://ucarecdn.com/uuid/photo.jpg",
    })

    const { result } = renderHook(() => useFileUpload())
    const url = await result.current.upload(makeFile())
    expect(url).toBe("https://ucarecdn.com/uuid/photo.jpg")
    expect(mockGenerateUploadUrl).toHaveBeenCalledWith("image/jpeg", 1024)
    expect(mockUploadcareUploadFile).toHaveBeenCalled()
  })

  it("calls onProgress during upload", async () => {
    mockGenerateUploadUrl.mockResolvedValue({
      uploadUrl: "uploadcare",
      publicUrl: "",
      fileKey: "uuid-123",
    })
    mockUploadcareUploadFile.mockImplementation(
      async (_file: File, { onProgress }: { onProgress?: (info: { isComputable: boolean; value: number }) => void }) => {
        onProgress?.({ isComputable: true, value: 0.5 })
        return { cdnUrl: "https://ucarecdn.com/uuid/photo.jpg" }
      },
    )

    const onProgress = vi.fn()
    const { result } = renderHook(() => useFileUpload())
    await result.current.upload(makeFile(), onProgress)
    expect(onProgress).toHaveBeenCalledWith(50)
  })

  it("retries on failure and succeeds on 2nd attempt", async () => {
    mockGenerateUploadUrl.mockResolvedValue({
      uploadUrl: "uploadcare",
      publicUrl: "",
      fileKey: "uuid-123",
    })
    mockUploadcareUploadFile
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ cdnUrl: "https://ucarecdn.com/uuid/photo.jpg" })

    const { result } = renderHook(() => useFileUpload())
    const url = await result.current.upload(makeFile())
    expect(url).toBe("https://ucarecdn.com/uuid/photo.jpg")
    expect(mockUploadcareUploadFile).toHaveBeenCalledTimes(2)
  })

  it("rejects after all retries fail", async () => {
    mockGenerateUploadUrl.mockResolvedValue({
      uploadUrl: "uploadcare",
      publicUrl: "",
      fileKey: "uuid-123",
    })
    mockUploadcareUploadFile.mockRejectedValue(new Error("Persistent error"))

    const { result } = renderHook(() => useFileUpload())
    await expect(result.current.upload(makeFile())).rejects.toThrow("Persistent error")
    expect(mockUploadcareUploadFile).toHaveBeenCalledTimes(4)
  })

  it("cancel aborts the upload and rejects", async () => {
    mockGenerateUploadUrl.mockResolvedValue({
      uploadUrl: "uploadcare",
      publicUrl: "",
      fileKey: "uuid-123",
    })
    mockUploadcareUploadFile.mockImplementation(
      async (_file: File, { signal }: { signal: AbortSignal }) => {
        return new Promise((_resolve, reject) => {
          const check = () => {
            if (signal.aborted) {
              reject(new Error("Upload cancelled"))
            } else {
              setTimeout(check, 5)
            }
          }
          check()
        })
      },
    )

    const { result } = renderHook(() => useFileUpload())
    const uploadPromise = result.current.upload(makeFile())

    act(() => {
      result.current.cancel()
    })

    await expect(uploadPromise).rejects.toThrow("Upload cancelled")
  })
})