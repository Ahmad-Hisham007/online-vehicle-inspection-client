import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import DataTable from "@/app/components/admin/DataTable";
import type { DataTableColumn } from "@/app/components/admin/DataTable";

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

describe("DataTable", () => {
  it("renders column headers", () => {
    render(
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />,
    );
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("renders row data", () => {
    render(
      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />,
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows empty state when no rows", () => {
    render(
      <DataTable columns={columns} rows={[]} rowKey={(r) => r.id} />,
    );
    expect(screen.getByText("No items found.")).toBeInTheDocument();
  });

  it("renders search input with placeholder", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchPlaceholder="Search users..."
        searchValue=""
        onSearchChange={() => {}}
      />,
    );
    expect(screen.getByPlaceholderText("Search users...")).toBeInTheDocument();
  });

  it("calls onSearchChange when typing", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        searchValue=""
        onSearchChange={onSearchChange}
      />,
    );
    await user.type(screen.getByRole("textbox"), "A");
    expect(onSearchChange).toHaveBeenCalled();
  });

  it("renders filter options", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        filterOptions={[
          { label: "All", value: "all" },
          { label: "Active", value: "active" },
        ]}
        filterValue="all"
        onFilterChange={() => {}}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(r) => r.id}
        loading
      />,
    );
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders pagination when onPageChange is provided", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        totalItems={30}
        page={1}
        onPageChange={() => {}}
      />,
    );
    expect(screen.getByText("Showing 1–10 of 30 items")).toBeInTheDocument();
  });
});