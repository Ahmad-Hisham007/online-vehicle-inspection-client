import { z } from "zod";

import { REJECTION_FIELD_VALUES } from "@/app/lib/rejection-fields";

export const rejectionSchema = z.object({
  invalidFields: z
    .array(z.enum(REJECTION_FIELD_VALUES))
    .min(1, "Select at least one invalid field"),
  rejectionReason: z
    .string()
    .trim()
    .min(1, "Rejection reason is required")
    .max(2000, "Reason is too long"),
});

export type RejectionFormValues = z.infer<typeof rejectionSchema>;
