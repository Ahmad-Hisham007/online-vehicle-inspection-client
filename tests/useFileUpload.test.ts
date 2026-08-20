import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

const mockGenerateUploadUrl = vi.hoisted(() => vi.fn())

vi.mock("@/app/actions/upload", () => ({
  generateUploadUrl: mockGenerateUploadUrl,
}))

class MockXHR {
  static instances: MockXHR[] = []

  upload = {
    onprogress: null as null | ((e: { lengthComputable: boolean; loaded: number; total: number }) => void),
  }
  onload: null | (() => void) = null
  onerror: null | (() => void) = null
  onabort: null | (() => void) = null
  status = 200
  method = ""
  url = ""
  headers: Record<string, string> = {}
  sentBody: unknown = null

  open(method: string, url: string) {
    this.method = method
    this.url = url
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value
  }

  send(body: unknown) {
    this.sentBody = body
    MockXHR.instances.push(this)
  }

  abort() {
    this.onabort?.()
  }
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function lastInstance(): MockXHR {
  const instance = MockXHR.instances[MockXHR.instances.length - 1]
  if (!instance) throw new Error("No XHR instance created")
  return instance
}

function makeFile(name = "test.jpg", type = "image/jpeg", size = 1024): File {
  const file = new File(["dummy"], name, { type })
  Object.defineProperty(file, "size", { value: size })
  return file
}

const BUNNY_RESPONSE = {
  uploadUrl:
    "https://ny-s3.storage.bunnycdn.com/ovi-media/uploads/uuid.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256",
  publicUrl: "https://rideshareinspection.b-cdn.net/uploads/uuid.jpg",
  fileKey: "uuid",
  contentType: "image/jpeg",
}

import { useFileUpload } from "@/app/hooks/useFileUpload"

beforeEach(() => {
  vi.clearAllMocks()
  MockXHR.instances = []
  vi.stubGlobal("XMLHttpRequest", MockXHR)
  mockGenerateUploadUrl.mockResolvedValue(BUNNY_RESPONSE)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useFileUpload", () => {
  it("uploads via presigned PUT, sends the signed content-type, and resolves with the public URL", async () => {
    const { result } = renderHook(() => useFileUpload())
    const onProgress = vi.fn()

    const promise = result.current.upload(makeFile(), onProgress)
    await flush()

    const xhr = lastInstance()
    expect(mockGenerateUploadUrl).toHaveBeenCalledWith("image/jpeg", 1024)
    expect(xhr.method).toBe("PUT")
    expect(xhr.url).toBe(BUNNY_RESPONSE.uploadUrl)
    expect(xhr.headers["Content-Type"]).toBe("image/jpeg")
    expect(xhr.sentBody).toBeInstanceOf(File)

    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 })
    expect(onProgress).toHaveBeenCalledWith(50)

    xhr.status = 200
    xhr.onload?.()

    await expect(promise).resolves.toBe(BUNNY_RESPONSE.publicUrl)
  })

  it("rejects when the upload returns a non-2xx status", async () => {
    const { result } = renderHook(() => useFileUpload({ maxRetries: 0 }))

    const promise = result.current.upload(makeFile())
    await flush()

    const xhr = lastInstance()
    xhr.status = 403
    xhr.onload?.()

    await expect(promise).rejects.toThrow("Upload failed with status 403")
  })

  it("rejects on network error", async () => {
    const { result } = renderHook(() => useFileUpload({ maxRetries: 0 }))

    const promise = result.current.upload(makeFile())
    await flush()

    lastInstance().onerror?.()

    await expect(promise).rejects.toThrow("Network error during upload")
  })

  it("retries on failure and succeeds on the 2nd attempt", async () => {
    const { result } = renderHook(() => useFileUpload())

    const promise = result.current.upload(makeFile())
    await flush()

    const first = lastInstance()
    first.status = 500
    first.onload?.()
    await flush()

    const second = lastInstance()
    expect(second).not.toBe(first)
    second.status = 200
    second.onload?.()

    await expect(promise).resolves.toBe(BUNNY_RESPONSE.publicUrl)
    expect(mockGenerateUploadUrl).toHaveBeenCalledTimes(2)
  })

  it("rejects after all retries are exhausted", async () => {
    const { result } = renderHook(() => useFileUpload())

    const promise = result.current.upload(makeFile())

    for (let attempt = 0; attempt < 4; attempt++) {
      await flush()
      const xhr = lastInstance()
      xhr.status = 500
      xhr.onload?.()
    }

    await expect(promise).rejects.toThrow("Upload failed with status 500")
    expect(mockGenerateUploadUrl).toHaveBeenCalledTimes(4)
  })

  it("cancel aborts the in-flight upload and rejects", async () => {
    const { result } = renderHook(() => useFileUpload())

    const promise = result.current.upload(makeFile())
    await flush()

    const abortSpy = vi.spyOn(lastInstance(), "abort")

    act(() => {
      result.current.cancel()
    })

    expect(abortSpy).toHaveBeenCalled()
    await expect(promise).rejects.toThrow("Upload cancelled")
  })
})