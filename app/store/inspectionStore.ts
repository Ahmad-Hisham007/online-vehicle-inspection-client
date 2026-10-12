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

/**
 * State for certificate generation approval forms.
 * Maintains a SINGLE SOURCE OF TRUTH for all companies within an inspection.
 * Keyed by inspectionId only - all companies merge into one object.
 */
export interface ApprovalCardState {
  // The inspection this data belongs to
  inspectionId: string;

  // SINGLE SOURCE OF TRUTH: Merged overrides from ALL company forms
  // Each form merges its updates into this object
  mergedOverrides: Record<string, string>;

  // Certificate URLs as they're generated/uploaded
  certificates: {
    lyft?: string;
    uber?: string;
    turo?: string;
  };

  // Track which forms have been processed
  generatedBy: {
    lyft: boolean;
    uber: boolean;
    turo: boolean;
  };

  // Track which forms have been saved with final URLs
  savedBy: {
    lyft: boolean;
    uber: boolean;
    turo: boolean;
  };
}

interface InspectionState {
  currentStep: number;
  vehicleInfo: VehicleInfo | null;
  vinInfo: VinInfo | null;
  inspectionScope: InspectionScope | null;
  uploadFields: UploadFields | null;
  reviewAgreement: ReviewAgreement | null;
  inspectionId: string | null;

  // SINGLE SOURCE OF TRUTH for all certificate forms in this inspection
  // Keyed by inspection ID only, contains merged data from all companies
  approvalCardState: Record<string, ApprovalCardState>;

  setStep: (step: number) => void;
  updateVehicleInfo: (data: VehicleInfo) => void;
  updateVinInfo: (data: VinInfo) => void;
  updateInspectionScope: (data: InspectionScope) => void;
  updateUploadField: (field: string, meta: FileMeta) => void;
  updateReviewAgreement: (data: ReviewAgreement) => void;
  setInspectionId: (id: string) => void;

  /**
   * Set approval card state for an inspection.
   * Merges with existing state to maintain single source of truth.
   */
  setApprovalCardState: (
    inspectionId: string,
    company: "lyft" | "uber" | "turo",
    updates: {
      overrides?: Record<string, string>;
      certificateUrl?: string;
      generated?: boolean;
      saved?: boolean;
    },
  ) => void;

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
      inspectionId: null,
      approvalCardState: {},

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

      setInspectionId: (id) => set({ inspectionId: id }),

      setApprovalCardState: (inspectionId, company, updates) =>
        set((state) => {
          const existing = state.approvalCardState[inspectionId];

          // Initialize if doesn't exist
          const newState = existing || {
            inspectionId,
            mergedOverrides: {},
            certificates: {},
            generatedBy: { lyft: false, uber: false, turo: false },
            savedBy: { lyft: false, uber: false, turo: false },
          };

          // Merge overrides (from form)
          const mergedOverrides = updates.overrides
            ? { ...newState.mergedOverrides, ...updates.overrides }
            : newState.mergedOverrides;

          // Update certificate URL for this company
          const certificates = existing
            ? { ...existing.certificates }
            : {};
          if (updates.certificateUrl) {
            certificates[company] = updates.certificateUrl;
          }

          // Update generated/saved status
          const generatedBy = { ...newState.generatedBy };
          if (updates.generated !== undefined) {
            generatedBy[company] = updates.generated;
          }

          const savedBy = { ...newState.savedBy };
          if (updates.saved !== undefined) {
            savedBy[company] = updates.saved;
          }

          return {
            approvalCardState: {
              ...state.approvalCardState,
              [inspectionId]: {
                ...newState,
                mergedOverrides,
                certificates,
                generatedBy,
                savedBy,
              },
            },
          };
        }),

      reset: () =>
        set({
          currentStep: 0,
          vehicleInfo: null,
          vinInfo: null,
          inspectionScope: null,
          uploadFields: null,
          reviewAgreement: null,
          inspectionId: null,
          approvalCardState: {},
        }),
    }),
    {
      name: "inspection-storage",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);