"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/app/components/Button";
import { Separator } from "@/components/ui/separator";
import { FiPlus } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function CustomerDashboard() {
  const router = useRouter();

  return (
    <section className="bg-gray-900 h-screen flex flex-col overflow-x-hidden">
      <div className="max-w-3xl w-full mx-auto py-8 px-4 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h1 className="text-lg font-semibold text-white">
            Submitted Inspections
          </h1>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              className="!w-auto !px-4 !rounded-full !inline-flex"
              onClick={() => router.push("/dashboard/customer/inspection")}
            >
              <FiPlus className="size-4" />
              Add
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="!w-auto !px-4 !rounded-full !inline-flex"
              type="button"
            >
              Filter
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <Card size="sm" className="flex-1 flex flex-col p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-primary font-medium">
                  License Plate No.
                </p>
                <p className="text-sm font-semibold text-gray-900">—</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary font-medium">Date Created</p>
                <p className="text-sm text-gray-700">—</p>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <select className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-500">
                <option>Pending</option>
                <option>Paid</option>
                <option>Approved</option>
                <option>Rejected</option>
              </select>
              <span className="flex items-center gap-1.5 text-xs text-blue-500">
                <span className="size-2 rounded-full bg-blue-500" />
                No inspections yet
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-center text-sm text-gray-500">
                Start by adding your first inspection
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
