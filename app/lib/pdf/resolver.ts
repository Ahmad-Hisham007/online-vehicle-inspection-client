import type { TemplateMapper } from "./types";

/**
 * Error thrown when no template exists for the requested company/country/state.
 */
export class PdfTemplateMissingError extends Error {
  readonly company: string;
  readonly country: string;
  readonly state: string;

  constructor(company: string, country: string, state: string) {
    super(
      `No PDF template for '${company}' in ${country}/${state}. ` +
        `Available templates cover Lyft CA, AL, IL-Chicago, NV, SC; Uber CA, NC+SC; Turo USA-all.`,
    );
    this.name = "PdfTemplateMissingError";
    this.company = company;
    this.country = country;
    this.state = state;
  }
}

/**
 * Coverage map from (company, country, state) → template key.
 *
 * Keys follow the naming convention `(company)_(country-short)_(region)`:
 * `lyft_us_il`, `uber_us_ca`, `turo_us_all` …
 *
 * State values:
 * - For USA: two-letter state code (CA, AL, IL, NV, SC, NC)
 * - For Turo all-states: "all"
 * - For Chicago: "il_chicago" (state_city)
 *
 * The blanket keys like `turo_us_all` cover all states for that company,
 * while specific entries handle state/country variations.
 *
 * TODO: Add more specific state templates as coordinates land in pdf-assets.
 * For now, the resolver throws PdfTemplateMissingError for uncovered
 * combinations (the approval UI lets admins skip those forms).
 */
export const TEMPLATE_COVERAGE: Record<string, () => Promise<TemplateMapper>> = {
  // Lyft coverage
  "lyft_us_ca": () => import("./templates/lyft/california").then((m) => m.lyft_ca),
  "lyft_us_al": () => import("./templates/lyft/alabama").then((m) => m.lyft_al),
  "lyft_us_il": () => import("./templates/lyft/illinois").then((m) => m.lyft_il),
  "lyft_us_nv": () => import("./templates/lyft/nevada").then((m) => m.lyft_nv),
  "lyft_us_sc": () => import("./templates/lyft/south-carolina").then((m) => m.lyft_sc),

  // Uber coverage
  "uber_us_ca": () => import("./templates/uber/california").then((m) => m.uber_ca),
  "uber_us_nc_sc": () => import("./templates/uber/north-carolina").then((m) => m.uber_nc_sc),

  // Turo coverage - all states (key is "us_all" to match Turo's all-USA template)
  "turo_us_all": () => import("./templates/turo/all-usa").then((m) => m.turo_all_usa),
};

/**
 * Normalize a raw template key segment set into the canonical registry key.
 * - Lowercases company/country/state.
 * - Maps the legacy `usa` country form to the canonical `us` short form.
 * - Turo always maps to the blanket "all" region template.
 */
export function templateRegistryKey(
  company: string,
  country: string,
  state: string,
): string {
  const companyLower = company.toLowerCase();
  const countryLower = country.toLowerCase() === "usa" ? "us" : country.toLowerCase();
  const stateNormalized = state.toLowerCase();

  // For Turo, any state maps to the all-states template
  if (companyLower === "turo") {
    return "turo_us_all";
  }

  return `${companyLower}_${countryLower}_${stateNormalized}`;
}

/**
 * Resolve the template mapper for the given company, country, and state.
 * Normalizes inputs to lowercase (legacy `usa` → `us`) and constructs the registry key.
 * Throws PdfTemplateMissingError if no template exists.
 *
 * @returns The TemplateMapper for the given combination, or throws PdfTemplateMissingError
 */
export async function getTemplateMapper(input: {
  company: string;
  country: string;
  state: string;
}): Promise<TemplateMapper> {
  const key = templateRegistryKey(input.company, input.country, input.state);

  const loader = TEMPLATE_COVERAGE[key];
  if (!loader) {
    throw new PdfTemplateMissingError(input.company, input.country, input.state);
  }

  return loader();
}

/**
 * Synchronous check if a template exists for the given company/country/state combination.
 * Used to gate the Generate button in the approval UI (missing templates → skip flow).
 */
export function hasTemplateMapper(input: {
  company: string;
  country: string;
  state: string;
}): boolean {
  return templateRegistryKey(
    input.company,
    input.country,
    input.state,
  ) in TEMPLATE_COVERAGE;
}
