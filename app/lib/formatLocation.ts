import { CA_PROVINCES, US_STATES } from "./constants";

export function formatLocation(
  country?: string | null,
  stateCode?: string | null,
): string {
  if (!country && !stateCode) return "N/A";

  const isUsa = country === "USA";
  const states = isUsa ? US_STATES : CA_PROVINCES;

  const fullStateName =
    states.find((s) => s.value === stateCode)?.label ?? stateCode ?? "";

  if (country && fullStateName) {
    return `${country}, ${fullStateName}`;
  }

  return country || fullStateName || "N/A";
}
