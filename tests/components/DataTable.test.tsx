import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import DataTable from "@/app/components/admin/DataTable";
import type { DataTableColumn } from "@/app/components/admin/DataTable";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/test",
}));

interface Row {
  id: number;
  name: string;
}

const columns: DataTableColumn<Row>[] = [
  { key: "id", header: "ID", cell: (r) => r.id },
  { key: "name", header: "Name", cell: (r) => r.name },
];

const rows: Row[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
];

const baseProps = {
  page: 1,
  totalPages: 1,
  total: rows.length,
  isLoading: false,
  startTransition: (() => {}) as React.TransitionStartFunction,
};

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} {...baseProps} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("renders row data", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} {...baseProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows empty state when no rows", () => {
    render(
      <DataTable columns={columns} rows={[]} rowKey={(r) => r.id} {...baseProps} />,
    );
    expect(screen.getByText("No items found.")).toBeInTheDocument();
  });

  it("shows a custom empty state when provided", () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(r) => r.id}
        emptyState={<div>Custom empty</div>}
        {...baseProps}
      />,
    );
    expect(screen.getByText("Custom empty")).toBeInTheDocument();
  });

  it("renders loading skeleton state", () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(r) => r.id}
        {...baseProps}
        isLoading
      />,
    );
    expect(screen.queryByText("No items found.")).not.toBeInTheDocument();
  });

  it("renders pagination when totalPages > 1", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        {...baseProps}
        totalPages={2}
        total={30}
      />,
    );
    expect(screen.getByText(/Showing 1–8 of 30 items/)).toBeInTheDocument();
  });
});
