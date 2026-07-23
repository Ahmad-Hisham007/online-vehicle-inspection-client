import { z } from "zod";

const licensePlatePattern = /^[A-Z0-9 -]{1,10}$/;

export const vehicleInfoSchema = z.object({
  licensePlate: z
    .string()
    .min(1, "License plate is required")
    .regex(licensePlatePattern, "Invalid license plate format"),
  mileage: z
    .number({ message: "Mileage is required" })
    .int("Mileage must be a whole number")
    .positive("Mileage must be positive"),
});

export type VehicleInfo = z.infer<typeof vehicleInfoSchema>;
