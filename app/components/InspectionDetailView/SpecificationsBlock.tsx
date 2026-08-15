import { US_STATES, CA_PROVINCES } from "@/app/lib/constants";
import type { InspectionDetail } from "@/app/lib/types";

interface SpecificationsBlockProps {
  inspection: InspectionDetail;
}

interface SpecRowProps {
  label: string;
  value: string;
}

function SpecRow({ label, value }: SpecRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
      <span className="font-heading font-bold text-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function SpecificationsBlock({ inspection }: SpecificationsBlockProps) {
  const { country, state } = inspection.location;
  const isUsa = country === "USA";
  const states = isUsa ? US_STATES : CA_PROVINCES;
  const stateName = states.find((s) => s.value === state)?.label ?? state;
  const countryLabel = isUsa ? "USA" : "Canada";
  const locationLabel = `${stateName} (${countryLabel})`;

  return (
    <div className="space-y-3">
      <SpecRow label="License plate" value={inspection.licensePlate} />
      <SpecRow label="VIN" value={inspection.vin} />
      <SpecRow label="Location" value={locationLabel} />
      <SpecRow label="Mileage" value={inspection.mileage} />
      <SpecRow
        label="Registration expiration"
        value={inspection.expiryDate || "—"}
      />
    </div>
  );
}