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
 * Keys are lowercased: `company_country_state`
 *
 * State values:
 * - For USA: two-letter state code (CA, AL, IL, NV, SC, NC)
 * - For Turo all-states: "all"
 * - For Chicago: "il_chicago" (state_city)
 *
 * The blanket keys like `turo_usa_all` cover all states for that company,
 * while specific entries handle state/country variations.
 *
 * TODO: Add more specific state templates as they land in pdf-assets.
 * For now, the resolver throws PdfTemplateMissingError for uncovered
 * combinations (users add templates on demand, per decision).
 */
export const TEMPLATE_COVERAGE: Record<string, () => Promise<TemplateMapper>> = {
  // Lyft coverage
  "lyft_usa_ca": () => import("./templates/lyft/california").then((m) => m.lyft_ca),
  "lyft_usa_al": () => import("./templates/lyft/alabama").then((m) => m.lyft_al),
  "lyft_usa_il_chicago": () => import("./templates/lyft/illinois").then((m) => m.lyft_il_chicago),
  "lyft_usa_nv": () => import("./templates/lyft/nevada").then((m) => m.lyft_nv),
  "lyft_usa_sc": () => import("./templates/lyft/south-carolina").then((m) => m.lyft_sc),

  // Uber coverage
  "uber_usa_ca": () => import("./templates/uber/california").then((m) => m.uber_ca),
  "uber_usa_nc_sc": () => import("./templates/uber/north-carolina").then((m) => m.uber_nc_sc),

  // Turo coverage - all states (key is "usa_all" to match Turo's all-USA template)
  "turo_usa_all": () => import("./templates/turo/all-usa").then((m) => m.turo_all_usa),
};

/**
 * Resolve the template mapper for the given company, country, and state.
 * Normalizes inputs to lowercase and constructs the registry key.
 * Throws PdfTemplateMissingError if no template exists.
 *
 * @returns The TemplateMapper for the given combination, or throws PdfTemplateMissingError
 */
export async function getTemplateMapper(input: {
  company: string;
  country: string;
  state: string;
}): Promise<TemplateMapper> {
  // Normalize key: lowercase, USA -> usa, and handle Turo's all-states special case
  const companyLower = input.company.toLowerCase();
  const countryLower = input.country.toLowerCase();
  const stateNormalized = input.state.toLowerCase();

  // For Turo, if they want "all states" coverage, use the all-states template
  let key: string;
  if (companyLower === "turo") {
    // Turo has a blanket "all states" template
    key = "turo_usa_all";
  } else {
    key = `${companyLower}_${countryLower}_${stateNormalized}`;
  }

  const loader = TEMPLATE_COVERAGE[key];
  if (!loader) {
    throw new PdfTemplateMissingError(input.company, input.country, input.state);
  }

  return loader();
}

/**
 * Synchronous check if a template exists for the given company/country/state combination.
 * Used to gate the Generate button in the approval UI.
 */
export function hasTemplateMapper(input: {
  company: string;
  country: string;
  state: string;
}): boolean {
  const companyLower = input.company.toLowerCase();
  const countryLower = input.country.toLowerCase();
  const stateNormalized = input.state.toLowerCase();

  // For Turo, any state maps to "all" template
  if (companyLower === "turo") {
    return "turo_usa_all" in TEMPLATE_COVERAGE;
  }

  const key = `${companyLower}_${countryLower}_${stateNormalized}`;
  return key in TEMPLATE_COVERAGE;
}