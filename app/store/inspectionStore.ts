import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  VehicleInfo,
  VinInfo,
  InspectionScope,
  UploadFields,
  ReviewAgreement,
} from "@/app/lib/schemas";

export interface FileMeta {
  name: string;
  size?: number;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  publicUrl?: string;
}

interface InspectionState {
  currentStep: number;
  vehicleInfo: VehicleInfo | null;
  vinInfo: VinInfo | null;
  inspectionScope: InspectionScope | null;
  uploadFields: UploadFields | null;
  reviewAgreement: ReviewAgreement | null;

  setStep: (step: number) => void;
  updateVehicleInfo: (data: VehicleInfo) => void;
  updateVinInfo: (data: VinInfo) => void;
  updateInspectionScope: (data: InspectionScope) => void;
  updateUploadField: (field: string, meta: FileMeta) => void;
  updateReviewAgreement: (data: ReviewAgreement) => void;
  reset: () => void;
}

export const useInspectionStore = create<InspectionState>()(
  persist(
    (set) => ({
      currentStep: 0,
      vehicleInfo: null,
      vinInfo: null,
      inspectionScope: null,
      uploadFields: null,
      reviewAgreement: null,

      setStep: (step) => set({ currentStep: step }),

      updateVehicleInfo: (data) => set({ vehicleInfo: data }),

      updateVinInfo: (data) => set({ vinInfo: data }),

      updateInspectionScope: (data) => set({ inspectionScope: data }),

      updateUploadField: (field, meta) =>
        set((state) => ({
          uploadFields: {
            ...(state.uploadFields ?? {}),
            [field]: meta,
          },
        })),

      updateReviewAgreement: (data) => set({ reviewAgreement: data }),

      reset: () =>
        set({
          currentStep: 0,
          vehicleInfo: null,
          vinInfo: null,
          inspectionScope: null,
          uploadFields: null,
          reviewAgreement: null,
        }),
    }),
    {
      name: "inspection-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
