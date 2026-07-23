import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { useForm } from "react-hook-form"
import React from "react"

import { FormSelect } from "@/app/components/FormSelect"

function Wrapper({ placeholder }: { placeholder?: string }) {
  const { control } = useForm<{ test: string }>({
    defaultValues: { test: "" },
  })
  return (
    <FormSelect
      name="test"
      control={control}
      label="Test Field"
      options={[
        { value: "a", label: "Option A" },
        { value: "b", label: "Option B" },
      ]}
      placeholder={placeholder}
    />
  )
}

describe("FormSelect", () => {
  it("renders with provided placeholder", () => {
    render(<Wrapper placeholder="Pick one" />)
    const option = screen.getByRole("option", { name: "Pick one" })
    expect(option).toBeInTheDocument()
    expect(option).toBeDisabled()
  })

  it("renders default 'Select...' when no placeholder given", () => {
    render(<Wrapper />)
    const option = screen.getByRole("option", { name: "Select..." })
    expect(option).toBeInTheDocument()
    expect(option).toBeDisabled()
  })
})
