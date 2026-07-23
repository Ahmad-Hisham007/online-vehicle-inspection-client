import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { useForm } from "react-hook-form"
import React from "react"

import { ImageCheckboxGroup } from "@/app/components/ImageCheckboxGroup"

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

function Wrapper() {
  const { control } = useForm<{ companies: string[] }>({
    defaultValues: { companies: [] },
  })
  return (
    <ImageCheckboxGroup
      name="companies"
      control={control}
      options={[
        { value: "turo", label: "Turo", imgSrc: "/turo.png" },
        { value: "uber", label: "Uber", imgSrc: "/uber.png" },
      ]}
      columns={2}
    />
  )
}

describe("ImageCheckboxGroup", () => {
  it("renders company buttons", () => {
    render(<Wrapper />)
    expect(screen.getByRole("button", { name: /turo/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /uber/i })).toBeInTheDocument()
  })

  it("renders with undefined field value and falls back to empty array", () => {
    function NoDefaultWrapper() {
      const { control } = useForm<{ companies: string[] }>()
      return (
        <ImageCheckboxGroup
          name="companies"
          control={control}
          options={[
            { value: "turo", label: "Turo", imgSrc: "/turo.png" },
          ]}
        />
      )
    }
    render(<NoDefaultWrapper />)
    expect(screen.getByRole("button", { name: /turo/i })).toBeInTheDocument()
  })
})
