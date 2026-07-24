import { z } from "zod";

const usaStates = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

const canadaProvinces = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
] as const;

const usaCompanies = [
  "uber", "lyft", "turo", "getaround", "hopskipdrive",
  "zum", "veyo", "carepool", "everdriven", "androit",
] as const;

const canadaCompanies = ["turo"] as const;

export const inspectionScopeSchema = z
  .object({
    country: z.enum(["usa", "canada"], { message: "Country is required" }),
    state: z.string().min(2, "State/Province is required"),
    companies: z
      .array(z.string())
      .min(1, "Select at least one company"),
    tiresOlderThan6Years: z.boolean().optional(),
    batteryOlderThan5Years: z.boolean().optional(),
    voltageGreaterThan12_1V: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.country === "usa") {
      if (!usaStates.includes(data.state as typeof usaStates[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a valid US state",
          path: ["state"],
        });
      }
    } else {
      if (!canadaProvinces.includes(data.state as typeof canadaProvinces[number])) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a valid Canadian province",
          path: ["state"],
        });
      }
    }

    const validCompanies = data.country === "usa" ? usaCompanies : canadaCompanies;
    const validSet = new Set<string>(validCompanies);
    const invalid = data.companies.filter((c) => !validSet.has(c));
    if (invalid.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid company for ${data.country}: ${invalid.join(", ")}`,
        path: ["companies"],
      });
    }

    if (data.companies.includes("turo")) {
      if (data.tiresOlderThan6Years !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Manufacture date must be less than 6 years to proceed",
          path: ["tiresOlderThan6Years"],
        });
      }
      if (data.batteryOlderThan5Years === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "This field is required when Turo is selected",
          path: ["batteryOlderThan5Years"],
        });
      }
      if (data.batteryOlderThan5Years === false && data.voltageGreaterThan12_1V !== true) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Voltage must be greater than 12.1V to proceed",
          path: ["voltageGreaterThan12_1V"],
        });
      }
    }
  });

export type InspectionScope = z.infer<typeof inspectionScopeSchema>;
