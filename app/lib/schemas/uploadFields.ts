import { z } from "zod";

const fileMetaSchema = z.object({
  name: z.string(),
  size: z.number().positive().optional(),
  status: z.enum(["pending", "uploading", "done", "error"]),
  progress: z.number().min(0).max(100).default(0),
  publicUrl: z.string().url().optional(),
});

export const uploadFieldsSchema = z.object({
  registrationCardPhoto: fileMetaSchema.optional(),
  odometerPhoto: fileMetaSchema.optional(),
  hornVideo: fileMetaSchema.optional(),
  interiorDriverSidePhoto: fileMetaSchema.optional(),
  driverSeatAdjustmentPhoto: fileMetaSchema.optional(),
  interiorPassengerSidePhoto: fileMetaSchema.optional(),
  passengerSeatAdjustmentPhoto: fileMetaSchema.optional(),
  interiorBackSeatPhoto: fileMetaSchema.optional(),
  exteriorLeftPhoto: fileMetaSchema.optional(),
  exteriorRightPhoto: fileMetaSchema.optional(),
  exteriorFrontVideo: fileMetaSchema.optional(),
  exteriorRearVideo: fileMetaSchema.optional(),
  leftFrontTirePhoto: fileMetaSchema.optional(),
  rightFrontTirePhoto: fileMetaSchema.optional(),
  leftRearTirePhoto: fileMetaSchema.optional(),
  rightRearTirePhoto: fileMetaSchema.optional(),
});

export type UploadFields = z.infer<typeof uploadFieldsSchema>;
