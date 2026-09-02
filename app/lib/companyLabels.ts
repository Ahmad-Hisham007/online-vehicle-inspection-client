import { USA_COMPANIES, CA_COMPANIES } from "./constants";

const ALL_COMPANIES = [...USA_COMPANIES, ...CA_COMPANIES];

export const COMPANY_LABELS: Record<string, string> = ALL_COMPANIES.reduce(
  (acc, company) => {
    acc[company.value] = company.label;
    return acc;
  },
  {} as Record<string, string>,
);
