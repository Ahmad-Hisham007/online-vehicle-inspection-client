import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

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

const mockUpload = vi.fn().mockResolvedValue("https://ucarecdn.com/uuid/photo.jpg")
const mockCancel = vi.fn()

vi.mock("@/app/hooks/useFileUpload", () => ({
  useFileUpload: () => ({
    upload: mockUpload,
    cancel: mockCancel,
  }),
}))

import { FileUploadField } from "@/app/components/FileUploadField"

const mockOnChange = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

function setup(props: Record<string, unknown> = {}) {
  const user = userEvent.setup()
  const utils = render(
    <FileUploadField
      label="Registration card Photo"
      onChange={mockOnChange}
      {...props}
    />,
  )
  return { user, ...utils }
}

describe("FileUploadField", () => {
  it("renders with label and upload prompt", () => {
    setup()
    expect(screen.getByText(/registration card/i)).toBeInTheDocument()
    expect(screen.getByText(/upload image/i)).toBeInTheDocument()
  })

  it("clicks upload area triggers handleClick and file input", async () => {
    const { user, container } = setup()
    const input = container.querySelector('input[type="file"]')!
    const clickSpy = vi.spyOn(input, "click")
    const uploadArea = screen.getByText(/upload image/i).closest('[class*="cursor-pointer"]')!
    await user.click(uploadArea)
    expect(clickSpy).toHaveBeenCalled()
  })

  it("calls onChange with uploading status on file selection", async () => {
    const { user, container } = setup()
    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" })
    Object.defineProperty(file, "size", { value: 1024 })
    const input = container.querySelector('input[type="file"]')!
    await user.upload(input, file)
    expect(mockOnChange).toHaveBeenCalledWith({
      name: "photo.jpg",
      size: 1024,
      status: "uploading",
      progress: 0,
    })
  })

  it("calls upload from hook on file selection", async () => {
    const { user, container } = setup()
    const file = new File(["dummy"], "photo.jpg", { type: "image/jpeg" })
    Object.defineProperty(file, "size", { value: 1024 })
    const input = container.querySelector('input[type="file"]')!
    await user.upload(input, file)
    expect(mockUpload).toHaveBeenCalledWith(file, expect.any(Function))
  })

  it("renders uploading state with percentage and progress", () => {
    const { container } = setup({
      value: { name: "photo.jpg", status: "uploading", progress: 60 },
    })
    expect(screen.getByText(/60%/i)).toBeInTheDocument()
    const progressBar = container.querySelector('[style*="60%"]')
    expect(progressBar).toBeInTheDocument()
  })

  it("renders done state with filename and Change button", () => {
    const { container } = setup({
      value: { name: "photo.jpg", status: "done", progress: 100 },
    })
    const filenames = screen.getAllByText("photo.jpg")
    expect(filenames.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/change/i)).toBeInTheDocument()
    const tickIcon = container.querySelector("svg")
    expect(tickIcon).toBeInTheDocument()
  })

  it("renders done state with icon and Uploaded text instead of Image", () => {
    setup({
      value: {
        name: "photo.jpg",
        status: "done",
        progress: 100,
        publicUrl: "https://ucarecdn.com/uuid/photo.jpg",
      },
    })
    expect(screen.getByText(/uploaded/i)).toBeInTheDocument()
    expect(screen.getByText(/change/i)).toBeInTheDocument()
  })

  it("renders error state with Retry and Choose different file", () => {
    setup({
      value: { name: "photo.jpg", status: "error" },
    })
    expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
    expect(screen.getByText(/retry/i)).toBeInTheDocument()
    expect(screen.getByText(/choose different file/i)).toBeInTheDocument()
  })

  it("error state retry opens file picker when no file was previously selected", async () => {
    const { user, container } = setup({
      value: { name: "photo.jpg", status: "error" },
    })
    const input = container.querySelector('input[type="file"]')!
    const clickSpy = vi.spyOn(input, "click")
    const retry = screen.getByText(/retry/i)
    await user.click(retry)
    expect(clickSpy).toHaveBeenCalled()
  })

  it("done state shows Uploaded with tick icon", () => {
    const { container } = setup({
      value: { name: "photo.jpg", status: "done", progress: 100 },
    })
    const svg = container.querySelector("svg")
    expect(svg).toBeInTheDocument()
  })

  it("triggers upload again when Change is clicked in done state", async () => {
    const { user, container } = setup({
      value: { name: "photo.jpg", status: "done", progress: 100 },
    })
    const changeBtn = screen.getByText(/change/i)
    const file = new File(["dummy2"], "new.jpg", { type: "image/jpeg" })
    const input = container.querySelector('input[type="file"]')!
    await user.click(changeBtn)
    await user.upload(input, file)
    expect(mockUpload).toHaveBeenCalledWith(file, expect.any(Function))
  })

  it("applies SectionHeader styling with Photo/Video split", () => {
    const { rerender } = render(
      <FileUploadField
        label="Odometer Video"
        onChange={mockOnChange}
      />,
    )
    const spans = screen.getByText(/odometer/i).querySelectorAll("span")
    expect(spans.length).toBeGreaterThan(0)
  })

  it("returns early when file input change fires with no file", () => {
    const { container } = setup()
    const input = container.querySelector('input[type="file"]')!
    fireEvent.change(input, { target: { files: [] } })
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it("shows Uploading... text in uploading state when name is missing", () => {
    setup({ value: { status: "uploading" } })
    expect(screen.getByText("Uploading...")).toBeInTheDocument()
  })

  it("shows zero-width progress bar when progress is missing in uploading state", () => {
    const { container } = setup({
      value: { name: "photo.jpg", status: "uploading" },
    })
    const progressBar = container.querySelector('[style*="width: 0%"]')
    expect(progressBar).toBeInTheDocument()
  })

  it("uploading state has no file input", () => {
    const { container } = setup({
      value: { name: "photo.jpg", status: "uploading", progress: 60 },
    })
    expect(container.querySelector('input[type="file"]')).toBeNull()
  })

  it("uploading state shows Cancel button", () => {
    setup({
      value: { name: "photo.jpg", status: "uploading", progress: 50 },
    })
    expect(screen.getByText(/cancel/i)).toBeInTheDocument()
  })

  it("Cancel button calls cancel from hook", async () => {
    const { user } = setup({
      value: { name: "photo.jpg", status: "uploading", progress: 50 },
    })
    await user.click(screen.getByText(/cancel/i))
    expect(mockCancel).toHaveBeenCalled()
  })

  it("shows video prompt when accept includes video", () => {
    setup({ accept: "video/*" })
    expect(screen.getByText(/upload video/i)).toBeInTheDocument()
  })
})
