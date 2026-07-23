import { z } from "zod";

const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;

export const vinInfoSchema = z.object({
  vin: z
    .string()
    .min(17, "VIN must be exactly 17 characters")
    .max(17, "VIN must be exactly 17 characters")
    .regex(vinPattern, "Invalid VIN format"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .number({ message: "Year is required" })
    .int("Year must be a whole number")
    .min(1900, "Year must be 1900 or later")
    .max(2030, "Year must be 2030 or earlier"),
  fuelType: z.enum(["gasoline", "diesel", "electric", "hybrid", "hydrogen"]),
});

export type VinInfo = z.infer<typeof vinInfoSchema>;
