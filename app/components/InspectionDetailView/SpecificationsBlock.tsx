import { US_STATES, CA_PROVINCES } from "@/app/lib/constants";
import { formatInspectionDate } from "@/app/lib/format";
import type { InspectionDetail } from "@/app/lib/types";
import Link from "next/link";

interface SpecificationsBlockProps {
  inspection: InspectionDetail;
  role: string;
}

interface SpecRowProps {
  label: string;
  value: string;
  link?: string;
}

function SpecRow({ label, value, link }: SpecRowProps) {
  return (
    <div className="flex items-center justify-between rounded-0 bg-card px-4 py-2.5 shadow-[0_1px_4rem_#09a9a719,0_.25rem_2rem_#00000007] shadow-red-50">
      <span className="font-heading text-sm font-bold text-foreground">
        {label}
      </span>
      <span className="text-right text-sm font-medium text-foreground">
        {link ? (
          <Link className="underline text-primary font-semibold" href={link}>
            {value}
          </Link>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

export default function SpecificationsBlock({
  inspection,
  role,
}: SpecificationsBlockProps) {
  const { country, state } = inspection.location;
  const isUsa = country === "USA";
  const states = isUsa ? US_STATES : CA_PROVINCES;
  const stateName = states.find((s) => s.value === state)?.label ?? state;
  const countryLabel = isUsa ? "USA" : "Canada";
  const locationLabel = `${stateName} (${countryLabel})`;

  return (
    <div className="space-y-3">
      {role !== "customer" && (
        <SpecRow label="Inspection ID" value={inspection.id} />
      )}

      <SpecRow label="License plate" value={inspection.licensePlate} />
      <SpecRow label="Mileage" value={inspection.mileage} />
      <SpecRow
        label="Registration expiration"
        value={formatInspectionDate(inspection.expiryDate, 0) || "—"}
      />
      <SpecRow label="VIN" value={inspection.vin} />
      <SpecRow label="Vehicle Make" value={inspection.make} />
      <SpecRow label="Vehicle Model" value={inspection.model} />
      <SpecRow label="Vehicle Year" value={inspection.year} />
      <SpecRow label="Location" value={locationLabel} />
      <SpecRow
        label="User"
        value={
          ((inspection.author && inspection.author?.node.displayName) ||
            inspection.author?.node.name) ??
          "Undefined"
        }
        link={`/dashboard/admin/users/${
          (inspection.author && inspection.author?.node.databaseId) ?? "#"
        }`}
      />
    </div>
  );
}
