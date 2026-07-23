import { z } from "zod";

export const reviewAgreementSchema = z.object({
  userAgreement: z
    .boolean()
    .refine((val) => val === true, "You must accept the User Agreement"),
  inspectionAgreement: z
    .boolean()
    .refine((val) => val === true, "You must accept the Inspection Agreement"),
});

export type ReviewAgreement = z.infer<typeof reviewAgreementSchema>;
