import Image from "next/image";
import { cn } from "@/lib/utils";
import { USA_COMPANIES, CA_COMPANIES } from "@/app/lib/constants";
import type { InspectionDetail } from "@/app/lib/types";

interface SelectedCompaniesProps {
  companies: InspectionDetail["companies"];
}

const ALL_COMPANIES = [...USA_COMPANIES, ...CA_COMPANIES];

export default function SelectedCompanies({ companies }: SelectedCompaniesProps) {
  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-bold text-foreground">Selected companies</p>
      <div className="grid grid-cols-2 gap-3">
        {companies.map((value) => {
          const company = ALL_COMPANIES.find((c) => c.value === value);
          if (!company) {
            return (
              <div
                key={value}
                className="flex items-center justify-center rounded-lg bg-muted p-3 text-sm capitalize text-muted-foreground"
              >
                {value}
              </div>
            );
          }
          return (
            <div
              key={value}
              className={cn(
                "flex items-center justify-center rounded-lg bg-muted p-3",
              )}
            >
              <Image
                src={`/company-logos/${company.value}.${company.ext}`}
                alt={company.label}
                width={120}
                height={48}
                style={{ width: "auto", height: "auto" }}
                className="max-h-12"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}