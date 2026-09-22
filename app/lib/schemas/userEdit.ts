import { z } from "zod";

export const USER_ROLES = ["subscriber", "inspector", "administrator"] as const;

export const userEditSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  role: z.enum(USER_ROLES, { message: "Role is required" }),
});

export type UserEditInput = z.infer<typeof userEditSchema>;
