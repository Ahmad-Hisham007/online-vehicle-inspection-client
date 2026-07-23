"use client";
import { calculatePrice } from "@/app/lib/constants";
import { Separator } from "@/components/ui/separator";

interface PriceSummaryProps {
  companies: string[];
}

export function PriceSummary({ companies }: PriceSummaryProps) {
  if (companies.length === 0) return null;

  const { total, breakdown } = calculatePrice(companies);

  return (
    <div className="bg-gray-50/80 rounded-2xl p-4 ring-1 ring-inset ring-gray-100 mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        Price Summary
      </h4>
      <div className="space-y-2">
        {breakdown.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-600">{item.label}</span>
            <span className="text-gray-900 font-medium tabular-nums">
              ${item.amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <Separator className="my-3" />
      <div className="flex items-center justify-between text-base">
        <span className="font-semibold text-gray-900">Total</span>
        <span className="font-bold text-gray-900 tabular-nums">
          ${total.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
