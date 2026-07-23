export const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" },
];

export const CA_PROVINCES = [
  { value: "AB", label: "Alberta" }, { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" }, { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" }, { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" }, { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" }, { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" }, { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];

export const USA_COMPANIES = [
  { value: "uber", label: "Uber", ext: "png" },
  { value: "lyft", label: "Lyft", ext: "png" },
  { value: "turo", label: "Turo", ext: "jpeg" },
  { value: "getaround", label: "Getaround", ext: "jpg" },
  { value: "hopskipdrive", label: "Hop Skip Drive", ext: "png" },
  { value: "zum", label: "Zum", ext: "jpg" },
  { value: "veyo", label: "Veyo", ext: "png" },
  { value: "carepool", label: "Carepool", ext: "png" },
  { value: "everdriven", label: "Everdriven", ext: "png" },
  { value: "androit", label: "Androit", ext: "png" },
];

export const CA_COMPANIES = [
  { value: "turo", label: "Turo", ext: "jpeg" },
];

export type Country = "usa" | "canada";

export function getStates(country: Country) {
  return country === "usa" ? US_STATES : CA_PROVINCES;
}

export function getCompanies(country: Country) {
  return country === "usa" ? USA_COMPANIES : CA_COMPANIES;
}

export function calculatePrice(companies: string[]): {
  total: number;
  breakdown: { label: string; amount: number }[];
} {
  const hasUber = companies.includes("uber");
  const hasLyft = companies.includes("lyft");
  const breakdown: { label: string; amount: number }[] = [];
  let total = 0;

  const remaining = companies.filter((c) => c !== "uber" && c !== "lyft");

  if (hasUber && hasLyft) {
    breakdown.push({ label: "Uber + Lyft", amount: 39 });
    total += 39;
  } else {
    if (hasUber) {
      breakdown.push({ label: "Uber", amount: 24 });
      total += 24;
    }
    if (hasLyft) {
      breakdown.push({ label: "Lyft", amount: 24 });
      total += 24;
    }
  }

  for (const c of remaining) {
    const label = USA_COMPANIES.find((x) => x.value === c)?.label ?? c;
    breakdown.push({ label, amount: 24 });
    total += 24;
  }

  return { total, breakdown };
}
